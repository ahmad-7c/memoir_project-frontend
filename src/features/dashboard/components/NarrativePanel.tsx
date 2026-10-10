"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Loader2, Sparkles, Trash2, RotateCcw, X } from "lucide-react";
import { api, NarrativeSection } from "@/lib/api/client";
import { NarrativeSources } from "@/features/narrative/NarrativeSources";

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
          className="fixed inset-0 z-100 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center px-6 py-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FAF7F2] border-2 border-memory-primary/30 rounded-2xl shadow-lg relative"
          >
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-5 flex items-start gap-3 z-10">
              <div className="mt-0.5 p-2 rounded-xl bg-memory-primary/10">
                <Sparkles size={20} className="text-memory-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-2xl text-stone-900">The Narrative</h3>
                <p className="text-sm text-stone-600 mt-1">
                  Composed from your family&apos;s own memories. Every section cites exactly
                  what it draws from -- review it before publishing.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-stone-400 hover:text-memory-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="flex gap-2.5 items-start bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-800 leading-relaxed">{error}</p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1.5">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-[13px] text-amber-800 leading-relaxed">
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {sections.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-stone-600 mb-6 max-w-sm mx-auto">
                    Compose a flowing biography from this memoir&apos;s chapters. Every
                    sentence will trace back to a real memory -- nothing is invented.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-memory-primary hover:bg-[#5a222a] transition-all shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Composing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Compose the Narrative
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-5">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="bg-white border border-stone-200 rounded-xl p-4"
                      >
                        {editingId === section.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={5}
                              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm font-serif outline-none focus:border-memory-primary"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(section.id)}
                                className="px-3 py-1.5 rounded-lg bg-memory-primary text-white text-xs font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[15px] font-serif leading-relaxed text-stone-800 whitespace-pre-wrap">
                              {section.body}
                            </p>
                            {section.owner_edited && (
                              <p className="mt-1.5 text-[10px] uppercase tracking-wider text-stone-400">
                                Edited by you
                              </p>
                            )}
                            <NarrativeSources memoirId={memoirId} sectionId={section.id} />
                            <div className="flex gap-3 mt-3 pt-3 border-t border-stone-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(section.id);
                                  setEditDraft(section.body);
                                }}
                                className="text-[11px] font-semibold text-stone-500 hover:text-memory-primary cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRegenerate(section.id)}
                                disabled={regeneratingId === section.id}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-memory-primary cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw size={11} className={regeneratingId === section.id ? "animate-spin" : ""} />
                                Regenerate
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(section.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 size={11} />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[12px] text-stone-500 max-w-xs">
                      Publishing requires reviewing this narrative first.
                    </p>
                    <button
                      type="button"
                      onClick={handleMarkReviewed}
                      disabled={reviewed}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors ${
                        reviewed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-memory-primary text-white hover:bg-[#5a222a]"
                      }`}
                    >
                      <Check size={15} />
                      {reviewed ? "Reviewed" : "Mark as Reviewed"}
                    </button>
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
