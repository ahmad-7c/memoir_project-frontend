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
    <div className="mt-4 font-sans">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] uppercase tracking-[0.15em] text-memory-muted hover:text-memory-primary dark:hover:text-memory-ink transition-colors cursor-pointer"
      >
        {open ? "Hide notes" : roots.length > 0 ? "Family notes" : "Leave a note"}
      </button>

      {open && (
        <div className="mt-3 pl-4 border-l border-memory-border dark:border-memory-border space-y-3">
          {loading && <p className="text-xs text-memory-muted italic">Loading…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}

          {roots.map((comment) => (
            <div key={comment.id} className="text-sm">
              <p className="font-serif italic text-memory-primary dark:text-memory-ink leading-relaxed">
                &ldquo;{comment.body}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-memory-muted">
                  {comment.author_name || "A family member"} · {formatTime(comment.created_at)}
                </p>
                {canComment && (
                  <button
                    type="button"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-[11px] text-memory-muted hover:text-memory-primary dark:hover:text-memory-ink cursor-pointer"
                  >
                    Reply
                  </button>
                )}
              </div>

              {(repliesByParent.get(comment.id) || []).map((reply) => (
                <div key={reply.id} className="mt-2 pl-4 border-l border-memory-border/60 dark:border-memory-border/60">
                  <p className="font-serif italic text-memory-primary dark:text-memory-ink leading-relaxed text-[13px]">
                    &ldquo;{reply.body}&rdquo;
                  </p>
                  <p className="text-[10px] text-memory-muted mt-0.5">
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
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-memory-card border border-memory-border text-[13px] outline-none focus:border-memory-accent"
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(comment.id)}
                    disabled={submitting || !replyDraft.trim()}
                    className="px-3 py-1.5 rounded-lg bg-memory-primary dark:bg-memory-gold text-memory-light dark:text-memory-dark-end text-[11px] font-semibold cursor-pointer disabled:opacity-40"
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
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-memory-card border border-memory-border text-sm outline-none focus:border-memory-accent"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !draft.trim()}
                className="px-3 py-2 rounded-lg bg-memory-primary dark:bg-memory-gold text-memory-light dark:text-memory-dark-end text-xs font-semibold cursor-pointer disabled:opacity-40"
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
