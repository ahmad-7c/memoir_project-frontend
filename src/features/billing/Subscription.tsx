/**
 * @file subscription.tsx
 * @description Subscription screen. Payment isn't wired up yet -- tapping
 * Subscribe shows a calm, honest note instead of simulating a charge, with a
 * clear way to continue on the free plan. Not an error, not a modal that
 * reads as something broke.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function Subscription() {
  const router = useRouter();
  const [showUnavailableNote, setShowUnavailableNote] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setShowUnavailableNote(true);
  };

  const handleContinueFree = () => {
    router.push("/signup");
  };

  return (
    <section className="min-h-screen bg-memory-bg dark:bg-memory-bg text-memory-primary dark:text-memory-ink flex items-center justify-center px-6 py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-memory-card dark:bg-memory-card border border-memory-border rounded-3xl px-8 md:px-10 py-10 shadow-sm"
      >
        <div className="mb-8">
          <Link
            href="/invite-family-friends"
            className="text-memory-muted hover:text-memory-primary dark:hover:text-memory-ink text-[15px] font-medium transition inline-flex items-center gap-1"
          >
            ←
          </Link>
        </div>

        {!showUnavailableNote ? (
          <>
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-memory-primary dark:text-memory-ink leading-snug mb-3">
                Keep every memory, always
              </h1>
              <p className="text-memory-muted text-[15px] leading-relaxed">
                $3 a month. No surprises, cancel anytime.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-memory-border bg-white dark:bg-memory-bg px-5 py-4">
                <span className="font-serif text-lg text-memory-primary dark:text-memory-ink">Family plan</span>
                <span className="font-sans font-semibold text-memory-primary dark:text-memory-ink">$3 / mo</span>
              </div>

              <Button type="submit" size="lg" className="w-full mt-2">
                Subscribe
              </Button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="font-serif text-2xl text-memory-primary dark:text-memory-ink mb-3">
              Payment isn&apos;t available just yet
            </h2>
            <p className="text-memory-muted text-[15px] leading-relaxed mb-8 max-w-sm mx-auto">
              You can start right now on the free plan, and we&apos;ll let you know
              the moment subscriptions open. Nothing about your memoir depends on this.
            </p>
            <Button size="lg" onClick={handleContinueFree} className="w-full">
              Continue on the Free Plan
            </Button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
