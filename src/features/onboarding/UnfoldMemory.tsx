/**
 * @file UnfoldMemory.tsx
 * @description Step 3 of 5. Previously an animated cloud of prompts
 * scattering around a stack of rotated, shadowed notepad sheets with spring
 * physics -- replaced with one calm textarea and a quiet row of prompt
 * chips, since the scatter/bounce/shadow treatment was against the brief on
 * every count. Behaviour is unchanged: the written story is handed to
 * memory-moment via sessionStorage under the same key.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "./OnboardingProgress";

const PROMPTS = [
  "A moment that still makes me smile",
  "Something they used to say",
  "A place I remember",
  "A little thing I miss",
  "A song we used to share",
  "The warmth of their laughter",
];

export default function UnfoldMemory() {
  const router = useRouter();
  const [story, setStory] = useState("");

  const handlePromptClick = (prompt: string) => {
    setStory((current) => (current.trim() ? `${current}\n\n${prompt}: ` : `${prompt}: `));
  };

  const handleContinue = () => {
    if (story.trim()) {
      sessionStorage.setItem("onboarding_initial_memory", story.trim());
    }
    router.push("/memory-moment");
  };

  return (
    <section className="relative isolate min-h-screen bg-background flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-125">
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-muted-foreground text-sm transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>
        </div>

        <OnboardingProgress step={3} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <h1 className="font-serif text-3xl text-foreground text-center mb-3 leading-snug">
            Hold onto a moment that matters.
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-10">
            Start with a moment that still stays with you.
          </p>

          <Label htmlFor="first-memory">One memory to start with</Label>
          <Textarea
            id="first-memory"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Write it the way you'd tell it out loud..."
            rows={7}
            className="font-serif text-sm"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="text-xs text-muted-foreground border border-border rounded-sm px-3 py-1.5 hover:border-primary hover:text-foreground transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <Button type="button" onClick={handleContinue} disabled={!story.trim()} className="w-full mt-10">
            Continue
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
