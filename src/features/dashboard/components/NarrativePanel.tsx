"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Sparkles, Trash2, RotateCcw, X } from "lucide-react";
import { api, NarrativeSection } from "@/lib/api/client";
import { NarrativeSources } from "@/features/narrative/NarrativeSources";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

interface NarrativePanelProps {
  memoirId: string;
  open: boolean;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 100; // ~5 minutes, matching the backend's stall threshold

/**
 * Owner review panel for the AI-composed narrative. Mirrors ProposalReview's
 * shape (review before anything is final) but for narrative sections:
 * generate, read every section with its Sources, edit/delete/regenerate one
 * at a time, then explicitly mark reviewed -- required before publish.
 */
export function NarrativePanel({ memoirId, open, onClose }: NarrativePanelProps) {
  const [sections, setSections] = useState<NarrativeSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSections = () => {
    api
      .getNarrativeSections(memoirId)
      .then((data) => setSections(data))
      .catch(() => setSections([]));
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = (onSettled?: () => void) => {
    let attempts = 0;
    stopPolling();
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const status = await api.getNarrativeStatus(memoirId);
        if (status.status === "ready") {
          stopPolling();
          setIsProcessing(false);
          setWarnings(status.warnings || []);
          loadSections();
          onSettled?.();
        } else if (status.status === "failed" || status.status === "stalled") {
          stopPolling();
          setIsProcessing(false);
          setError(status.error_message || "Something went wrong. You can try again.");
          onSettled?.();
        } else if (attempts >= POLL_MAX_ATTEMPTS) {
          stopPolling();
          setIsProcessing(false);
          setError("This is taking unusually long. You can try again.");
          onSettled?.();
        }
      } catch {
        // A transient polling failure isn't fatal -- keep polling.
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!open || !memoirId) return;
    Promise.resolve().then(() => {
      setError(null);
      loadSections();
    });
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memoirId]);

  const handleGenerate = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      await api.generateNarrative(memoirId);
      pollStatus();
    } catch (err: unknown) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : "Could not start narrative generation.");
    }
  };

  const handleSaveEdit = async (sectionId: string) => {
    try {
      const updated = await api.updateNarrativeSection(memoirId, sectionId, editDraft);
      setSections((prev) => prev.map((s) => (s.id === sectionId ? updated : s)));
      setEditingId(null);
      setReviewed(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save this edit.");
    }
  };

  const handleDelete = async (sectionId: string) => {
    try {
      await api.deleteNarrativeSection(memoirId, sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      setReviewed(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not delete this section.");
    }
  };

  const handleRegenerate = async (sectionId: string) => {
    setRegeneratingId(sectionId);
    setError(null);
    try {
      await api.regenerateNarrativeSection(memoirId, sectionId);
      pollStatus(() => setRegeneratingId(null));
    } catch (err: unknown) {
      setRegeneratingId(null);
      setError(err instanceof Error ? err.message : "Could not regenerate this section.");
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await api.markNarrativeReviewed(memoirId);
      setReviewed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not mark the narrative reviewed.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="narrative-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-100 bg-background/90 backdrop-blur-sm flex items-center justify-center px-6 py-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-md relative"
          >
            <div className="sticky top-0 bg-card border-b border-border px-6 py-5 flex items-start gap-3 z-10">
              <Sparkles size={18} className="text-muted-foreground mt-1 shrink-0" />
              <div className="flex-1">
                <h3 className="font-serif text-xl text-foreground">The narrative</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Composed from your family&apos;s own memories. Every section cites exactly
                  what it draws from -- review it before publishing.
                </p>
              </div>
              <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {error && (
                <div role="alert" className="flex gap-2.5 items-start border border-border rounded-md px-4 py-3">
                  <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{error}</p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="border border-border rounded-md px-4 py-3 flex flex-col gap-1.5">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {sections.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Compose a flowing biography from this memoir&apos;s chapters. Every
                    sentence will trace back to a real memory -- nothing is invented.
                  </p>
                  <Button type="button" onClick={handleGenerate} loading={isProcessing}>
                    <Sparkles size={14} />
                    {isProcessing ? "Composing…" : "Compose the narrative"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-5">
                    {sections.map((section) => (
                      <div key={section.id} className="border border-border rounded-md p-4">
                        {editingId === section.id ? (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={5}
                              className="font-serif text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(section.id)}
                                className="px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-sm border border-border text-muted-foreground text-xs font-medium cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-serif text-sm text-muted-foreground whitespace-pre-wrap">{section.body}</p>
                            {section.owner_edited && (
                              <p className="mt-1.5 text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Edited by you</p>
                            )}
                            <NarrativeSources memoirId={memoirId} sectionId={section.id} />
                            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(section.id);
                                  setEditDraft(section.body);
                                }}
                                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRegenerate(section.id)}
                                disabled={regeneratingId === section.id}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw size={12} />
                                {regeneratingId === section.id ? "Regenerating…" : "Regenerate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(section.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:text-foreground cursor-pointer"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <p className="text-xs text-muted-foreground max-w-xs">Publishing requires reviewing this narrative first.</p>
                    {reviewed ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm border border-calm/50 text-muted-foreground text-sm font-medium">
                        <Check size={14} />
                        Reviewed
                      </span>
                    ) : (
                      <Button type="button" onClick={handleMarkReviewed}>
                        <Check size={14} />
                        Mark as reviewed
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
