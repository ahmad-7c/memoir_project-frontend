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
 *
 * The three counts (placed / chapters / unplaced) were previously a 3-column
 * stat-tile grid -- replaced with one plain sentence, since metric tiles are
 * explicitly forbidden on the dashboard.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Info, Sparkles, X, FolderTree } from "lucide-react";
import type { OrganizationProposal } from "../types/organization";
import { Button } from "@/components/ui/Button";

interface ProposalReviewProps {
  proposal: OrganizationProposal;
  onApply: () => void;
  onDiscard: () => void;
  isApplying: boolean;
}

export function ProposalReview({ proposal, onApply, onDiscard, isApplying }: ProposalReviewProps) {
  const { plan, warnings } = proposal;
  const aiChapters = plan.chapters.filter((c) => c.summary && c.title !== "Other Memories");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="w-full max-w-3xl mx-auto my-10"
      role="region"
      aria-label="Review proposed chapters"
    >
      <div className="bg-surface border border-line rounded-md overflow-hidden">
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-start gap-3">
            <FolderTree size={18} className="text-ink-secondary mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-serif text-subhead text-ink">Review your chapters</h3>
              <p className="text-body-ui text-ink-secondary mt-1">
                Nothing has been changed yet. Read through this, then apply it when you&apos;re ready.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-line">
          <p className="text-body-ui text-ink-secondary">
            {proposal.memories_placed} {proposal.memories_placed === 1 ? "memory" : "memories"} placed across{" "}
            {plan.chapters.length} {plan.chapters.length === 1 ? "chapter" : "chapters"}.
            {proposal.memories_unplaced > 0 && (
              <span className="text-ink">
                {" "}
                {proposal.memories_unplaced} couldn&apos;t be confidently placed.
              </span>
            )}
          </p>
        </div>

        {warnings.length > 0 && (
          <div className="px-6 py-5 border-b border-line flex flex-col gap-3">
            {warnings.map((warning, i) => {
              const isCaution = warning.includes("couldn't be confidently placed");
              return (
                <div key={i} className="flex gap-3 items-start">
                  {isCaution ? (
                    <AlertTriangle size={14} className="text-alert shrink-0 mt-0.5" />
                  ) : (
                    <Info size={14} className="text-ink-muted shrink-0 mt-0.5" />
                  )}
                  <p className="text-small text-ink-secondary">{warning}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto divide-y divide-line">
          {plan.chapters.map((chapter, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-small text-ink-muted shrink-0">{String(index + 1).padStart(2, "0")}</span>
                <h4 className="font-serif text-subhead text-ink flex-1">{chapter.title}</h4>
                <span className="text-small text-ink-muted shrink-0">
                  {chapter.memory_ids.length} {chapter.memory_ids.length === 1 ? "memory" : "memories"}
                </span>
              </div>

              {chapter.summary && (
                <div className="mt-2 ml-8 pl-3 border-l-2 border-line">
                  <p className="font-serif text-body-read text-ink-secondary">{chapter.summary}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-micro uppercase tracking-[0.06em] text-ink-muted font-semibold">
                    <Sparkles size={10} />
                    AI-written, editable after applying
                  </p>
                </div>
              )}

              {chapter.title === "Other Memories" && (
                <p className="mt-2 ml-8 text-small text-ink-secondary">
                  These weren&apos;t confidently placed. You can move them into any chapter after applying.
                </p>
              )}
            </div>
          ))}
        </div>

        {proposal.chapters_replaced > 0 && (
          <div className="px-6 py-3 border-t border-line">
            <p className="text-small text-ink-muted">
              This will replace {proposal.chapters_replaced} existing AI-generated{" "}
              {proposal.chapters_replaced === 1 ? "chapter" : "chapters"}. Chapters you&apos;ve edited yourself are never touched.
            </p>
          </div>
        )}

        <div className="px-6 py-5 border-t border-line flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <p className="text-small text-ink-muted sm:max-w-xs">
            Your original memories are never rewritten or deleted — chapters are just a way of viewing and grouping them.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDiscard}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm border border-line text-ink-secondary font-medium text-body-ui hover:bg-surface-sunk transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={14} />
              Not now
            </button>
            <Button type="button" onClick={onApply} loading={isApplying}>
              <Check size={14} />
              {isApplying ? "Applying…" : `Apply ${plan.chapters.length} ${plan.chapters.length === 1 ? "chapter" : "chapters"}`}
            </Button>
          </div>
        </div>
      </div>

      {aiChapters.length > 0 && (
        <p className="mt-3 text-center text-small text-ink-muted">
          {aiChapters.length} {aiChapters.length === 1 ? "chapter carries" : "chapters carry"} AI-written summaries. Please
          read them carefully — they may include detail your family never wrote.
        </p>
      )}
    </motion.div>
  );
}
