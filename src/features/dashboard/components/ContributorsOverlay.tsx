"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ContributorsOverlayProps {
  showContributors: boolean;
  setShowContributors: (val: boolean) => void;
  contributorNames: { name: string; top: string; left: string; size: string; scale: number; blur: string }[];
}

/**
 * Previously an abstract dreamscape of contributor names floating and
 * glowing at random positions, each bobbing up and down forever -- replaced
 * with a plain list, since continuous looping motion and drop-shadow glow
 * are both against the brief. Only each person's name is used now; the
 * position/size/blur fields on contributorNames are no longer read.
 */
export function ContributorsOverlay({ showContributors, setShowContributors, contributorNames }: ContributorsOverlayProps) {
  return (
    <AnimatePresence>
      {showContributors && (
        <motion.div
          key="contributors-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-100 bg-canvas/95 backdrop-blur-sm flex items-center justify-center px-6"
        >
          <div className="w-full max-w-sm bg-surface border border-line rounded-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-subhead text-ink">Contributors</h2>
              <button
                type="button"
                onClick={() => setShowContributors(false)}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <ul className="flex flex-col gap-3">
              {contributorNames.map((person) => (
                <li key={person.name} className="text-body-ui text-ink-secondary">
                  {person.name}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
