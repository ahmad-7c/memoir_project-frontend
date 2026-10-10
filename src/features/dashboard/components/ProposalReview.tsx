/**
 * @file features/dashboard/components/ProposalReview.tsx
 * @description Owner review panel for an AI organization proposal.
 *
 * The whole point of this component is that it is a *review*, not a confirmation
 * dialog for something already done. Until the owner presses Apply, no chapter
 * has been written — the backend holds the plan and this panel only holds its
 * id.
 *
 * Two things it deliberately does:
 *  - shows `warnings` prominently, including that AI-written summaries may not
 *    match the family's own words and that originals are untouched;
 *  - shows the unplaced count, because a plan that silently dropped memories
 *    would look identical to one that placed them all.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Info,
  Sparkles,
  X,
  Loader2,
  FolderTree,
} from "lucide-react";
import type { OrganizationProposal } from "../types/organization";

interface ProposalReviewProps {
  proposal: OrganizationProposal;
  onApply: () => void;
  onDiscard: () => void;
  isApplying: boolean;
}

export function ProposalReview({
  proposal,
  onApply,
  onDiscard,
  isApplying,
}: ProposalReviewProps) {
  const { plan, warnings } = proposal;
  const aiChapters = plan.chapters.filter(
    (c) => c.summary && c.title !== "Other Memories",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className="w-full max-w-3xl mx-auto my-10 font-sans"
      role="region"
      aria-label="Review proposed chapters"
    >
      <div className="bg-[#FAF7F2] border-2 border-memory-primary/30 rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-xl bg-memory-primary/10">
              <FolderTree size={20} className="text-memory-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-2xl text-stone-900">
                Review your chapters
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                Nothing has been changed yet. Read through this, then apply it
                when you&apos;re happy.
              </p>
            </div>
          </div>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 divide-x divide-stone-200 border-b border-stone-200 bg-white">
          <Stat
            value={proposal.memories_placed}
            label={proposal.memories_placed === 1 ? "memory placed" : "memories placed"}
          />
          <Stat
            value={plan.chapters.length}
            label={plan.chapters.length === 1 ? "chapter" : "chapters"}
          />
          <Stat
            value={proposal.memories_unplaced}
            label={proposal.memories_unplaced === 1 ? "unplaced" : "unplaced"}
            muted={proposal.memories_unplaced === 0}
            warn={proposal.memories_unplaced > 0}
          />
        </div>

        {/* Warnings — the reason this is a review */}
        {warnings.length > 0 && (
          <div className="px-6 py-5 bg-[#FDF8F3] border-b border-stone-200 space-y-3">
            {warnings.map((warning, i) => {
              const isCaution = warning.includes("couldn't be confidently placed");
              return (
                <div key={i} className="flex gap-3 items-start">
                  {isCaution ? (
                    <AlertTriangle
                      size={16}
                      className="text-amber-600 shrink-0 mt-0.5"
                    />
                  ) : (
                    <Info size={16} className="text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <p className="text-[13px] leading-relaxed text-stone-700">
                    {warning}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Chapter list */}
        <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
          {plan.chapters.map((chapter, index) => (
            <div key={index} className="px-6 py-4 bg-white">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-stone-400 shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="font-semibold text-stone-900 text-[17px] flex-1">
                  {chapter.title}
                </h4>
                <span className="text-xs text-stone-400 shrink-0">
                  {chapter.memory_ids.length}{" "}
                  {chapter.memory_ids.length === 1 ? "memory" : "memories"}
                </span>
              </div>

              {chapter.summary && (
                <div className="mt-2 ml-8 pl-3 border-l-2 border-memory-primary/20">
                  <p className="text-[13px] leading-relaxed text-stone-600 font-serif">
                    {chapter.summary}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    <Sparkles size={10} />
                    AI-written · editable after applying
                  </p>
                </div>
              )}

              {chapter.title === "Other Memories" && (
                <p className="mt-2 ml-8 text-[12px] text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                  These memories weren&apos;t confidently placed. You can move
                  them into any chapter after applying.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Replaced chapters notice */}
        {proposal.chapters_replaced > 0 && (
          <div className="px-6 py-3 bg-stone-50 border-t border-stone-200">
            <p className="text-[12px] text-stone-500">
              This will replace{" "}
              <strong className="text-stone-700">
                {proposal.chapters_replaced} existing AI-generated
              </strong>{" "}
              {proposal.chapters_replaced === 1 ? "chapter" : "chapters"}.
              Chapters you&apos;ve edited yourself are never touched.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-5 bg-white border-t border-stone-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-[12px] text-stone-500 sm:max-w-xs">
            Your original memories are never rewritten or deleted — chapters are
            just a way of viewing and grouping them.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDiscard}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={15} />
              Not now
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-memory-primary text-white font-semibold text-sm hover:bg-[#5a222a] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isApplying ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Apply {plan.chapters.length}{" "}
                  {plan.chapters.length === 1 ? "chapter" : "chapters"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {aiChapters.length > 0 && (
        <p className="mt-3 text-center text-[11px] text-stone-400">
          {aiChapters.length}{" "}
          {aiChapters.length === 1 ? "chapter carries" : "chapters carry"}{" "}
          AI-written summaries. Please read them carefully — they may include
          detail your family never wrote.
        </p>
      )}
    </motion.div>
  );
}

function Stat({
  value,
  label,
  muted,
  warn,
}: {
  value: number;
  label: string;
  muted?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="px-4 py-4 text-center">
      <div
        className={`font-serif text-3xl leading-none ${
          warn ? "text-amber-600" : muted ? "text-stone-400" : "text-stone-900"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mt-1.5">
        {label}
      </div>
    </div>
  );
}