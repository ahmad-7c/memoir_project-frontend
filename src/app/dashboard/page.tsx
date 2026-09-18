"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api/client";

// Modular Imports
import { contributorNames } from "@/features/dashboard/data/mockData"; 
import { BookCoverExperience } from "@/features/dashboard/components/BookCoverExperience";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MemoryInputSection } from "@/features/dashboard/components/MemoryInputSection";
import { MemoryArchive } from "@/features/dashboard/components/MemoryArchive";
import { ContributorsOverlay } from "@/features/dashboard/components/ContributorsOverlay";
import { ArchiveChatWidget } from "@/features/dashboard/components/ArchiveChatWidget"; // NEW

// Custom Hooks
import { useCaptureMemory } from "@/hooks/useCaptureMemory";
import { useMemoirFeed } from "@/hooks/useMemoirFeed"; 

export default function OwnerDashboard() {
  const [memoirId, setMemoirId] = useState<string>("");
  const [name, setName] = useState("");
  const [dates, setDates] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const [activeInput, setActiveInput] = useState<"none" | "text" | "audio" | "media" | "combined">("none");
  const [isTextExpanded, setIsTextExpanded] = useState(false); 

  const [searchQuery, setSearchQuery] = useState("");
  const [showContributors, setShowContributors] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [expandedStacks, setExpandedStacks] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chapters, setChapters] = useState<any[]>([]);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);

  // 1. Resolve active memoir details and owner profile.
  //
  // localStorage's "active_memoir" is only ever written by the login/signup
  // flow -- if the browser previously logged in as a different account (a
  // very normal thing to do while testing) and never went through that flow
  // again, this key silently keeps pointing at a memoir the *current*
  // access_token's user doesn't own. Every write against it (this onboarding
  // persist, capturing a memory, etc.) then 403s with "not an active
  // participant" -- correctly, since the backend is right to refuse it, but
  // confusingly, since nothing here ever explained why. Cross-checking
  // against GET /api/memoirs/ (the authoritative list for whoever the
  // current token actually belongs to) and correcting the cached value is
  // what actually fixes that, rather than just hiding the symptom.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user_profile") || localStorage.getItem("user_name");
      if (storedUser) {
        try {
          const userParsed = JSON.parse(storedUser);
          setOwnerName(userParsed.name || userParsed.fullName || storedUser);
        } catch {
          setOwnerName(storedUser);
        }
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    }

    const applyMemoir = (data: Record<string, unknown>) => {
      if (typeof data.id === "string") setMemoirId(data.id);
      if (typeof data.subject_name === "string") setName(data.subject_name);
      else if (typeof data.name === "string") setName(data.name);

      if (typeof data.dates === "string") {
        setDates(data.dates);
      } else if (data.subject_born_on || data.subject_died_on || data.dob || data.dod) {
        const born = (data.subject_born_on || data.dob) as string | undefined;
        const died = (data.subject_died_on || data.dod) as string | undefined;
        const dobYear = born ? new Date(born).getFullYear() : "";
        const dodYear = died ? new Date(died).getFullYear() : "Present";
        if (dobYear || dodYear !== "Present") setDates(`${dobYear} — ${dodYear}`);
      }
    };

    const resolveMemoir = async () => {
      let cached: Record<string, unknown> | null = null;
      try {
        const stored = localStorage.getItem("active_memoir");
        if (stored) {
          const parsed = JSON.parse(stored);
          cached = (parsed.data || parsed) as Record<string, unknown>;
        }
      } catch (e) {
        console.error("Could not parse cached active_memoir", e);
      }

      try {
        const memoirs = await api.getUserMemoirs();
        const cachedId = cached?.id as string | undefined;
        const stillValid = cachedId && memoirs.some((m: { id: string }) => m.id === cachedId);

        if (stillValid && cached) {
          applyMemoir(cached);
        } else if (memoirs.length > 0) {
          // Cached memoir belongs to a different account (or none was cached) --
          // fall back to whatever the current token's user actually owns.
          localStorage.setItem("active_memoir", JSON.stringify(memoirs[0]));
          applyMemoir(memoirs[0]);
        } else if (cached) {
          // Couldn't confirm one way or the other (e.g. the list call itself
          // failed); keep showing the cached memoir rather than blanking the
          // page, but do not treat it as verified.
          applyMemoir(cached);
        }
      } catch (e) {
        console.error("Could not verify active memoir against the current account", e);
        if (cached) applyMemoir(cached);
      }
    };

    resolveMemoir();
  }, []);

  // 2. Fetch real data using the hook
  const { memories, loading: feedLoading, error: feedError, refreshFeed } = useMemoirFeed(memoirId);

  // Auto-persist the onboarding memory
  useEffect(() => {
    if (!memoirId) return;
    const persistOnboardingMemory = async () => {
      const savedMemory = sessionStorage.getItem("onboarding_initial_memory");
      if (savedMemory) {
        try {
          await api.createMemory({
            memoir_id: memoirId,
            title: "First Memory",
            body_text: savedMemory,
            status: "submitted",
          });
          sessionStorage.removeItem("onboarding_initial_memory");
          refreshFeed();
        } catch (e) {
          // Clear the flag even on failure -- this is a best-effort, one-shot
          // persist. Without this, a failure here (stale memoir, network
          // blip, anything) retries on every remount forever, silently
          // spamming the same error indefinitely instead of surfacing once.
          sessionStorage.removeItem("onboarding_initial_memory");
          console.error("Failed to save onboarding memory to database:", e);
        }
      }
    };
    persistOnboardingMemory();
  }, [memoirId, refreshFeed]);

  // Fetch chapters
  useEffect(() => {
    if (!memoirId) return;
    const fetchChapters = async () => {
      try {
        const data = await api.getChapters(memoirId);
        if (data) setChapters(data);
      } catch (e) {
        setChapters([]);
      }
    };
    fetchChapters();
  }, [memoirId]);

  // 3. Capture pipeline
  const {
    draft, setDraft, photoFile, setPhotoFile, recording, audioUrl, loading: isAssembling, error, successMsg,
    startRecording, stopRecording, clearRecording, handleSubmit
  } = useCaptureMemory(memoirId, () => {
    setActiveInput("none");
    setIsTextExpanded(false);
    refreshFeed();
  });

  const toggleStack = (kind: string) => {
    setExpandedStacks(prev => prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind]);
  };

  const handleCopyLink = async () => {
    if (!memoirId) return;
    try {
      const shareData = await api.createShareLink(memoirId);
      if (shareData && shareData.url) {
        await navigator.clipboard.writeText(shareData.url);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleGenerateTimeline = async () => {
    if (!memoirId) return;
    setIsGeneratingChapters(true);
    try {
      const data = await api.generateTimeline(memoirId);
      if (data) setChapters(data);
      refreshFeed();
    } catch (e) {
      console.error("Failed to generate timeline", e);
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  const handleRenameChapter = async (chapterId: string, newTitle: string) => {
    if (!memoirId) return;
    try {
      await api.renameChapter(memoirId, chapterId, newTitle);
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, title: newTitle } : ch));
    } catch (e) {
      console.error("Failed to rename chapter", e);
    }
  };

  const handleMemoryOptionSelect = async (action: string, memoryId: string, targetChapterId?: string) => {
    if (action === "move" && targetChapterId) {
      try {
        await api.moveMemory(memoryId, targetChapterId);
        refreshFeed();
      } catch (e) {
        console.error("Failed to move memory", e);
      }
    }
  };

  return (
    <BookCoverExperience userName={ownerName || "Author"}>
      <div className="min-h-screen bg-memory-bg text-stone-900 font-sans selection:bg-memory-primary/20 flex overflow-x-hidden relative">

        <style dangerouslySetInnerHTML={{ __html: `
          .book-text { hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; }
          @keyframes smoothPulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.85; } }
          .animate-smooth-pulse { animation: smoothPulse 4s ease-in-out infinite; }
        `}} />

        <AnimatePresence>
          {activeInput !== "none" && (
            <motion.div 
              key="focus-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-memory-bg/92 backdrop-blur-md z-40 pointer-events-auto"
            />
          )}
        </AnimatePresence>

        <ContributorsOverlay showContributors={showContributors} setShowContributors={setShowContributors} contributorNames={contributorNames} />
        <DashboardSidebar setShowContributors={setShowContributors} />

        <main className="flex-1 flex flex-col min-h-screen pb-32">
          <DashboardHeader 
            name={name} setName={setName} dates={dates} setDates={setDates}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            handleCopyLink={handleCopyLink} isLinkCopied={isLinkCopied}
          />

          <div className="max-w-3xl mx-auto w-full px-6 pt-10">
            {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">{successMsg}</div>}

            <MemoryInputSection 
              activeInput={activeInput} setActiveInput={setActiveInput}
              isTextExpanded={isTextExpanded} setIsTextExpanded={setIsTextExpanded}
              isAssembling={isAssembling}
              inputTitle={draft.title} setInputTitle={(val) => setDraft({ ...draft, title: val })}
              inputDate={draft.occurred_start || ""} setInputDate={(val) => setDraft({ ...draft, occurred_start: val })}
              inputContent={draft.body_text || ""} setInputContent={(val) => setDraft({ ...draft, body_text: val })}
              photoFile={photoFile} setPhotoFile={setPhotoFile}
              recording={recording} audioUrl={audioUrl}
              startRecording={startRecording} stopRecording={stopRecording} clearRecording={clearRecording}
              handleLocalSubmit={handleSubmit}
            />

            {feedLoading && !memories.length ? (
              <div className="py-24 text-center text-memory-muted text-sm tracking-widest uppercase animate-pulse">Unpacking Archive...</div>
            ) : feedError ? (
              <div className="py-24 text-center text-red-600 text-sm font-medium">Failed to load archive: {feedError}</div>
            ) : (
              <MemoryArchive 
                expandedStacks={expandedStacks} toggleStack={toggleStack} 
                mockMemories={memories as React.ComponentProps<typeof MemoryArchive>["mockMemories"]} chapters={chapters} isGenerating={isGeneratingChapters}
                onGenerateTimeline={handleGenerateTimeline} onRenameChapter={handleRenameChapter} onMemoryOptionSelect={handleMemoryOptionSelect}
              />
            )}
          </div>
        </main>

        {/* Clean, modular chat widget */}
        {memoirId && <ArchiveChatWidget memoirId={memoirId} />}

      </div>
    </BookCoverExperience>
  );
}