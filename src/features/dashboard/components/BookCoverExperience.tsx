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

export function BookCoverExperience({
  children,
  userName = "Daniyah"
}: BookCoverExperienceProps) {
  const [isVisible, setIsVisible] = useState(true);

  /**
   * "Am I running in the browser?" without a setState-in-effect.
   *
   * The previous `const [isClient, setIsClient] = useState(false)` +
   * `useEffect(() => setIsClient(true))` forced a synchronous setState inside
   * an effect body, which causes a cascading render — the server renders
   * false, then the client immediately re-renders true. `useSyncExternalStore`
   * expresses the same fact declaratively: React reads the snapshot directly,
   * and the server snapshot is what SSR uses.
   */
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  /**
   * Particles are generated once, in a lazy initializer, rather than in an
   * effect.
   *
   * Two problems with generating them in an effect: `setParticles` fires a
   * synchronous setState inside the effect body (a cascading render, which
   * `npm run lint` rejects), and the values are random, so a second render pass
   * could produce a different layout than the first. A lazy initializer runs
   * exactly once per mount.
   *
   * Safe with respect to hydration because the particle block is gated behind
   * `isClient`, so it is not part of the server or hydration render at all.
   */
  const [particles] = useState<{
    id: number; top: string; left: string; moveX: string; size: number; duration: number; delay: number; isPaper: boolean
  }[]>(() =>
    Array.from({ length: 30 }).map((_, i) => {
      const fromLeft = Math.random() > 0.5;
      return {
        id: i,
        top: `${Math.random() * 100}%`,
        left: fromLeft ? `${-10 - Math.random() * 20}%` : `${110 + Math.random() * 20}%`,
        moveX: fromLeft ? "120vw" : "-120vw",
        size: Math.random() > 0.6 ? Math.random() * 15 + 10 : Math.random() * 3 + 1,
        duration: Math.random() * 8 + 12,
        delay: Math.random() * 3,
        isPaper: Math.random() > 0.6,
      };
    }),
  );

  useEffect(() => {
    // =====================================================================
    // DEVELOPMENT OVERRIDE:
    // We have commented out the sessionStorage check so you can actually
    // see the animation while coding! Uncomment this block for production.
    // =====================================================================

    /*
    const hasSeen = sessionStorage.getItem("hasSeenBookCover");
    if (hasSeen) {
      setTimeout(() => setIsVisible(false), 0);
      return;
    }
    */

    // Set the flag for when you uncomment the code above
    sessionStorage.setItem("hasSeenBookCover", "true");

    // Lock scroll while experience is active so the user stays perfectly centered
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = "unset"; // Unlock scroll when done
    }, 9000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset"; // Cleanup safely
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-memory-bg overflow-x-hidden">
      
      {/* Background Dashboard */}
      <div className="w-full min-h-screen">
        {children}
      </div>

      {isClient && (
        <AnimatePresence>
          {isVisible && (
            <motion.div
              key="overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeInOut" }} 
              // Fixed and locked to the exact viewport using modern h-dvh
              className="fixed top-0 left-0 z-200 w-screen h-dvh bg-memory-primary flex flex-col items-center justify-center select-none overflow-hidden perspective-[1000px]"
            >
              {/* Breathing Background Overlay */}
              <motion.div 
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="absolute inset-0 bg-linear-to-tr from-black/40 via-transparent to-black/10 pointer-events-none"
              />

              {/* Cross-Directional Natural Wind & Paper Drift */}
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, opacity: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                  animate={{ 
                    x: p.moveX, 
                    y: "-20vh", 
                    opacity: [0, p.isPaper ? 0.4 : 0.2, 0], 
                    rotateX: p.isPaper ? [0, 360] : 0, 
                    rotateY: p.isPaper ? [0, 180, 360] : 0,
                    rotateZ: p.isPaper ? [0, p.moveX === "120vw" ? 90 : -90] : 0
                  }}
                  transition={{ 
                    duration: p.duration, 
                    delay: p.delay, 
                    ease: "linear" 
                  }}
                  className={`absolute pointer-events-none ${p.isPaper ? 'bg-memory-light/80 shadow-sm rounded-sm' : 'bg-memory-light rounded-full blur-[1px]'}`}
                  style={{ 
                    top: p.top, 
                    left: p.left, 
                    width: p.isPaper ? p.size * 1.2 : p.size, 
                    height: p.size 
                  }}
                />
              ))}

              {/* Perfectly Centered Text Content */}
              <div className="relative z-10 text-center max-w-lg px-6 flex flex-col items-center justify-center space-y-8">
                
                {/* First Line */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                >
                  <p className="font-serif italic text-2xl sm:text-3xl text-memory-light tracking-wide font-light drop-shadow-md">
                    The story isn&apos;t lost, {userName}.
                  </p>
                </motion.div>

                {/* Second Line */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.5, delay: 3.5, ease: "easeOut" }} 
                >
                  <motion.p
                    animate={{ 
                      opacity: [0.75, 1, 0.75],
                      textShadow: [
                        "0px 0px 0px rgba(255,255,255,0)", 
                        "0px 0px 12px rgba(255,255,255,0.25)", 
                        "0px 0px 0px rgba(255,255,255,0)"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="font-serif text-lg sm:text-xl text-memory-light tracking-wide font-light leading-relaxed drop-shadow-md"
                  >
                    It is just scattered across the people who loved them. Let&apos;s bring it all together.
                  </motion.p>
                </motion.div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
    </div>
  );
}