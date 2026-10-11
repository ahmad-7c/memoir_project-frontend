"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, SharedMemoirFull, SharedMemory } from "@/lib/api/client";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { LeafMark } from "@/components/Logo";
import ReaderHeader from "@/components/ReaderHeader";
import Footer from "@/components/Footer";
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
    <article className="mt-8">
      {memory.title && <h3 className="font-serif text-xl text-foreground mb-1">{memory.title}</h3>}
      {memory.occurred_start && (
        <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-2">{memory.occurred_start}</p>
      )}

      {memory.body_text && (
        <p className={cn("text-sm text-foreground leading-relaxed whitespace-pre-wrap", dropCap && DROP_CAP_CLASS)}>
          {memory.body_text}
        </p>
      )}

      {photos.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL
            <img
              key={photo.id}
              src={photo.playback_url || undefined}
              alt={photo.caption || memory.title || "A family photograph"}
              className="w-full"
            />
          ))}
        </div>
      )}

      {audio.map((clip) => (
        <div key={clip.id} className="mt-4 flex flex-col gap-2">
          <AudioPlayer src={clip.playback_url || ""} />
          {clip.transcript_text && (
            <p className="text-xs text-muted-foreground italic pl-3 border-l border-border">
              &ldquo;{clip.transcript_text}&rdquo;
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

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // sessionStorage, not localStorage: a reader token is a 24h credential for
  // this browser tab's visit, not a cross-device convenience cache.
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
        // Expired/invalid reader token -- back to the password form with an
        // inline error, not the "link is dead" screen (different cases).
        sessionStorage.removeItem(storageKey);
        setUnlockError("That session expired. Please sign in again.");
        setStage("unlock");
      } else if (status === 409) {
        // Server's own message, verbatim -- typically "this memoir has been
        // unpublished" or a similar state conflict, not a generic failure.
        setError(err instanceof Error ? err.message : "This memoir is not available right now.");
        setStage("error");
      } else {
        setError(err instanceof Error ? err.message : "This link no longer works.");
        setStage("error");
      }
    }
  };

  useEffect(() => {
    if (!token) return;
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
      if (status === 404) {
        setError("This link no longer works.");
        setStage("error");
      } else if (status === 409) {
        setError(err instanceof Error ? err.message : "This memoir is not available right now.");
        setStage("error");
      } else {
        // 401 (wrong password) and anything else surface inline, on the
        // same form, so the family can just try again.
        setUnlockError(err instanceof Error ? err.message : "Could not unlock this memoir.");
      }
    } finally {
      setUnlocking(false);
    }
  };

  const brandMark = (
    <span className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
      <LeafMark className="w-5 h-5 text-primary" />
      The Family Memoir
    </span>
  );

  if (stage === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingState label="Opening the memoir…" />
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        {brandMark}
        <h1 className="font-serif text-3xl text-foreground mt-4">This link no longer works</h1>
        <ErrorState message={error || "Please ask the family for a current link."} />
      </main>
    );
  }

  if (stage === "unlock") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">{brandMark}</div>
          <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-3 text-center">
            You&rsquo;ve been invited in
          </p>
          <h1 className="font-serif text-3xl text-foreground mb-3 text-center">A place for their story.</h1>
          <p className="text-sm text-muted-foreground text-center mb-10 leading-relaxed">
            Enter your name and the password the family shared with you personally.
          </p>

          {unlockError && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
              <p className="text-sm text-foreground">{unlockError}</p>
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-5">
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
              {unlocking ? "Opening…" : "View the memoir →"}
            </Button>
          </form>
        </div>
      </main>
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
    <main>
      <ReaderHeader label="Shared with you privately" />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-14">
        <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-2">A life, remembered together</p>
        <h1 className="font-serif text-5xl text-foreground mb-2">{memoirData.subject_name}</h1>
        {dates && <p className="text-xs text-muted-foreground mb-10">{dates}</p>}

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
              <section key={chapter.id} className="mb-20">
                <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-2">
                  Chapter {String(chapterIndex + 1).padStart(2, "0")}
                </p>
                <h2 className="font-serif text-4xl text-foreground mb-6">{chapter.title}</h2>

                {chapterOpensWithNarrative && (
                  <NarrativeSectionsView
                    memoirId={memoirData.id}
                    sections={chapterNarrative}
                    shareToken={token}
                    readerToken={readerToken}
                    showLabel
                    dropCapFirst
                  />
                )}

                {chapterMemories.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic mt-4">No memories in this chapter yet.</p>
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
          <p className="text-center text-sm text-muted-foreground italic py-16">Nothing has been added to this memoir yet.</p>
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
      </div>

      <section className="bg-secondary py-16 px-6 text-center">
        <h2 className="font-serif text-3xl text-foreground mb-4">Everyone has someone to remember.</h2>
        <Link href="/begin" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          Begin a memoir for someone you love &rarr;
        </Link>
      </section>

      <Footer />
    </main>
  );
}
