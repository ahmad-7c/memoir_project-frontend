/**
 * @file Subscription.tsx
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
    <section className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="w-full max-w-110 bg-surface border border-line rounded-md px-8 md:px-10 py-10"
      >
        <div className="mb-8">
          <Link
            href="/invite-family-friends"
            className="text-ink-muted hover:text-ink-secondary text-body-ui transition-colors inline-flex items-center gap-1"
          >
            ← Back
          </Link>
        </div>

        {!showUnavailableNote ? (
          <>
            <div className="text-center mb-8">
              <h1 className="font-serif text-heading text-ink leading-snug mb-3">Keep every memory, always</h1>
              <p className="text-body-ui text-ink-secondary">$3 a month. No surprises, cancel anytime.</p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-sm border border-line bg-surface-sunk px-5 py-4">
                <span className="font-serif text-subhead text-ink">Family plan</span>
                <span className="text-body-ui font-semibold text-ink">$3 / mo</span>
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
            transition={{ duration: 0.24 }}
            className="text-center"
          >
            <h2 className="font-serif text-subhead text-ink mb-3">Payment isn&apos;t available just yet</h2>
            <p className="text-body-ui text-ink-secondary mb-8 max-w-sm mx-auto">
              You can start right now on the free plan, and we&apos;ll let you know
              the moment subscriptions open. Nothing about your memoir depends on this.
            </p>
            <Button size="lg" onClick={handleContinueFree} className="w-full">
              Continue on the free plan
            </Button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
