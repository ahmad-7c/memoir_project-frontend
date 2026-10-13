import { api } from "@/lib/api/client";

export interface ChatProposedAction {
  action_type: string;
  target_memory_ids: string[];
  target_chapter_id?: string | null;
  preview_before?: string;
  preview_after?: string;
  rationale?: string;
}

/**
 * Carries out one chat proposal the owner has accepted.
 *
 * There is no chat-apply endpoint, and deliberately so: each action is
 * translated into the manual endpoint that already exists for it, and each
 * of those re-verifies ownership server-side. Nothing here is a privileged
 * path -- every call is something the owner could do by hand in the UI, so
 * a tampered proposal can only ever perform an action they were already
 * entitled to perform.
 *
 * Only the four applicable action types reach here; the backend never
 * proposes the other three (see APPLICABLE_CHAT_ACTIONS), because an
 * approvable change that nothing can carry out is worse than no suggestion.
 */
export async function applyChatProposal(
  memoirId: string,
  action: ChatProposedAction,
): Promise<void> {
  const chapterId = action.target_chapter_id ?? "";

  switch (action.action_type) {
    case "move_memory":
    case "merge_into_chapter": {
      if (!chapterId || action.target_memory_ids.length === 0) {
        throw new Error("That suggestion is missing the chapter or memory it refers to.");
      }
      // Sequential, not Promise.all: these are writes against the same
      // memoir and a half-applied parallel batch is harder to reason about
      // than a slower sequential one that stops at the first failure.
      for (const memoryId of action.target_memory_ids) {
        await api.moveMemory(memoirId, memoryId, chapterId);
      }
      return;
    }

    case "rename_chapter": {
      const title = (action.preview_after ?? "").trim();
      if (!chapterId || !title) {
        throw new Error("That suggestion is missing the new chapter title.");
      }
      await api.renameChapter(memoirId, chapterId, title);
      return;
    }

    case "rewrite_chapter_summary": {
      const summary = (action.preview_after ?? "").trim();
      if (!chapterId || !summary) {
        throw new Error("That suggestion is missing the new summary.");
      }
      await api.updateChapter(memoirId, chapterId, { summary });
      return;
    }

    default:
      // Reachable only if the backend's applicable-action list and this
      // switch drift apart. Fail loudly rather than silently doing nothing
      // after the owner pressed Accept.
      throw new Error(`"${action.action_type}" can't be applied automatically yet.`);
  }
}

/** Human-readable one-liner for a proposal, used in the review UI. */
export function describeProposal(action: ChatProposedAction): string {
  switch (action.action_type) {
    case "move_memory":
      return action.target_memory_ids.length === 1
        ? "Move this memory into another chapter"
        : `Move ${action.target_memory_ids.length} memories into another chapter`;
    case "merge_into_chapter":
      return `Bring ${action.target_memory_ids.length} memories together in one chapter`;
    case "rename_chapter":
      return "Rename this chapter";
    case "rewrite_chapter_summary":
      return "Rewrite this chapter's summary";
    default:
      return action.action_type.replace(/_/g, " ");
  }
}
