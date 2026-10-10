/**
 * @file features/dashboard/types/organization.ts
 * @description Zod contracts for the AI organization surface.
 *
 * Per the project convention, every API response is validated at the boundary —
 * no unvalidated data enters the app. These schemas are the client-side half of
 * that rule, and they are deliberately kept structurally in step with
 * `backend/src/schemas/organization.py`.
 *
 * If a field changes on the backend, change it here in the same commit. A
 * mismatch shows up as a parse error at the boundary rather than as `undefined`
 * three components deep.
 */

import { z } from "zod";

export const DatePrecisionSchema = z.enum(["day", "month", "year", "decade"]);

export const ResolvedMemoryPlacementSchema = z.object({
  memory_id: z.string(),
  chapter_index: z.number().int().nonnegative(),
  position: z.number().int().nonnegative(),
  inferred_date: DatePrecisionSchema.nullable().optional(),
});

export const ResolvedChapterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  era_label: z.string().nullable().optional(),
  sort_order: z.number().int().nonnegative(),
  memory_ids: z.array(z.string()),
});

export const ResolvedPlanSchema = z.object({
  chapters: z.array(ResolvedChapterSchema),
  unplaced_memory_ids: z.array(z.string()),
});

export const OrganizeStatusSchema = z.object({
  success: z.boolean(),
  status: z.enum(["none", "queued", "running", "ready", "failed", "stalled"]),
  error_message: z.string().nullable().optional(),
  retry_available: z.boolean(),
  current_stage: z.string().nullable().optional(),
  stages: z.array(z.string()).default([]),
});

/**
 * The owner's review payload.
 *
 * `warnings` is load-bearing, not decoration: it is how the backend tells the
 * owner what the proposal does and does not cover (memories that landed in the
 * catch-all, which chapters carry AI-written prose). A review screen that can
 * only show "looks good" is not a review.
 */
export const OrganizationProposalSchema = z.object({
  proposal_id: z.string(),
  status: z.enum(["pending", "applied", "superseded", "expired"]),
  source: z.enum(["organize", "chat"]),
  summary_line: z.string(),
  plan: ResolvedPlanSchema,
  warnings: z.array(z.string()).default([]),
  memories_considered: z.number().int().nonnegative(),
  memories_placed: z.number().int().nonnegative(),
  memories_unplaced: z.number().int().nonnegative(),
  chapters_replaced: z.number().int().nonnegative().default(0),
  expires_at: z.string().nullable().optional(),
});

/** Result of confirming a proposal. `data` mirrors the backend's apply response. */
export const ApplyProposalResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    chapter_count: z.number().int().nonnegative(),
    memories_placed: z.number().int().nonnegative(),
    memories_unplaced: z.number().int().nonnegative(),
  }),
});

export const ProposalListResponseSchema = z.object({
  success: z.boolean(),
  data: OrganizationProposalSchema.nullable(),
});

export const ProposedActionSchema = z.object({
  action_type: z.enum([
    "move_memory",
    "merge_into_chapter",
    "rename_chapter",
    "rewrite_chapter_summary",
    "reorder_chapters",
    "create_chapter",
    "split_chapter",
  ]),
  target_memory_ids: z.array(z.string()).default([]),
  target_chapter_id: z.string().nullable().optional(),
  preview_before: z.string(),
  preview_after: z.string(),
  rationale: z.string(),
});

export const ChatResponseSchema = z.object({
  success: z.boolean(),
  reply: z.string(),
  proposed_actions: z.array(ProposedActionSchema).default([]),
});

export const ChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  sort_order: z.number().int(),
  created_by: z.string(),
  edited_by_owner: z.boolean(),
  memories: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().nullable(),
        body_text: z.string().nullable(),
        occurred_start: z.string().nullable(),
        occurred_precision: z.string().nullable(),
        chapter_id: z.string().nullable(),
        position_in_chapter: z.number().int().nullable(),
      }),
    )
    .default([]),
});

export type ApplyProposalResult = z.infer<typeof ApplyProposalResultSchema>;
export type ResolvedChapter = z.infer<typeof ResolvedChapterSchema>;
export type ResolvedPlan = z.infer<typeof ResolvedPlanSchema>;
export type OrganizationProposal = z.infer<typeof OrganizationProposalSchema>;
export type ProposalListResponse = z.infer<typeof ProposalListResponseSchema>;
export type OrganizeStatus = z.infer<typeof OrganizeStatusSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;

/**
 * Narrowing helper for the chapter shape the dashboard renders.
 *
 * The dashboard passes chapter data into a component that only needs `id` and
 * `title`, so this asserts exactly that much is present. If the backend's select
 * ever stops returning `title`, the failure surfaces here as a type error
 * rather than as an empty heading in the rendered book.
 */
export function toChapterList(value: unknown): Chapter[] {
  return z.array(ChapterSchema).parse(value);
}