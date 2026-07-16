import { describe, it, expect, vi, beforeEach } from "vitest";

const { fnVerify, fnSession } = vi.hoisted(() => ({
  fnVerify: vi.fn(),
  fnSession: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn((init) => ({ status: 200, _mock: "NextResponse.next", init })),
    json: vi.fn((data, init) => ({ status: init?.status ?? 200, _json: data })),
  },
  NextRequest: vi.fn().mockImplementation(() => ({ headers: new Map() })),
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

  function makeRequest(headers: Record<string, string>) {
    return { headers: new Map(Object.entries(headers)) };
  }

  it("sets x-user-id from a valid API key", async () => {
    fnVerify.mockResolvedValueOnce({
      valid: true,
      key: { referenceId: "user-123" },
    });

    const req = makeRequest({ "x-api-key": "ptd_valid_key" });
    await proxy(req);

    expect(fnVerify).toHaveBeenCalledWith({ body: { key: "ptd_valid_key" } });
    expect(NextResponse.next).toHaveBeenCalled();
    const call = vi.mocked(NextResponse.next).mock.calls[0];
    expect(call[0]?.request?.headers?.get("x-user-id")).toBe("user-123");
  });

  it("does not set x-user-id when API key is invalid", async () => {
    fnVerify.mockResolvedValueOnce({ valid: false, key: null });

    const req = makeRequest({ "x-api-key": "ptd_invalid" });
    await proxy(req);

    expect(fnVerify).toHaveBeenCalled();
    const call = vi.mocked(NextResponse.next).mock.calls[0];
    expect(call[0]?.request?.headers?.has("x-user-id")).toBe(false);
  });

  it("falls back to session when no API key is present", async () => {
    fnSession.mockResolvedValueOnce({
      user: { id: "user-session-456" },
      session: { id: "sess-1" },
    });

    const req = makeRequest({});
    await proxy(req);

    expect(fnSession).toHaveBeenCalled();
    const call = vi.mocked(NextResponse.next).mock.calls[0];
    expect(call[0]?.request?.headers?.get("x-user-id")).toBe("user-session-456");
  });

  it("strips client-supplied x-user-id when no auth at all", async () => {
    fnSession.mockResolvedValueOnce(null);

    const req = makeRequest({ "x-user-id": "fake-user-999" });
    await proxy(req);

    const call = vi.mocked(NextResponse.next).mock.calls[0];
    expect(call[0]?.request?.headers?.has("x-user-id")).toBe(false);
  });

  it("strips client-supplied x-user-id even when auth succeeds", async () => {
    fnVerify.mockResolvedValueOnce({
      valid: true,
      key: { referenceId: "real-user-456" },
    });

    const req = makeRequest({
      "x-api-key": "ptd_valid",
      "x-user-id": "fake-user-999",
    });
    await proxy(req);

    const call = vi.mocked(NextResponse.next).mock.calls[0];
    // x-user-id should be the verified value, not the forged one
    expect(call[0]?.request?.headers?.get("x-user-id")).toBe("real-user-456");
  });
});
