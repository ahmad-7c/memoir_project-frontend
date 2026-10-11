"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api, Participant } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { InitialAvatar } from "@/components/ui/InitialAvatar";

interface ContributorsOverlayProps {
  show: boolean;
  onClose: () => void;
  memoirId: string;
  participants: Participant[];
  participantsLoading: boolean;
}

/**
 * Real family & sharing panel: who has actually joined (from
 * `GET /api/memoirs/{id}/participants`, not a placeholder name list), plus
 * the real invite link. Copying the link publishes the memoir first if it
 * isn't already (idempotent server-side) -- a reader share link can't exist
 * on an unpublished memoir, same behaviour this app's share flow has always
 * had, just wired here instead of silently dropped.
 */
export function ContributorsOverlay({ show, onClose, memoirId, participants, participantsLoading }: ContributorsOverlayProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopyLink = async () => {
    setCopying(true);
    setCopyError(null);
    try {
      await api.publishMemoir(memoirId);
      const link = await api.createShareLink(memoirId);
      if (link?.url) {
        await navigator.clipboard.writeText(link.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : "Could not create the invite link.");
    } finally {
      setCopying(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-100 bg-background/95 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-foreground">Bring your family in</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-6">
          <Button onClick={handleCopyLink} loading={copying} className="w-full">
            {copying ? "Preparing link…" : copied ? "Link copied" : "Copy invite link"}
          </Button>
          {copyError && <p className="mt-2 text-xs text-destructive">{copyError}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            Anyone with this link and the password you set can read and comment.
          </p>
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-3">
            Who&rsquo;s joined
          </p>
          {participantsLoading ? (
            <p className="text-xs text-muted-foreground italic">Loading…</p>
          ) : participants.length === 0 ? (
            <p className="text-xs text-muted-foreground">No one&rsquo;s joined yet — share the link above.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 text-sm text-foreground">
                  <InitialAvatar initial={p.display_name[0]?.toUpperCase() || "?"} size={28} />
                  {p.display_name}
                  {p.relationship_label && (
                    <span className="text-xs text-muted-foreground">&middot; {p.relationship_label}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
