"use client";

import { useMemo, useState } from "react";
import { useComments } from "./useComments";
import type { CommentEntity } from "@/lib/api/client";

interface MemoryCommentsProps {
  memoirId: string;
  memoryId?: string;
  narrativeSectionId?: string;
  canComment: boolean;
  /** Set on the reader share page only -- routes through /api/share/{shareToken}/comments. */
  shareToken?: string;
  readerToken?: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Margin notes, not a social feed. No likes, no counts shown as a metric, no
 * sorting control -- just what was said, by whom, and a quiet way to add to
 * it. Collapsed behind a small link by default so a memoir's own words stay
 * the thing the eye lands on first.
 */
export function MemoryComments({
  memoirId,
  memoryId,
  narrativeSectionId,
  canComment,
  shareToken,
  readerToken,
}: MemoryCommentsProps) {
  const [open, setOpen] = useState(false);
  const { comments, loading, submitting, error, addComment } = useComments(
    { memoryId, narrativeSectionId },
    memoirId,
    shareToken,
    readerToken,
  );
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const { roots, repliesByParent } = useMemo(() => {
    const repliesByParent = new Map<string, CommentEntity[]>();
    const roots: CommentEntity[] = [];
    for (const c of comments) {
      if (c.parent_comment_id) {
        const list = repliesByParent.get(c.parent_comment_id) || [];
        list.push(c);
        repliesByParent.set(c.parent_comment_id, list);
      } else {
        roots.push(c);
      }
    }
    return { roots, repliesByParent };
  }, [comments]);

  const handleSubmit = async () => {
    if (!draft.trim()) return;
    await addComment(draft.trim());
    setDraft("");
    setOpen(true);
  };

  const handleReply = async (parentId: string) => {
    if (!replyDraft.trim()) return;
    await addComment(replyDraft.trim(), parentId);
    setReplyDraft("");
    setReplyTo(null);
  };

  if (!open && comments.length === 0 && !canComment) {
    // Nothing to show and no way to add anything -- render nothing at all
    // rather than an empty "Comments" affordance.
    return null;
  }

  return (
    <div className="mt-4 max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[13px] text-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <span aria-hidden="true">💬</span>
        {open ? "Hide notes" : roots.length > 0 ? "Family notes" : "Leave a little note"}
      </button>

      {open && (
        <div className="mt-3 pl-4 border-l border-border flex flex-col gap-3">
          {loading && <p className="text-xs text-muted-foreground italic">Loading…</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}

          {roots.map((comment) => (
            <div key={comment.id}>
              <p className="font-serif text-xs text-muted-foreground leading-relaxed">&ldquo;{comment.body}&rdquo;</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-muted-foreground">
                  {comment.author_name || "A family member"} · {formatTime(comment.created_at)}
                </p>
                {canComment && (
                  <button
                    type="button"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-[10px] text-muted-foreground hover:text-muted-foreground cursor-pointer"
                  >
                    Reply
                  </button>
                )}
              </div>

              {(repliesByParent.get(comment.id) || []).map((reply) => (
                <div key={reply.id} className="mt-2 pl-4 border-l border-border">
                  <p className="font-serif text-xs text-muted-foreground leading-relaxed">&ldquo;{reply.body}&rdquo;</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {reply.author_name || "A family member"} · {formatTime(reply.created_at)}
                  </p>
                </div>
              ))}

              {replyTo === comment.id && (
                <div className="flex gap-2 mt-2 pl-4">
                  <input
                    type="text"
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                    placeholder="Write a reply…"
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-sm bg-secondary border border-border text-xs text-foreground outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(comment.id)}
                    disabled={submitting || !replyDraft.trim()}
                    className="px-3 py-1.5 rounded-sm border border-border text-muted-foreground hover:bg-secondary text-[10px] font-semibold cursor-pointer disabled:opacity-40 shrink-0 transition-colors"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}

          {canComment && (
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Leave a note…"
                className="flex-1 min-w-0 px-3 py-2 rounded-sm bg-secondary border border-border text-xs text-foreground outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !draft.trim()}
                className="px-3 py-2 rounded-sm border border-border text-muted-foreground hover:bg-secondary text-[10px] font-semibold cursor-pointer disabled:opacity-40 shrink-0 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
