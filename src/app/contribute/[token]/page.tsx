"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, SharedMemoirFull, SharedMemory } from "@/lib/api/client";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { Button } from "@/components/ui/Button";

type Stage = "loading" | "unlock" | "memoir" | "error";

function ReaderMemoryCard({
  memoirId,
  memory,
  canComment,
  shareToken,
  readerToken,
}: {
  memoirId: string;
  memory: SharedMemory;
  canComment: boolean;
  shareToken: string;
  readerToken: string;
}) {
  const photos = memory.media.filter((m) => m.kind === "photo" && m.playback_url);
  const audio = memory.media.filter((m) => m.kind === "audio" && m.playback_url);

  return (
    <article className="mb-10 pb-10 border-b border-memory-border dark:border-memory-border last:border-0">
      {memory.title && (
        <h3 className="font-serif text-xl text-memory-primary dark:text-memory-ink mb-1">{memory.title}</h3>
      )}
      {memory.occurred_start && (
        <p className="text-[11px] uppercase tracking-[0.18em] text-memory-muted mb-3">{memory.occurred_start}</p>
      )}

      {memory.body_text && (
        <p className="text-[17px] font-serif leading-[1.9] text-memory-primary dark:text-memory-ink whitespace-pre-wrap">
          {memory.body_text}
        </p>
      )}

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.playback_url || undefined}
              alt={photo.caption || memory.title || "A family photograph"}
              className="max-w-full sm:max-w-80 rounded-sm border border-memory-border shadow-sm"
            />
          ))}
        </div>
      )}

      {audio.map((clip) => (
        <div key={clip.id} className="mt-4 space-y-1.5 max-w-sm">
          <div className="bg-memory-card dark:bg-memory-card border border-memory-border rounded-2xl p-3">
            <audio controls src={clip.playback_url || undefined} className="w-full h-9" controlsList="nodownload" />
          </div>
          {clip.transcript_text && (
            <p className="text-[13px] text-memory-muted italic pl-3 border-l border-memory-border">
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
      <div className="min-h-screen bg-memory-bg dark:bg-memory-bg flex items-center justify-center">
        <LoadingState label="Opening the memoir…" />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-memory-bg dark:bg-memory-bg flex flex-col items-center justify-center gap-5 px-6 text-center font-sans">
        <h1 className="font-serif text-2xl text-memory-primary dark:text-memory-ink">This link no longer works</h1>
        <ErrorState message={error || "Please ask the family for a current link."} />
      </div>
    );
  }

  if (stage === "unlock") {
    return (
      <div className="min-h-screen bg-memory-bg dark:bg-memory-bg flex items-center justify-center px-6 font-sans">
        <div className="w-full max-w-110 bg-memory-card dark:bg-memory-card border border-memory-border rounded-3xl px-8 py-10 shadow-sm">
          <h1 className="font-serif text-3xl text-memory-primary dark:text-memory-ink mb-2 text-center">
            You&apos;ve been invited in
          </h1>
          <p className="text-memory-muted text-[14px] text-center mb-8 leading-relaxed">
            Enter your name and the password the family shared with you personally.
          </p>

          {unlockError && (
            <div role="alert" className="mb-5 p-3 rounded-xl bg-memory-bg dark:bg-memory-bg border border-memory-border text-memory-primary dark:text-memory-ink text-[13px]">
              {unlockError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="display-name"
                className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 dark:text-memory-ink/70 mb-1.5"
              >
                Your Name
              </label>
              <input
                id="display-name"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full rounded-xl border border-memory-border bg-white dark:bg-memory-bg px-5 py-4 text-[16px] text-memory-primary dark:text-memory-ink placeholder:text-memory-muted/60 outline-none focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20 transition-all duration-300 font-serif"
              />
            </div>

            <div>
              <label
                htmlFor="unlock-password"
                className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 dark:text-memory-ink/70 mb-1.5"
              >
                Password
              </label>
              <input
                id="unlock-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Given to you personally by the family"
                className="w-full rounded-xl border border-memory-border bg-white dark:bg-memory-bg px-5 py-4 text-[16px] text-memory-primary dark:text-memory-ink placeholder:text-memory-muted/60 outline-none focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20 transition-all duration-300 font-serif"
              />
            </div>

            <Button type="submit" size="lg" loading={unlocking} className="w-full mt-2">
              {unlocking ? "Opening…" : "View the Memoir"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!memoirData || !readerToken) return null;

  const hasChapters = memoirData.chapters.length > 0;

  return (
    <div className="min-h-screen bg-memory-bg dark:bg-memory-bg text-memory-primary dark:text-memory-ink font-sans flex flex-col items-center pt-20 pb-32">
      <header className="mb-14 text-center px-6">
        <h1 className="font-serif text-4xl md:text-5xl text-memory-primary dark:text-memory-ink mb-2">
          {memoirData.subject_name}
        </h1>
        {(memoirData.subject_born_on || memoirData.subject_died_on) && (
          <p className="text-memory-muted tracking-[0.15em] uppercase text-xs">
            {memoirData.subject_born_on?.slice(0, 4)}
            {" — "}
            {memoirData.subject_is_living ? "Present" : memoirData.subject_died_on?.slice(0, 4)}
          </p>
        )}
      </header>

      <main className="max-w-2xl w-full px-6">
        {!hasChapters && memoirData.narrative_sections.length > 0 && (
          <div className="mb-16">
            <NarrativeSectionsView
              memoirId={memoirData.id}
              sections={memoirData.narrative_sections}
              shareToken={token}
              readerToken={readerToken}
            />
          </div>
        )}

        {hasChapters ? (
          memoirData.chapters.map((chapter) => {
            const chapterMemories = memoirData.memories.filter((m) => m.chapter_id === chapter.id);
            const chapterNarrative = memoirData.narrative_sections.filter((s) => s.chapter_id === chapter.id);

            return (
              <section key={chapter.id} className="mb-16">
                <div className="mb-4 pb-3 border-b border-memory-border dark:border-memory-border">
                  <h2 className="font-serif text-2xl md:text-3xl text-memory-primary dark:text-memory-ink">
                    {chapter.title}
                  </h2>
                  {chapter.summary && (
                    <p className="font-serif italic text-memory-muted text-sm mt-2">{chapter.summary}</p>
                  )}
                </div>

                {chapterNarrative.length > 0 && (
                  <div className="mb-6">
                    <NarrativeSectionsView
                      memoirId={memoirData.id}
                      sections={chapterNarrative}
                      shareToken={token}
                      readerToken={readerToken}
                      showLabel={false}
                    />
                  </div>
                )}

                {chapterMemories.length === 0 ? (
                  <p className="text-sm font-serif italic text-memory-muted py-2">No memories in this chapter yet.</p>
                ) : (
                  chapterMemories.map((memory) => (
                    <ReaderMemoryCard
                      key={memory.id}
                      memoirId={memoirData.id}
                      memory={memory}
                      canComment={memoirData.can_comment}
                      shareToken={token}
                      readerToken={readerToken}
                    />
                  ))
                )}
              </section>
            );
          })
        ) : memoirData.memories.length === 0 ? (
          <p className="text-center font-serif italic text-memory-muted py-10">
            Nothing has been added to this memoir yet.
          </p>
        ) : (
          memoirData.memories.map((memory) => (
            <ReaderMemoryCard
              key={memory.id}
              memoirId={memoirData.id}
              memory={memory}
              canComment={memoirData.can_comment}
              shareToken={token}
              readerToken={readerToken}
            />
          ))
        )}
      </main>
    </div>
  );
}
