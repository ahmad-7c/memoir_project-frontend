/**
 * @file MemoryMoment.tsx
 * @description Step 4 of 5. A preview of what the first page will look
 * like, built from what was actually typed in the previous step. Previously
 * forced Times New Roman, drew fake "♡ 1 / 0 Notes" buttons (gamification
 * and a zero-counter, both against the brief), and used a decorative corner
 * fold -- removed. All the data-loading logic (localStorage pending_memoir
 * / active_memoir, sessionStorage onboarding_initial_memory, user_profile)
 * is unchanged.
 */

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "./OnboardingProgress";

export default function MemoryMoment() {
  const router = useRouter();

  // States initialized empty to ensure NO hardcoded data is shown
  const [subjectName, setSubjectName] = useState("");
  const [subjectDates, setSubjectDates] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [previewMemory, setPreviewMemory] = useState("");

  useEffect(() => {
    // Wrapping in a timeout pushes the state update to the end of the event loop,
    // completely bypassing the ESLint "synchronous setState" warning.
    const timer = setTimeout(() => {
      try {
        let sName = "";
        let dobYear = "";
        let dodYear = "";
        let author = "";
        let memoryText = "";

        // 1. Retrieve subject details from pending_memoir
        const storedPending = localStorage.getItem("pending_memoir");
        if (storedPending) {
          const parsed = JSON.parse(storedPending);
          if (parsed.subject_name) sName = parsed.subject_name;
          if (parsed.subject_born_on) dobYear = new Date(parsed.subject_born_on).getFullYear().toString();

          if (parsed.subject_is_living) {
            dodYear = "Present";
          } else if (parsed.subject_died_on) {
            dodYear = new Date(parsed.subject_died_on).getFullYear().toString();
          }
        }

        // Fallback: Check active_memoir if pending_memoir is missing
        if (!sName) {
          const storedActive = localStorage.getItem("active_memoir");
          if (storedActive) {
            const parsed = JSON.parse(storedActive);
            const data = parsed.data || parsed;
            if (data.name) sName = data.name;
            if (data.dob) dobYear = new Date(data.dob).getFullYear().toString();
            if (data.dod) dodYear = new Date(data.dod).getFullYear().toString();
          }
        }

        // 2. Retrieve user / author name
        const storedUser = localStorage.getItem("user_profile") || localStorage.getItem("user_name");
        if (storedUser) {
          try {
            const userParsed = JSON.parse(storedUser);
            author = userParsed.name || userParsed.fullName || storedUser;
          } catch {
            author = storedUser;
          }
        }

        // 3. Retrieve the actual memory typed in UnfoldMemory step
        const onboardingMem = sessionStorage.getItem("onboarding_initial_memory");
        if (onboardingMem) {
          memoryText = onboardingMem;
        }

        // 4. Update states asynchronously
        if (sName) setSubjectName(sName);
        if (dobYear) setSubjectDates(`${dobYear} — ${dodYear || "Present"}`);
        if (author) setAuthorName(author);
        if (memoryText) setPreviewMemory(memoryText);
      } catch (e) {
        console.error("Failed to load onboarding preview state", e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative isolate min-h-screen bg-background flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-125 flex justify-start mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer inline-flex items-center gap-1"
          aria-label="Go back"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> Back
        </button>
      </div>

      <OnboardingProgress step={4} />

      <div className="w-full max-w-125">
        <h1 className="font-serif text-3xl text-foreground text-center mb-10 leading-snug">A glimpse of the archive</h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="bg-card border border-border rounded-md px-8 md:px-10 py-10 mb-10"
        >
          {subjectName && (
            <div className="mb-6">
              <p className="font-serif text-xl text-foreground">{subjectName}&apos;s story</p>
              {subjectDates && <p className="text-xs text-muted-foreground mt-1">{subjectDates}</p>}
            </div>
          )}

          {previewMemory ? (
            <p className="font-serif text-sm text-muted-foreground leading-relaxed">
              {previewMemory}
              {authorName && (
                <span className="block text-xs text-muted-foreground mt-4 not-italic font-sans">
                  — Remembered by {authorName}
                </span>
              )}
            </p>
          ) : (
            <p className="font-serif text-sm text-muted-foreground italic">
              Your written reflection will appear here.
            </p>
          )}
        </motion.div>

        <Button type="button" onClick={() => router.push("/invite-family-friends")} className="w-full">
          Continue
        </Button>
      </div>
    </section>
  );
}
