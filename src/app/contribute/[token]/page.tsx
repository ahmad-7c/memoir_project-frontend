"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, SharedMemoirFull, SharedMemory } from "@/lib/api/client";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import MemoirHero from "@/features/FinalMemoir/MemoirHero";
import { ReadingProgress } from "@/features/FinalMemoir/ReadingProgress";
import { StickyChapterLabel } from "@/features/FinalMemoir/StickyChapterLabel";
import { toRoman } from "@/utils/toRoman";
import { DROP_CAP_CLASS } from "@/lib/dropCap";
import { cn } from "@/lib/utils";

type Stage = "loading" | "unlock" | "memoir" | "error";

function ReaderMemoryCard({
  memoirId,
  memory,
  canComment,
  shareToken,
  readerToken,
  dropCap = false,
}: {
  memoirId: string;
  memory: SharedMemory;
  canComment: boolean;
  shareToken: string;
  readerToken: string;
  dropCap?: boolean;
}) {
  const photos = memory.media.filter((m) => m.kind === "photo" && m.playback_url);
  const audio = memory.media.filter((m) => m.kind === "audio" && m.playback_url);

  return (
    <article className="mb-12 pb-12 border-b border-line last:border-0 last:pb-0 max-w-prose">
      {memory.title && <h3 className="font-serif text-subhead text-ink mb-1">{memory.title}</h3>}
      {memory.occurred_start && (
        <p className="text-micro uppercase tracking-[0.06em] text-ink-muted mb-3">{memory.occurred_start}</p>
      )}

      {memory.body_text && (
        <p
          className={cn(
            "font-serif text-body-read text-ink-secondary leading-relaxed whitespace-pre-wrap",
            dropCap && DROP_CAP_CLASS,
          )}
        >
          {memory.body_text}
        </p>
      )}

      {photos.length > 0 && (
        <div className="flex flex-col gap-6 mt-6">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL
            <img
              key={photo.id}
              src={photo.playback_url || undefined}
              alt={photo.caption || memory.title || "A family photograph"}
              className="w-full rounded-sm border border-line"
            />
          ))}
        </div>
      )}

      {audio.map((clip) => (
        <div key={clip.id} className="mt-6 flex flex-col gap-2 max-w-sm">
          <AudioPlayer src={clip.playback_url || ""} />
          {clip.transcript_text && (
            <p className="text-small text-ink-muted italic pl-4 border-l border-line">
              &quot;{clip.transcript_text}&quot;
            </p>
          )}
        </div>
      ))}

      <MemoryComments
        memoirId={memoirId}
        memoryId={memory.id}
        canComment={canComment}
        shareToken={shareToken}
        readerToken={readerToken}
      />
    </article>
  );
}

