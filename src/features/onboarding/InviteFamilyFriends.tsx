/**
 * @file InviteFamilyFriends.tsx
 * @description Step 5 of 5, the last onboarding screen. Previously used a
 * stock photo of a staged family portrait (against the no-stock-imagery
 * rule) behind hover-triggered speech-bubble popups with heavy shadows --
 * removed in favour of plain typography.
 *
 * Also fixes a real navigation bug: the primary button previously called
 * router.push("/") -- it sent the person who had just finished four steps
 * of onboarding back to the marketing homepage instead of on to signup.
 * Both actions now continue to /signup, since neither one currently wires
 * up a real invite-sending mechanism to meaningfully differ.
 */

"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "./OnboardingProgress";

export default function InviteFamilyFriends() {
  const router = useRouter();

  return (
    <section className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-125">
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-ink-muted hover:text-ink-secondary transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <ArrowLeft size={16} strokeWidth={1.5} /> Back
          </button>
        </div>

        <OnboardingProgress step={5} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-center"
        >
          <h1 className="font-serif text-heading text-ink leading-snug">
            You remember it. <span className="text-accent">They might too.</span>
          </h1>

          <p className="mt-4 text-body-ui text-ink-secondary max-w-sm mx-auto">
            Invite someone who shared that moment with you. You can always add
            more people later.
          </p>

          <div className="mt-10 flex flex-col gap-3 max-w-sm mx-auto">
            <Button type="button" onClick={() => router.push("/signup")} className="w-full">
              Invite family and friends
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/signup")} className="w-full">
              Maybe later
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
