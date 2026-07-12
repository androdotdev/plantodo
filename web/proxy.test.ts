import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextRequest/NextResponse before importing the module under test
vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn((init?: any) => ({ status: 200, _mock: "NextResponse.next", init })),
    json: vi.fn((data: any, init?: any) => ({ status: init?.status ?? 200, _json: data })),
  },
  NextRequest: vi.fn().mockImplementation(() => ({
    headers: new Map(),
  })),
}));

// Mock auth module — use inline mock object to avoid variable name issues
const mockAuth = { verifyKey: vi.fn(), getSession: vi.fn() };
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      verifyApiKey: mockAuth.verifyKey,
      getSession: mockAuth.getSession,
    },
  },
}));

// Import after mocks are set up
const { NextResponse } = await import("next/server");
const { proxy } = await import("./proxy");

describe("proxy middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(headers: Record<string, string>): any {
    return {
      headers: new Map(Object.entries(headers)),
    } as any;
  }

  it("sets x-user-id from a valid API key", async () => {
    mockAuth.verifyKey.mockResolvedValueOnce({
      valid: true,
      key: { referenceId: "user-123" },
    });

    const req = makeRequest({ "x-api-key": "ptd_valid_key" });
    await proxy(req);

    expect(mockAuth.verifyKey).toHaveBeenCalledWith({
      body: { key: "ptd_valid_key" },
    });
    expect(NextResponse.next).toHaveBeenCalled();
    const call = (NextResponse.next as any).mock.calls[0];
    const headers = call?.[0]?.request?.headers;
    expect(headers?.get("x-user-id")).toBe("user-123");
  });

  it("does not set x-user-id when API key is invalid", async () => {
    mockAuth.verifyKey.mockResolvedValueOnce({
      valid: false,
      key: null,
    });

    const req = makeRequest({ "x-api-key": "ptd_invalid" });
    await proxy(req);

    expect(mockAuth.verifyKey).toHaveBeenCalled();
    const call = (NextResponse.next as any).mock.calls[0];
    const headers = call?.[0]?.request?.headers;
    expect(headers?.get("x-user-id")).toBeUndefined();
  });

  it("falls back to session when no API key is present", async () => {
    mockAuth.getSession.mockResolvedValueOnce({
      user: { id: "user-session-456" },
      session: { id: "sess-1" },
    });

    const req = makeRequest({});
    await proxy(req);

    expect(mockAuth.getSession).toHaveBeenCalled();
    const call = (NextResponse.next as any).mock.calls[0];
    const headers = call?.[0]?.request?.headers;
    expect(headers?.get("x-user-id")).toBe("user-session-456");
  });

  it("does not set x-user-id when no auth at all", async () => {
    mockAuth.getSession.mockResolvedValueOnce(null);

    const req = makeRequest({});
    await proxy(req);

    const call = (NextResponse.next as any).mock.calls[0];
    const headers = call?.[0]?.request?.headers;
    expect(headers?.get("x-user-id")).toBeUndefined();
  });
});
