"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppTopBar from "@/components/AppTopBar";
import Footer from "@/components/Footer";
import { IdentityStrip } from "@/components/ui/IdentityStrip";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { InitialAvatar } from "@/components/ui/InitialAvatar";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { MemoryCard } from "@/features/dashboard/components/MemoryCard";
import { MemoryInputSection } from "@/features/dashboard/components/MemoryInputSection";
import { ContributorsOverlay } from "@/features/dashboard/components/ContributorsOverlay";
import { useActiveMemoir } from "@/features/dashboard/hooks";
import { useMemoirFeed } from "@/hooks/useMemoirFeed";
import { useCaptureMemory } from "@/hooks/useCaptureMemory";
import { api, Participant } from "@/lib/api/client";

const TABS = [
  { label: "Memories", href: "/memories" },
  { label: "The chapters", href: "/chapters" },
  { label: "Preview memoir", href: "/memoir" },
];

export default function MemoriesPage() {
  const { memoirId, name, dates } = useActiveMemoir();
  const { memories, loading: feedLoading, error: feedError, refreshFeed } = useMemoirFeed(memoirId);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showContributors, setShowContributors] = useState(false);
  const [activeInput, setActiveInput] = useState<"none" | "text" | "audio" | "media" | "combined">("none");
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);

  useEffect(() => {
    if (!memoirId) return;
    let cancelled = false;
    api
      .getParticipants(memoirId)
      .then((data) => {
        if (!cancelled) setParticipants(data);
      })
      .catch(() => {
        // No participants yet (or the memoir isn't published, so there's
        // nothing to list) -- an empty list is the honest fallback, not an
        // error banner over a sidebar teaser.
        if (!cancelled) setParticipants([]);
      })
      .finally(() => {
        if (!cancelled) setParticipantsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  const {
    draft, setDraft, photoFile, setPhotoFile, recording, audioUrl,
    loading: isAssembling, startRecording, stopRecording, clearRecording, handleSubmit,
  } = useCaptureMemory(memoirId, () => {
    setComposerOpen(false);
    setActiveInput("none");
    refreshFeed();
  });

  return (
    <main>
      <AppTopBar />
      <IdentityStrip
        portraitSrc="/images/garden-portrait.jpg"
        portraitAlt={name ? `A portrait associated with ${name}'s memoir` : "A portrait photograph"}
        eyebrow="A life, coming together"
        name={name || "Their memoir"}
        subtitle={dates ? `${dates} · Family memoir` : "Family memoir"}
      />

      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        <SectionTabs tabs={TABS} active="Memories" />

        <div className="flex items-center justify-between gap-4 py-6">
          <button
            type="button"
            onClick={() => setShowContributors(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span aria-hidden="true">🔗</span> Invite family
          </button>
          <Button onClick={() => setComposerOpen(true)}>+ Add a memory</Button>
        </div>

        {composerOpen && (
          <div className="mb-10">
            <MemoryInputSection
              activeInput={activeInput}
              setActiveInput={setActiveInput}
              isTextExpanded={isTextExpanded}
              setIsTextExpanded={setIsTextExpanded}
              isAssembling={isAssembling}
              inputTitle={draft.title}
              setInputTitle={(val) => setDraft({ ...draft, title: val })}
              inputDate={draft.occurred_start || ""}
              setInputDate={(val) => setDraft({ ...draft, occurred_start: val })}
              inputContent={draft.body_text || ""}
              setInputContent={(val) => setDraft({ ...draft, body_text: val })}
              photoFile={photoFile}
              setPhotoFile={setPhotoFile}
              recording={recording}
              audioUrl={audioUrl}
              startRecording={startRecording}
              stopRecording={stopRecording}
              clearRecording={clearRecording}
              handleLocalSubmit={handleSubmit}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_230px] gap-10 lg:gap-[65px] pb-16">
          <div>
            {feedLoading && !memories.length ? (
              <LoadingState label="Still gathering the memories…" />
            ) : feedError ? (
              <ErrorState message={`The memories didn't load. ${feedError}`} onRetry={refreshFeed} />
            ) : memories.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-serif text-2xl text-foreground mb-3">No memories yet.</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  The first one is the hardest to start. Everything after it gets easier.
                </p>
              </div>
            ) : (
              memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={{
                    ...memory,
                    author:
                      participants.find((p) => p.id === memory.author_participant_id)?.display_name ||
                      "A family member",
                  }}
                />
              ))
            )}
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-10">
            <div>
              <Eyebrow>Remembering, together</Eyebrow>
              <h3 className="font-serif text-2xl text-foreground mt-2 leading-tight">
                No one holds
                <br />
                the whole story.
              </h3>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Every person who knew them carries a different piece of who they were.
              </p>
              {!participantsLoading && participants.length > 0 && (
                <div className="flex mt-4" aria-hidden="true">
                  {participants.slice(0, 3).map((p, i) => (
                    <InitialAvatar
                      key={p.id}
                      initial={p.display_name[0]?.toUpperCase() || "?"}
                      size={32}
                      className={i === 0 ? "border-2 border-background" : "border-2 border-background -ml-2"}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowContributors(true)}
                className="mt-3 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Bring your family in &rarr;
              </button>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                When you&rsquo;re ready, see how these memories fit together.
              </p>
              <Link href="/chapters" className="mt-2 inline-block text-xs font-medium text-foreground hover:text-primary transition-colors">
                Arrange their story &rarr;
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <ContributorsOverlay
        show={showContributors}
        onClose={() => setShowContributors(false)}
        memoirId={memoirId}
        participants={participants}
        participantsLoading={participantsLoading}
      />

      <Footer />
    </main>
  );
}
