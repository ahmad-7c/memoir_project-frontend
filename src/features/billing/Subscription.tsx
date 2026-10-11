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
    router.push("/begin");
  };

  return (
    <section className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="w-full max-w-110 bg-card border border-border rounded-md px-8 md:px-10 py-10"
      >
        <div className="mb-8">
          <Link
            href="/invite-family-friends"
            className="text-muted-foreground hover:text-muted-foreground text-sm transition-colors inline-flex items-center gap-1"
          >
            ← Back
          </Link>
        </div>

        {!showUnavailableNote ? (
          <>
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-foreground leading-snug mb-3">Keep every memory, always</h1>
              <p className="text-sm text-muted-foreground">$3 a month. No surprises, cancel anytime.</p>
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-sm border border-border bg-secondary px-5 py-4">
                <span className="font-serif text-xl text-foreground">Family plan</span>
                <span className="text-sm font-semibold text-foreground">$3 / mo</span>
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
            <h2 className="font-serif text-xl text-foreground mb-3">Payment isn&apos;t available just yet</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              You can start right now on the free plan, and we&apos;ll let you know
              the moment subscriptions open. Nothing about your memoir depends on this.
            </p>
            <Button size="lg" onClick={handleContinueFree} className="w-full">
              Continue free
            </Button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
