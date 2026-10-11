"use client";

import { motion } from "framer-motion";
import { MemoryInputSection } from "./MemoryInputSection";

interface EmptyDashboardProps {
  name: string;
  dates: string;
  // Passed straight through to MemoryInputSection -- same capture pipeline
  // the populated dashboard uses, just without everything else on screen.
  activeInput: "none" | "text" | "audio" | "media" | "combined";
  setActiveInput: (val: "none" | "text" | "audio" | "media" | "combined") => void;
  isTextExpanded: boolean;
  setIsTextExpanded: (val: boolean) => void;
  isAssembling: boolean;
  inputTitle: string;
  setInputTitle: (val: string) => void;
  inputDate: string;
  setInputDate: (val: string) => void;
  inputContent: string;
  setInputContent: (val: string) => void;
  handleLocalSubmit: (e: React.FormEvent) => void;
  photoFile: File | null;
  setPhotoFile: (file: File | null) => void;
  recording: boolean;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;
}

/**
 * What the owner sees before a single memory exists. Deliberately almost
 * nothing: the person's name, then one invitation, then the three ways in.
 * No sidebar, no search bar, no publish button, no "0 memories" -- there is
 * nothing yet to search, share or count.
 */
export function EmptyDashboard(props: EmptyDashboardProps) {
  const { name, dates, ...inputProps } = props;

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center px-6 pt-24 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="text-center mb-14"
      >
        <h1 className="font-serif text-display text-ink mb-2">{name || "Their memoir"}</h1>
        {dates && <p className="text-small text-ink-muted">{dates}</p>}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.24, delay: 0.1 }}
        className="font-serif text-body-read text-ink-secondary text-center max-w-md mb-10"
      >
        Nothing is here yet. Add the first memory, in whatever way feels
        easiest right now.
      </motion.p>

      <div className="w-full max-w-3xl">
        <MemoryInputSection {...inputProps} />
      </div>
    </div>
  );
}
