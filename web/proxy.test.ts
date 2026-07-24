import { describe, it, expect, vi, beforeEach } from "vitest";

const { fnVerify, fnSession } = vi.hoisted(() => ({
  fnVerify: vi.fn(),
  fnSession: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn((init) => ({ status: 200, _mock: "NextResponse.next", init })),
    json: vi.fn((data, init) => ({ status: init?.status ?? 200, _json: data })),
    redirect: vi.fn((url, status) => ({ status: status ?? 302, _mock: "NextResponse.redirect", url })),
  },
  NextRequest: vi.fn().mockImplementation(() => ({
    headers: new Map(),
    nextUrl: { pathname: "", search: "" },
  })),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      verifyApiKey: fnVerify,
      getSession: fnSession,
    },
  },
}));

const { NextResponse } = await import("next/server");
const { proxy } = await import("./proxy");

describe("proxy middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(headers: Record<string, string>, pathname = "/api/posts", search = ""): any {
    return {
      headers: new Map(Object.entries(headers)),
      nextUrl: { pathname, search },
    };
  }

  describe("main domain — API auth flow", () => {
    beforeEach(() => {
      // Ensure POSTS_DOMAIN is NOT set for these tests (no redirect)
      delete process.env.POSTS_DOMAIN
    })

    it("sets x-user-id from a valid API key", async () => {
      fnVerify.mockResolvedValueOnce({
        valid: true,
        key: { referenceId: "user-123" },
      });

      await proxy(makeRequest({ "x-api-key": "post_valid_key" }));

      expect(fnVerify).toHaveBeenCalledWith({ body: { key: "post_valid_key" } });
      expect(NextResponse.next).toHaveBeenCalled();
      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.get("x-user-id")).toBe("user-123");
    });

    it("does not set x-user-id when API key is invalid", async () => {
      fnVerify.mockResolvedValueOnce({ valid: false, key: null });

      await proxy(makeRequest({ "x-api-key": "post_invalid" }));

      expect(fnVerify).toHaveBeenCalled();
      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.has("x-user-id")).toBe(false);
    });

    it("falls back to session when no API key is present", async () => {
      fnSession.mockResolvedValueOnce({
        user: { id: "user-session-456" },
        session: { id: "sess-1" },
      });

      await proxy(makeRequest({}));

      expect(fnSession).toHaveBeenCalled();
      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.get("x-user-id")).toBe("user-session-456");
    });

    it("strips client-supplied x-user-id when no auth at all", async () => {
      fnSession.mockResolvedValueOnce(null);

      await proxy(makeRequest({ "x-user-id": "fake-user-999" }));

      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.has("x-user-id")).toBe(false);
    });

    it("strips client-supplied x-user-id even when auth succeeds", async () => {
      fnVerify.mockResolvedValueOnce({
        valid: true,
        key: { referenceId: "real-user-456" },
      });

      await proxy(makeRequest({
        "x-api-key": "post_valid",
        "x-user-id": "fake-user-999",
      }));

      const call = vi.mocked(NextResponse.next).mock.calls[0];
      expect(call[0]?.request?.headers?.get("x-user-id")).toBe("real-user-456");
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

    it("preserves query params in the redirect", async () => {
      await proxy(makeRequest({}, "/p/some-id", "?key=abc123"));

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        "https://postshare.andro42.qzz.io/p/some-id?key=abc123",
        302,
      );
    });

    it("does not redirect /api/* paths", async () => {
      fnVerify.mockResolvedValueOnce({
        valid: true,
        key: { referenceId: "user-123" },
      });

      await proxy(makeRequest({ "x-api-key": "valid" }, "/api/posts"));

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(fnVerify).toHaveBeenCalled();
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
      const res = await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/api/posts"));

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not found" },
        { status: 404 },
      );
    });

    it("blocks /dashboard on the posts domain with 404", async () => {
      const res = await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/dashboard"));

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not found" },
        { status: 404 },
      );
    });

    it("blocks root / on the posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/"));

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not found" },
        { status: 404 },
      );
    });

    it("passes through with no auth overhead on posts domain", async () => {
      await proxy(makeRequest({ host: "postshare.andro42.qzz.io" }, "/p/some-id"));

      expect(fnVerify).not.toHaveBeenCalled();
      expect(fnSession).not.toHaveBeenCalled();
    });
  });
});
