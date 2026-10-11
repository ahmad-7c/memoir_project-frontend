"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BookCoverExperienceProps {
  children: React.ReactNode;
  userName?: string;
}

/**
 * No-op subscription for useSyncExternalStore.
 *
 * The value being tracked (browser vs server) can never change within a single
 * page's lifetime, so there is nothing to subscribe to. This exists only to
 * give useSyncExternalStore the subscribe function it requires.
 */
const subscribeToNothing = () => () => {};

/**
 * A brief, once-per-session welcome before the dashboard appears. Previously
 * a 9-second full-screen takeover with 30 drifting particles, rotating
 * "paper", a pulsing text-glow, and scroll lock -- running on every single
 * visit, because the sessionStorage gate meant to limit it to once was
 * commented out ("DEVELOPMENT OVERRIDE"). That is a real bug fixed here,
 * not just a restyle: a grieving, time-poor person should not be forced
 * through an un-skippable multi-second animation every time they open their
 * own dashboard. What replaced it is one fade, under two seconds, with
 * nothing scaling, bouncing, or glowing -- consistent with the rest of the
 * app's motion rules.
 */
export function BookCoverExperience({
  children,
  userName = "Author",
}: BookCoverExperienceProps) {
  const [isVisible, setIsVisible] = useState(true);

  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenBookCover");
    if (hasSeen) {
      // Deferred a tick so this setState call doesn't execute synchronously
      // within the effect body -- same constraint worked around elsewhere
      // in this codebase.
      Promise.resolve().then(() => setIsVisible(false));
      return;
    }
    sessionStorage.setItem("hasSeenBookCover", "true");

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-canvas overflow-x-hidden">
      <div className="w-full min-h-screen">{children}</div>

      {isClient && (
        <AnimatePresence>
          {isVisible && (
            <motion.div
              key="overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed inset-0 z-200 bg-canvas flex items-center justify-center select-none px-6"
            >
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                className="font-serif text-heading text-ink text-center max-w-md"
              >
                Welcome back, {userName}.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
