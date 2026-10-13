"use client";

import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { applyChatProposal, describeProposal, type ChatProposedAction } from "../applyProposal";

interface Turn {
  role: "user" | "assistant";
  text: string;
  /** Proposals attached to an assistant turn, each awaiting a decision. */
  proposals?: ChatProposedAction[];
  /** Per-proposal outcome, by index. Undefined = still awaiting a decision. */
  outcomes?: Record<number, "applied" | "rejected" | { error: string }>;
}

/**
 * §5b. Ask for a change in plain language; the assistant proposes, the owner
 * decides.
 *
 * Nothing is ever applied silently. A proposal sits in the transcript with
 * Accept and Not this one until the owner picks, and accepting runs it
 * through the manual endpoints that already exist (see ../applyProposal) --
 * there is no privileged apply path.
 */
export function ArchiveChatWidget({
  memoirId,
  onApplied,
}: {
  memoirId: string;
  /** Called after a proposal is applied so the chapter list can refresh. */
  onApplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    setError(null);
    setSending(true);
    setTurns((prev) => [...prev, { role: "user", text: message }]);

    try {
      // Only the plain conversation is replayed as history -- proposals are
      // this client's rendering concern, not part of the dialogue.
      const history = turns.map((t) => ({ role: t.role, content: t.text }));
      const res = await api.askArchive(memoirId, message, history);
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.reply,
          proposals: (res.proposed_actions ?? []) as ChatProposedAction[],
          outcomes: {},
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The co-author didn't answer. Try again.");
    } finally {
      setSending(false);
    }
  };

  const decide = async (
    turnIndex: number,
    proposalIndex: number,
    decision: "accept" | "reject",
  ) => {
    const key = `${turnIndex}:${proposalIndex}`;
    const proposal = turns[turnIndex]?.proposals?.[proposalIndex];
    if (!proposal) return;

    if (decision === "reject") {
      setTurns((prev) =>
        prev.map((t, i) =>
          i === turnIndex ? { ...t, outcomes: { ...t.outcomes, [proposalIndex]: "rejected" } } : t,
        ),
      );
      return;
    }

    setBusyKey(key);
    try {
      await applyChatProposal(memoirId, proposal);
      setTurns((prev) =>
        prev.map((t, i) =>
          i === turnIndex ? { ...t, outcomes: { ...t.outcomes, [proposalIndex]: "applied" } } : t,
        ),
      );
      onApplied();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not apply that change.";
      setTurns((prev) =>
        prev.map((t, i) =>
          i === turnIndex
            ? { ...t, outcomes: { ...t.outcomes, [proposalIndex]: { error: msg } } }
            : t,
        ),
      );
    } finally {
      setBusyKey(null);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 h-11 text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
      >
        <Sparkles size={14} /> Ask the co-author
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(26rem,calc(100vw-3rem))] rounded-md border border-border bg-card flex flex-col max-h-[min(34rem,calc(100vh-6rem))]">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles size={14} className="text-accent" /> Your co-author
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {turns.length === 0 && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ask about the shape of their story — &ldquo;move the bakery story into chapter
            two&rdquo;, &ldquo;rename chapter three&rdquo;, or just what you&rsquo;re still
            missing. Anything that would change the book is shown to you first.
          </p>
        )}

        {turns.map((turn, ti) => (
          <div key={ti} className={`flex flex-col ${turn.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`px-3.5 py-2.5 rounded-md max-w-[88%] text-xs leading-relaxed ${
                turn.role === "user"
                  ? "bg-secondary text-foreground"
                  : "border border-border text-foreground"
              }`}
            >
              {turn.text}
            </div>

            {turn.proposals?.map((p, pi) => {
              const outcome = turn.outcomes?.[pi];
              const key = `${ti}:${pi}`;
              return (
                <div
                  key={pi}
                  className="mt-2 w-full max-w-[88%] rounded-md border border-accent/40 bg-background p-3"
                >
                  <p className="text-xs font-medium text-foreground mb-1">{describeProposal(p)}</p>
                  {p.preview_before && p.preview_after && (
                    <p className="text-[11px] text-muted-foreground mb-1.5">
                      <span className="line-through">{p.preview_before}</span>{" "}
                      <span className="text-foreground">→ {p.preview_after}</span>
                    </p>
                  )}
                  {p.rationale && (
                    <p className="text-[11px] text-muted-foreground italic mb-2">{p.rationale}</p>
                  )}

                  {outcome === "applied" ? (
                    <p className="text-[11px] text-accent font-medium flex items-center gap-1">
                      <Check size={11} /> Done
                    </p>
                  ) : outcome === "rejected" ? (
                    <p className="text-[11px] text-muted-foreground">Left as it was.</p>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        disabled={busyKey === key}
                        onClick={() => decide(ti, pi, "accept")}
                        className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-3 h-7 text-[11px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      >
                        {busyKey === key ? "Applying…" : "Accept"}
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === key}
                        onClick={() => decide(ti, pi, "reject")}
                        className="rounded-full border border-border px-3 h-7 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Not this one
                      </button>
                    </div>
                  )}

                  {outcome && typeof outcome === "object" && (
                    <p role="alert" className="text-[11px] text-destructive mt-1.5">
                      {outcome.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {sending && <p className="text-xs text-muted-foreground italic">Thinking…</p>}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a change…"
          className="flex-1 min-w-0 h-9 px-3 rounded-md bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-accent text-accent-foreground px-4 h-9 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
