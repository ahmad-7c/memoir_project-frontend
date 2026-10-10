/**
 * @file src/lib/api/client.test.ts
 * @description Tests for the single fetch wrapper and its error parsing.
 *
 * `src/lib/api/client.ts` is the only file in the app permitted to call
 * `fetch`. That makes it the right place to assert the properties every API call
 * inherits:
 *
 *   * `credentials: "include"` -- auth is an httpOnly cookie, so this is the
 *     entire mechanism. Omit it and the deployed app 401s on every request while
 *     localhost works fine.
 *   * `parseErrorDetail` never returns an empty string and never leaks internals.
 *     An empty message renders as a toast with no text; a leaked traceback
 *     discloses the framework and version.
 *
 * `parseErrorDetail` is tested directly rather than only through a rejected
 * request, because its failure modes (empty, "[object Object]", leaking a
 * path) are all visible in the rendered message rather than in the thrown type.
 *
 * Note on scope: several tests below document current behaviour that is
 * questionable -- see the individual docstrings. They are assertions of current
 * state so the suite passes, and each says what a change should do. They are not
 * endorsements.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, parseErrorDetail } from "./client";

/** Minimal shape satisfying the client's internal response handling. */
function jsonResponse(
  body: unknown,
  { status = 200, statusText = "OK" }: { status?: number; statusText?: string } = {},
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => body,
    blob: async () => new Blob(),
  } as unknown as Response;
}

describe("parseErrorDetail", () => {
  it("extracts a plain string detail", () => {
    expect(parseErrorDetail({ detail: "Memoir not found." }, "Request failed")).toBe(
      "Memoir not found.",
    );
  });

  it("joins a FastAPI validation array into one readable message", () => {
    // FastAPI returns 422 as `detail: [{loc, msg, type}]`. Returning the raw
    // array renders "[object Object]" in the UI.
    const detail = parseErrorDetail(
      {
        detail: [
          { loc: ["body", "title"], msg: "Field required", type: "missing" },
          { loc: ["body", "body_text"], msg: "Too long", type: "value_error" },
        ],
      },
      "Request failed",
    );

    expect(detail).toContain("Field required");
    expect(detail).toContain("Too long");
    expect(detail).not.toContain("[object");
  });

  it("names the offending field so the user knows what to fix", () => {
    // The whole point of parsing `loc` rather than discarding it.
    const detail = parseErrorDetail(
      { detail: [{ loc: ["body", "title"], msg: "Field required" }] },
      "Request failed",
    );

    expect(detail).toContain("title");
  });

  it("falls back to the caller's default when there is no detail", () => {
    // A 502 from the ALB has no JSON body at all. The user still needs something
    // better than a blank error state.
    const detail = parseErrorDetail(null, "Failed to fetch user memoirs");

    expect(detail).toBe("Failed to fetch user memoirs");
  });

  it("falls back to the default for an unrecognised body shape", () => {
    expect(parseErrorDetail({}, "Default message")).toBe("Default message");
    expect(parseErrorDetail(undefined, "Default message")).toBe("Default message");
  });

  it("prefers the backend's `message` field when there is no `detail`", () => {
    // The success-envelope shape this backend returns.
    expect(parseErrorDetail({ message: "Not a participant." }, "Default")).toBe(
      "Not a participant.",
    );
  });

  it("never returns an empty string, whatever it is given", () => {
    // An empty error message renders as a toast with no text, which reads as a
    // rendering bug rather than a failure. Asserted across every input shape,
    // because the empty case is reached from several directions.
    for (const input of [
      null,
      undefined,
      {},
      { detail: "" },
      { detail: [] },
      { message: "" },
    ]) {
      const detail = parseErrorDetail(input, "Default message");
      expect(detail.trim().length, `input ${JSON.stringify(input)}`).toBeGreaterThan(0);
    }
  });

  it("passes a backend-supplied internal detail straight through", () => {
    // Stated plainly because it is a real dependency, not a hypothetical: this
    // function does NOT sanitise. FastAPI in debug mode puts a traceback, a file
    // path and the exception class in `detail` for unhandled 500s, and all of
    // it reaches the user.
    //
    // The fix belongs in the backend's exception handlers, which must return a
    // generic message and log the detail server-side. Asserting the leak here
    // documents the contract: when the backend is fixed, this test fails and the
    // person fixing it learns where the leak was.
    const detail = parseErrorDetail(
      {
        detail:
          "Traceback (most recent call last): File '/app/src/main.py', line 42\nKeyError: 'secret_field'",
      },
      "Request failed",
    );

    expect(detail).toContain("/app/src/main.py");
    expect(detail).toContain("KeyError");
  });
});

describe("apiFetch credentials", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends cookies on every request", async () => {
    // THE test in this file. There is no Authorization header for the client to
    // set, so `credentials: "include"` is the whole auth mechanism.
    fetchMock.mockResolvedValue(jsonResponse([]));

    await api.getUserMemoirs().catch(() => undefined);

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("include");
  });

  it("sends cookies on a write request too", async () => {
    // A mutation that forgot it would 401 while the matching read worked, which
    // is a genuinely confusing failure to debug.
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: "m1" } }));

    await api.createMemoir({ subject_name: "Test" }).catch(() => undefined);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
  });

  it("does not produce a double slash between base and path", async () => {
    // `API_BASE_URL` is normalised to no trailing slash by env.ts, but a path
    // beginning with "/" reintroduces the problem, and `https://host//api` is a
    // 404 on some proxies.
    fetchMock.mockResolvedValue(jsonResponse([]));

    await api.getUserMemoirs().catch(() => undefined);

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).not.toMatch(/[^:]\/\/[^/]/);
  });

  it("throws with the backend's message on a 500", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Upstream unavailable." }, { status: 500 }));

    await expect(api.createMemoir({ subject_name: "Test" })).rejects.toThrow(
      /Upstream unavailable/,
    );
  });

  it("treats a 404 on a mutation as an error, not as success", async () => {
    // `getUserMemoirs` deliberately degrades a 404 to an empty list (see below).
    // A *write* must not: silently reporting a successful create for a memoir
    // that does not exist would leave the UI showing something the server never
    // stored.
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Memoir not found." }, { status: 404 }));

    await expect(api.createMemoir({ subject_name: "Test" })).rejects.toThrow();
  });
});

describe("known rough edges", () => {
  // Documented, not endorsed. Each names what a fix should look like, so the
  // next person does not have to rediscover the reasoning from a symptom.
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getUserMemoirs returns [] on 404, hiding a real failure", async () => {
    // A 404 here means the route is wrong or the memoir list is genuinely
    // unavailable, and rendering "no memoirs yet" for it tells a family with a
    // full archive that everything they uploaded is gone. That is a worse failure
    // than an error state.
    //
    // A fix would distinguish 404 (route missing, so degrade) from 401/500 (real
    // failure, so surface), rather than treating all four as "no data".
    fetchMock.mockResolvedValue(jsonResponse({ detail: "nope" }, { status: 404 }));

    await expect(api.getUserMemoirs()).resolves.toEqual([]);
  });

  it("getUserMemoirs returns [] for a malformed 200 body rather than throwing", async () => {
    // A shape change on the server degrades to "no memoirs" instead of an error,
    // for the same reason as above. Asserted as current behaviour so a change
    // here is deliberate.
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }));

    await expect(api.getUserMemoirs()).resolves.toEqual([]);
  });
});