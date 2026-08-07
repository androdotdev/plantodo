import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// Prevent neon client from throwing during module import in tests
process.env.DATABASE_URL ??= "postgresql://fake:fake@localhost:5432/test";

const { fnVerify, fnSession } = vi.hoisted(() => ({
  fnVerify: vi.fn(),
  fnSession: vi.fn(),
}));

vi.mock("next/server", () => {
  const nextResponse = Object.assign(
    vi.fn(function (body?: unknown, init?: ResponseInit) {
      return { status: init?.status ?? 200, body, headers: init?.headers }
    }),
    {
      next: vi.fn((init) => ({ status: 200, _mock: "NextResponse.next", init })),
      json: vi.fn((data, init) => ({ status: init?.status ?? 200, _json: data })),
      redirect: vi.fn((url, status) => ({ status: status ?? 302, _mock: "NextResponse.redirect", url })),
    },
  )
  return { NextResponse: nextResponse as unknown as typeof import("next/server").NextResponse,
    NextRequest: vi.fn().mockImplementation(() => ({
      headers: new Map(),
      nextUrl: { pathname: "", search: "" },
    })),
  };
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      verifyApiKey: fnVerify,
      getSession: fnSession,
    },
  },
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ isPrivate: true }])),
      })),
    })),
  },
}));

const { NextResponse } = await import("next/server");
const { proxy } = await import("./proxy");

describe("proxy middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(headers: Record<string, string>, pathname = "/api/posts", search = ""): NextRequest {
    return {
      headers: new Map(Object.entries(headers)),
      nextUrl: { pathname, search, searchParams: new URLSearchParams(search) },
    } as unknown as NextRequest;
  }

  describe("main domain — API paths", () => {
    beforeEach(() => {
      // Ensure POSTS_DOMAIN is NOT set for these tests (no redirect)
      delete process.env.POSTS_DOMAIN
    })

    it("passes /api/posts through without re-verifying auth", async () => {
      await proxy(makeRequest({ "x-api-key": "post_valid_key" }));

      expect(fnVerify).not.toHaveBeenCalled();
      expect(fnSession).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("strips client-supplied x-user-id", async () => {
      await proxy(makeRequest({ "x-user-id": "fake-user-999" }));

      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.has("x-user-id")).toBe(false);
    });

    it("does not add x-user-id for API paths", async () => {
      await proxy(makeRequest({}));

      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.has("x-user-id")).toBe(false);
    });

    it("skips auth overhead for non-API paths on main domain", async () => {
      // /p/:id on main domain should pass through without auth
      await proxy(makeRequest({}, "/p/some-id"));

      expect(fnVerify).not.toHaveBeenCalled();
      expect(fnSession).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("main domain — redirect to posts domain", () => {
    beforeEach(() => {
      process.env.POSTS_DOMAIN = "postshare.andro42.qzz.io"
    })

    afterEach(() => {
      delete process.env.POSTS_DOMAIN
    })

    it("redirects /p/:id to the posts domain", async () => {
      await proxy(makeRequest({}, "/p/some-id"));

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        "https://postshare.andro42.qzz.io/p/some-id",
        302,
      );
    });

    it("normalizes a trailing slash before redirecting", async () => {
      await proxy(makeRequest({}, "/p/some-id/"));

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        "https://postshare.andro42.qzz.io/p/some-id",
        302,
      );
    });

    it("preserves query params but drops a stale key in the redirect", async () => {
      await proxy(makeRequest({}, "/p/some-id", "?key=stale-token&utm=test"));

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        "https://postshare.andro42.qzz.io/p/some-id?utm=test",
        302,
      );
    });

    it("redirects authenticated user with a signed token", async () => {
      process.env.POST_TOKEN_SECRET = "test-secret-that-is-at-least-32-chars!!";
      fnSession.mockResolvedValueOnce({ user: { id: "user-456" } });

      await proxy(makeRequest({}, "/p/post-123"));

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/postshare\.andro42\.qzz\.io\/p\/post-123\?key=[\w-]+\.[\w-]+$/),
        302,
      );
      delete process.env.POST_TOKEN_SECRET;
    });

    it("does not redirect /api/* paths", async () => {
      await proxy(makeRequest({ "x-api-key": "valid" }, "/api/posts"));

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(fnVerify).not.toHaveBeenCalled();
    });
  });

  describe("posts domain — route gating", () => {
    beforeEach(() => {
      process.env.POSTS_DOMAIN = "postshare.andro42.qzz.io"
    })

    afterEach(() => {
      delete process.env.POSTS_DOMAIN
    })

    it("allows /p/:id on the posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/p/some-id"));

      expect(NextResponse.next).toHaveBeenCalled();
      expect(fnVerify).not.toHaveBeenCalled();  // no auth overhead
    });

    it("blocks /api/* on the posts domain with 404", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/api/posts"));

      expect(NextResponse).toHaveBeenCalledWith(
        expect.stringContaining("This domain only shows pages"),
        expect.objectContaining({ status: 404 }),
      );
    });

    it("blocks /dashboard on the posts domain with 404", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/dashboard"));

      expect(NextResponse).toHaveBeenCalledWith(
        expect.stringContaining("This domain only shows pages"),
        expect.objectContaining({ status: 404 }),
      );
    });

    it("blocks root / on the posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/"));

      expect(NextResponse).toHaveBeenCalledWith(
        expect.stringContaining("This domain only shows pages"),
        expect.objectContaining({ status: 404 }),
      );
    });

    it("blocks sub-paths of /p/ on the posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/p/foo/bar"));

      expect(NextResponse).toHaveBeenCalledWith(
        expect.stringContaining("This domain only shows pages"),
        expect.objectContaining({ status: 404 }),
      );
    });

    it("blocks bare /p/ on the posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/p/"));

      expect(NextResponse).toHaveBeenCalledWith(
        expect.stringContaining("This domain only shows pages"),
        expect.objectContaining({ status: 404 }),
      );
    });

    it("passes through with no auth overhead on posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/p/some-id"));

      expect(fnVerify).not.toHaveBeenCalled();
      expect(fnSession).not.toHaveBeenCalled();
    });
  });
});
