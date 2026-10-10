/**
 * @file src/lib/validations/memory.test.ts
 * @description Tests for the memory input Zod schema.
 *
 * This schema is the last gate before a memory body reaches the database. Every
 * message here is shown to a grieving family member mid-recount, so the wording
 * is part of the contract, not an implementation detail -- which is why the
 * message text is asserted here rather than only the failure.
 */

import { describe, expect, it } from "vitest";

import { memoryInputSchema } from "./memory";

describe("memoryInputSchema", () => {
  describe("title", () => {
    it("accepts an ordinary title", () => {
      const result = memoryInputSchema.safeParse({ title: "The garden in August" });

      expect(result.success).toBe(true);
    });

    it("rejects an empty title", () => {
      // An untitled memory is still a memory -- the body is what matters -- but
      // the form requires a title, because a list of blank rows is unusable.
      const result = memoryInputSchema.safeParse({ title: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/title/i);
      }
    });

    it("rejects a whitespace-only title", () => {
      // `.trim()` is what makes this fail rather than pass with "   " stored.
      const result = memoryInputSchema.safeParse({ title: "   " });

      expect(result.success).toBe(false);
    });

    it("trims surrounding whitespace from an accepted title", () => {
      const result = memoryInputSchema.safeParse({ title: "  The garden  " });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("The garden");
      }
    });

    it("rejects a missing title", () => {
      const result = memoryInputSchema.safeParse({ body_text: "some text" });

      expect(result.success).toBe(false);
    });
  });

  describe("body_text", () => {
    it("defaults to an empty string when omitted", () => {
      // A photo-only memory has no written body, and that must be a valid
      // submission rather than an error the user cannot resolve.
      const result = memoryInputSchema.safeParse({ title: "A photograph" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body_text).toBe("");
      }
    });

    it("accepts a long body", () => {
      // No upper bound on purpose: a memoir entry can legitimately run to
      // several thousand words, and truncating someone's account of their own
      // life to satisfy a form validation is not acceptable.
      const long = "a".repeat(50_000);
      const result = memoryInputSchema.safeParse({ title: "Long", body_text: long });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body_text).toHaveLength(50_000);
      }
    });

    it("preserves internal newlines and punctuation", () => {
      // The body is the family's own words. It is stored verbatim, so a
      // transformation here would be a silent edit to a memory.
      const body = "She said:\n\n\"I'll be home by six.\"\n\n— and she was.";
      const result = memoryInputSchema.safeParse({ title: "Quote", body_text: body });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body_text).toBe(body);
      }
    });
  });

  describe("occurred_start", () => {
    it("accepts an ISO date", () => {
      const result = memoryInputSchema.safeParse({
        title: "Dated",
        occurred_start: "1984-07-12",
      });

      expect(result.success).toBe(true);
    });

    it("accepts null for an undated memory", () => {
      // The common case. Most memories have no known date, and forcing one
      // would mean inventing a fact about someone's life.
      const result = memoryInputSchema.safeParse({ title: "Undated", occurred_start: null });

      expect(result.success).toBe(true);
    });

    it("accepts undefined", () => {
      const result = memoryInputSchema.safeParse({ title: "Undated" });

      expect(result.success).toBe(true);
    });

    it("preserves a partial date string as typed", () => {
      // "1980s" and "circa 1962" are legitimate: memoir sources are frequently
      // approximate, and a date picker would force false precision. The backend
      // stores the string and treats it as advisory for chronological ordering.
      const result = memoryInputSchema.safeParse({
        title: "Approximate",
        occurred_start: "circa 1962",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.occurred_start).toBe("circa 1962");
      }
    });
  });

  describe("unknown fields", () => {
    it("strips a field the schema does not declare", () => {
      // Zod's default behaviour. Worth asserting because it is what stops a
      // stale client from writing columns the form does not know about -- but
      // note it strips rather than rejects, so a typo'd field name is silently
      // dropped instead of erroring.
      const result = memoryInputSchema.safeParse({
        title: "Valid",
        body_text: "text",
        chapter_id: "someone-elses-chapter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect("chapter_id" in result.data).toBe(false);
      }
    });
  });
});