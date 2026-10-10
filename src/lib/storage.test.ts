/**
 * @file src/lib/storage.test.ts
 * @description Tests for the localStorage reader.
 *
 * Imported from the team branch (`frontend/refactor-and-error-fixes`, commit
 * 07680bb), which is where this module and its tests were written. Kept
 * verbatim in behaviour; the cases here mirror theirs.
 *
 * Why this module earns its own file: `localStorage` throws in three separate
 * situations that all look like ordinary reads from application code -- a
 * corrupt value, an unavailable API during SSR, and a quota failure on write.
 * Without a wrapper each call site has to remember that, and one of them will
 * not.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { readStorage } from "./storage";

describe("readStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the parsed value for a key that exists", () => {
    window.localStorage.setItem("memoir-draft", JSON.stringify({ title: "Grandma" }));

    expect(readStorage("memoir-draft")).toEqual({ title: "Grandma" });
  });

  it("returns null for a key that was never written", () => {
    // Not undefined. `null` is the deliberate choice so callers can
    // `?? fallback` without distinguishing "absent" from "stored as null".
    expect(readStorage("never-written")).toBeNull();
  });

  it("returns null for a corrupt value instead of throwing", () => {
    // The behaviour that matters most. A half-written draft (tab closed during
    // a write, or a value written by an older version) must degrade to "nothing
    // saved", not take down a page that was mid-render.
    window.localStorage.setItem("memoir-draft", "{not json");

    expect(() => readStorage("memoir-draft")).not.toThrow();
    expect(readStorage("memoir-draft")).toBeNull();
  });

  it("returns null when localStorage itself throws", () => {
    // Safari in private mode, and quota-exhausted storage, both throw on access
    // rather than on write. Without this the app crashes on a page that only
    // *reads* a draft.
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(readStorage("memoir-draft")).toBeNull();
  });

  it("preserves falsy values that were genuinely stored", () => {
    // The trap a `||` fallback would introduce: `0`, `false` and `""` are real
    // stored values, and collapsing them to null loses information.
    window.localStorage.setItem("count", JSON.stringify(0));
    window.localStorage.setItem("flag", JSON.stringify(false));
    window.localStorage.setItem("text", JSON.stringify(""));

    expect(readStorage("count")).toBe(0);
    expect(readStorage("flag")).toBe(false);
    expect(readStorage("text")).toBe("");
  });

  it("preserves a stored null as null", () => {
    window.localStorage.setItem("nothing", JSON.stringify(null));

    expect(readStorage("nothing")).toBeNull();
  });

  it("reads primitive values without wrapping them", () => {
    window.localStorage.setItem("number", JSON.stringify(42));
    window.localStorage.setItem("string", JSON.stringify("hello"));

    expect(readStorage<number>("number")).toBe(42);
    expect(readStorage<string>("string")).toBe("hello");
  });

  it("reads an array as an array", () => {
    window.localStorage.setItem("list", JSON.stringify([1, 2, 3]));

    expect(readStorage<number[]>("list")).toEqual([1, 2, 3]);
  });
});