export default function ContributorPage() {
  const params = useParams();
  const token = params.token as string;

  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);
  const [memoirData, setMemoirData] = useState<SharedMemoirFull | null>(null);
  const [readerToken, setReaderToken] = useState<string | undefined>(undefined);

  // Unlock form state.
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // sessionStorage, not localStorage: a reader token is a 24h credential for
  // THIS browser tab's visit, not something that should persist indefinitely
  // across devices/sessions the way the owner's "active_memoir" convenience
  // cache does elsewhere in this app.
  const storageKey = `reader_token_${token}`;

  const fetchMemoir = async (token_: string) => {
    try {
      const data = await api.getSharedMemoirFull(token, token_);
      setMemoirData(data);
      setReaderToken(token_);
      setStage("memoir");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        // Reader token expired or invalid -- re-show the password form
        // rather than the "link is dead" error (different screens, per spec).
        sessionStorage.removeItem(storageKey);
        setStage("unlock");
      } else {
        setError(err instanceof Error ? err.message : "This link no longer works.");
        setStage("error");
      }
    }
  };

  useEffect(() => {
    if (!token) return;

    // Deferred a tick so no setState call executes synchronously within the
    // effect body itself (only inside this callback) -- same constraint
    // final-memoir/page.tsx works around elsewhere in this codebase.
    Promise.resolve().then(() => {
      const existingToken = sessionStorage.getItem(storageKey);
      if (existingToken) {
        fetchMemoir(existingToken);
      } else {
        setStage("unlock");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    setUnlocking(true);
    try {
      const result = await api.unlockShareLink(token, displayName, password);
      sessionStorage.setItem(storageKey, result.access_token);
      await fetchMemoir(result.access_token);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      // Wrong password (401) gets a generic message server-side already --
      // shown as-is. A dead link (404) gets its own screen entirely.
      if (status === 404) {
        setError("This link no longer works.");
        setStage("error");
      } else {
        setUnlockError(err instanceof Error ? err.message : "Could not unlock this memoir.");
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <LoadingState label="Opening the memoir…" />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="font-serif text-heading text-ink">This link no longer works</h1>
        <ErrorState message={error || "Please ask the family for a current link."} />
      </div>
    );
  }

  if (stage === "unlock") {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-surface border border-line rounded-md px-8 py-12">
          <h1 className="font-serif text-heading text-ink mb-3 text-center">You&apos;ve been invited in</h1>
          <p className="text-body-ui text-ink-secondary text-center mb-10 leading-relaxed">
            Enter your name and the password the family shared with you personally.
          </p>

          {unlockError && (
            <div role="alert" className="mb-6 px-4 py-3 rounded-sm border border-line bg-surface-sunk text-body-ui text-ink">
              {unlockError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-6">
            <div>
              <Label htmlFor="display-name">Your name</Label>
              <Input
                id="display-name"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sarah"
              />
            </div>

            <div>
              <Label htmlFor="unlock-password">Password</Label>
              <Input
                id="unlock-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Given to you personally by the family"
              />
            </div>

            <Button type="submit" size="lg" loading={unlocking} className="w-full mt-2">
              {unlocking ? "Opening…" : "View the memoir"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!memoirData || !readerToken) return null;

  const hasChapters = memoirData.chapters.length > 0;
  const dates = [
    memoirData.subject_born_on ? memoirData.subject_born_on.slice(0, 4) : "",
    memoirData.subject_is_living ? "Present" : memoirData.subject_died_on ? memoirData.subject_died_on.slice(0, 4) : "",
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="min-h-screen bg-canvas">
      <ReadingProgress />
      {/* No cover image: the share API has no cover-image field for a
          reader-side memoir, so MemoirHero's own conditional handles that
          honestly rather than this page inventing a photo that isn't there. */}
      <MemoirHero subjectName={memoirData.subject_name} dates={dates} />
      {hasChapters && (
        <StickyChapterLabel
          chapters={memoirData.chapters.map((c) => ({ id: `chapter-${c.id}`, title: c.title }))}
        />
      )}

      <main className="max-w-prose mx-auto px-6 pb-32">
        {!hasChapters && memoirData.narrative_sections.length > 0 && (
          <div className="mb-16">
            <NarrativeSectionsView
              memoirId={memoirData.id}
              sections={memoirData.narrative_sections}
              shareToken={token}
              readerToken={readerToken}
              dropCapFirst
            />
          </div>
        )}

        {hasChapters ? (
          memoirData.chapters.map((chapter, chapterIndex) => {
            const chapterMemories = memoirData.memories.filter((m) => m.chapter_id === chapter.id);
            const chapterNarrative = memoirData.narrative_sections.filter((s) => s.chapter_id === chapter.id);
            const chapterOpensWithNarrative = chapterNarrative.length > 0;

            return (
              <section key={chapter.id} id={`chapter-${chapter.id}`} className="mb-16">
                <div className="mb-6 pb-4 border-b border-line flex items-baseline gap-4">
                  <span className="font-serif text-heading text-brass shrink-0" aria-hidden="true">
                    {toRoman(chapterIndex + 1)}
                  </span>
                  <div>
                    <h2 className="font-serif text-heading text-ink">{chapter.title}</h2>
                    {chapter.summary && (
                      <p className="font-serif text-body-read text-ink-secondary italic mt-2">{chapter.summary}</p>
                    )}
                  </div>
                </div>

                {chapterOpensWithNarrative && (
                  <div className="mb-8">
                    <NarrativeSectionsView
                      memoirId={memoirData.id}
                      sections={chapterNarrative}
                      shareToken={token}
                      readerToken={readerToken}
                      showLabel={false}
                      dropCapFirst
                    />
                  </div>
                )}

                {chapterMemories.length === 0 ? (
                  <p className="font-serif text-body-read text-ink-muted italic py-2">No memories in this chapter yet.</p>
                ) : (
                  chapterMemories.map((memory, memIndex) => (
                    <ReaderMemoryCard
                      key={memory.id}
                      memoirId={memoirData.id}
                      memory={memory}
                      canComment={memoirData.can_comment}
                      shareToken={token}
                      readerToken={readerToken}
                      dropCap={!chapterOpensWithNarrative && memIndex === 0}
                    />
                  ))
                )}
              </section>
            );
          })
        ) : memoirData.memories.length === 0 ? (
          <p className="text-center font-serif text-body-read text-ink-muted italic py-16">
            Nothing has been added to this memoir yet.
          </p>
        ) : (
          memoirData.memories.map((memory, index) => (
            <ReaderMemoryCard
              key={memory.id}
              memoirId={memoirData.id}
              memory={memory}
              canComment={memoirData.can_comment}
              shareToken={token}
              readerToken={readerToken}
              dropCap={memoirData.narrative_sections.length === 0 && index === 0}
            />
          ))
        )}
      </main>
    </div>
  );
}
