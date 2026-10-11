"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, X, Ban } from "lucide-react";
import { api, ShareLink } from "@/lib/api/client";
import { useExportMemoir } from "@/hooks/useExportMemoir";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PublishPanelProps {
  memoirId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Publish-to-share flow: publish (irreversible, warned up front), then the
 * share link, a password field, and a Download PDF button -- exactly what
 * the spec says the owner should see immediately after publishing.
 */
export function PublishPanel({ memoirId, open, onClose }: PublishPanelProps) {
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [needsPublish, setNeedsPublish] = useState(false);
  const [savingComments, setSavingComments] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [justRevoked, setJustRevoked] = useState(false);

  const { triggerExport, isExporting } = useExportMemoir(memoirId);

  const loadExistingLink = async () => {
    setLoading(true);
    setError(null);
    try {
      // Publishing already creates the link atomically -- this call is just
      // fetching whatever already exists. A 409 here means "not published
      // yet", not a real error.
      const link = await api.createShareLink(memoirId);
      setShareLink(link);
      setNeedsPublish(false);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setNeedsPublish(true);
      } else {
        setError(err instanceof Error ? err.message : "Could not load the share link.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Deferred a tick so no setState call executes synchronously within the
    // effect body itself (only inside this callback) -- same constraint
    // final-memoir/page.tsx works around elsewhere in this codebase.
    Promise.resolve().then(() => {
      if (open && memoirId) {
        loadExistingLink();
      }
      // Reset transient UI state each time the panel is reopened.
      if (!open) {
        setPassword("");
        setPasswordSaved(false);
        setCopied(false);
        setJustRevoked(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memoirId]);

  const handlePublish = async () => {
    const confirmed = window.confirm(
      "Publishing is permanent. Once published, this memoir can no longer be edited, " +
        "and it becomes shareable with a link. Are you sure you want to publish now?",
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      await api.publishMemoir(memoirId);
      await loadExistingLink();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        // Someone else (or a second click) already published it -- just
        // fetch the link that publish already created rather than erroring.
        await loadExistingLink();
      } else {
        setError(err instanceof Error ? err.message : "Could not publish this memoir.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    setError(null);
    try {
      await api.updateShareLink(memoirId, { password });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save the password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleComments = async () => {
    if (!shareLink) return;
    setSavingComments(true);
    setError(null);
    try {
      const updated = await api.updateShareLink(memoirId, { can_comment: !shareLink.can_comment });
      setShareLink(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update commenting.");
    } finally {
      setSavingComments(false);
    }
  };

  const handleRevoke = async () => {
    const confirmed = window.confirm(
      "Revoking this link makes it dead immediately. Everyone currently holding it -- " +
        "anyone who has it saved, bookmarked, or hasn't opened it yet -- will lose access. " +
        "You can create a new link afterwards, but it will be a different link. Revoke now?",
    );
    if (!confirmed) return;

    setRevoking(true);
    setError(null);
    try {
      await api.revokeShareLink(memoirId);
      setShareLink(null);
      setJustRevoked(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not revoke the share link.");
    } finally {
      setRevoking(false);
    }
  };

  const handleCreateNewLink = async () => {
    setJustRevoked(false);
    await loadExistingLink();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="publish-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-100 bg-canvas/90 backdrop-blur-sm flex items-center justify-center px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full max-w-md bg-surface border border-line rounded-md px-8 py-8 relative"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-ink-muted hover:text-ink cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="font-serif text-subhead text-ink mb-1">Share this memoir</h2>
            <p className="text-body-ui text-ink-secondary mb-6">
              Publishing locks the memoir and makes it shareable. This cannot be undone.
            </p>

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-3 rounded-md border border-line bg-canvas px-4 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
                <p className="text-small text-ink">{error}</p>
              </div>
            )}

            {loading ? (
              <p className="text-body-ui text-ink-muted py-6 text-center">Working…</p>
            ) : needsPublish ? (
              <Button type="button" onClick={handlePublish} className="w-full">
                Publish and create share link
              </Button>
            ) : justRevoked ? (
              <div className="text-center py-4">
                <p className="text-body-ui text-ink mb-1">This link has been revoked.</p>
                <p className="text-small text-ink-muted mb-5">Anyone who had it can no longer open this memoir.</p>
                <Button type="button" onClick={handleCreateNewLink}>
                  Create a new link
                </Button>
              </div>
            ) : shareLink ? (
              <div className="flex flex-col gap-5">
                <div>
                  <Label>Share link</Label>
                  <div className="flex gap-2">
                    <Input type="text" readOnly value={shareLink.url} className="flex-1" />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-4 rounded-sm bg-brass text-on-brass flex items-center justify-center cursor-pointer hover:bg-brass-bright transition-colors shrink-0"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="share-password">Access password</Label>
                  <p className="text-small text-ink-muted mb-2 -mt-1">
                    Give this password to family members personally -- they need it, plus their name, to open the link.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="share-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleSavePassword}
                      disabled={savingPassword || password.length === 0}
                      className="px-4 rounded-sm border border-line text-ink-secondary text-small font-semibold cursor-pointer hover:bg-surface-sunk transition-colors disabled:opacity-50 shrink-0"
                    >
                      {savingPassword ? "Saving…" : passwordSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-body-ui font-medium text-ink">Allow comments</p>
                    <p className="text-small text-ink-muted">Family who open the link can leave notes under their name.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shareLink.can_comment}
                    onClick={handleToggleComments}
                    disabled={savingComments}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
                      shareLink.can_comment ? "bg-brass" : "bg-surface-sunk border border-line"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-surface transition-transform ${
                        shareLink.can_comment ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <Button type="button" onClick={() => triggerExport("memoir")} disabled={isExporting} variant="secondary" className="w-full">
                  {isExporting ? "Preparing PDF…" : "Download PDF"}
                </Button>

                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="w-full py-2.5 rounded-sm text-small font-semibold text-alert hover:bg-surface-sunk transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  {revoking ? "Revoking…" : "Revoke this link"}
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
