"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, X, Ban } from "lucide-react";
import { api, ShareLink } from "@/lib/api/client";
import { useExportMemoir } from "@/hooks/useExportMemoir";

interface PublishPanelProps {
  memoirId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Publish-to-share flow: publish (irreversible, warned up front), then the
 * share link, a password field, and a Download PDF button -- exactly what
 * the spec says the owner should see immediately after publishing. Reuses
 * the same modal-overlay look as ContributorsOverlay and the same input/
 * button styling as Subscription.tsx rather than inventing new chrome.
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
        setError(
          err instanceof Error ? err.message : "Could not publish this memoir.",
        );
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
          className="fixed inset-0 z-100 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-120 bg-memory-card border border-memory-border rounded-3xl px-8 py-8 shadow-sm relative"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-memory-muted hover:text-memory-primary cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="font-serif text-2xl text-memory-primary mb-1">Share This Memoir</h2>
            <p className="text-memory-muted text-[14px] mb-6">
              Publishing locks the memoir and makes it shareable. This cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-memory-muted text-sm py-6 text-center">Working...</p>
            ) : needsPublish ? (
              <button
                type="button"
                onClick={handlePublish}
                className="w-full py-4 rounded-xl text-[15px] font-semibold bg-memory-primary text-memory-light hover:bg-memory-maroon transition-all shadow-md cursor-pointer"
              >
                Publish &amp; Create Share Link
              </button>
            ) : justRevoked ? (
              <div className="text-center py-4">
                <p className="text-memory-primary text-sm mb-1">This link has been revoked.</p>
                <p className="text-memory-muted text-[13px] mb-5">
                  Anyone who had it can no longer open this memoir.
                </p>
                <button
                  type="button"
                  onClick={handleCreateNewLink}
                  className="px-5 py-3 rounded-xl text-[14px] font-semibold bg-memory-primary text-memory-light hover:bg-memory-maroon transition-all shadow-sm cursor-pointer"
                >
                  Create a New Link
                </button>
              </div>
            ) : shareLink ? (
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink.url}
                      className="flex-1 rounded-xl border border-memory-border bg-memory-bg px-4 py-3 text-[14px] text-memory-primary outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-4 rounded-xl bg-memory-primary text-white flex items-center justify-center cursor-pointer hover:bg-memory-maroon transition-colors"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="share-password"
                    className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 mb-1.5"
                  >
                    Access Password
                  </label>
                  <p className="text-[12px] text-memory-muted mb-2">
                    Give this password to family members personally -- they need it, plus their
                    name, to open the link.
                  </p>
                  <div className="flex gap-2">
                    <input
                      id="share-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="flex-1 rounded-xl border border-memory-border bg-memory-bg px-4 py-3 text-[14px] text-memory-primary placeholder:text-memory-muted/60 outline-none focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleSavePassword}
                      disabled={savingPassword || password.length === 0}
                      className="px-4 rounded-xl bg-memory-primary text-white text-[13px] font-semibold cursor-pointer hover:bg-memory-maroon transition-colors disabled:opacity-50"
                    >
                      {savingPassword ? "Saving..." : passwordSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-[13px] font-semibold text-memory-primary">Allow comments</p>
                    <p className="text-[11px] text-memory-muted">
                      Family who open the link can leave notes under their name.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shareLink.can_comment}
                    onClick={handleToggleComments}
                    disabled={savingComments}
                    className={`w-12 h-7 rounded-full relative transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
                      shareLink.can_comment ? "bg-memory-primary" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        shareLink.can_comment ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => triggerExport("memoir")}
                  disabled={isExporting}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold bg-memory-maroon text-white hover:bg-stone-800 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? "Preparing PDF..." : "Download PDF"}
                </button>

                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-red-700 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  {revoking ? "Revoking..." : "Revoke This Link"}
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
