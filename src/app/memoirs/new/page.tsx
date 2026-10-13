"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { api } from "@/lib/api/client";
import { uploadMediaAsset } from "@/hooks/useMediaUpload";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { LeafMark } from "@/components/Logo";
import { readOnboardingDraft, clearOnboardingDraft } from "@/features/onboarding/draft";

/**
 * §4. A memoir is mandatory and immediate: after the account exists, this is
 * where the user goes -- not the workspace, not the profile. An
 * authenticated user with no memoir is always sent here.
 *
 * Deliberately bare: no top bar, no tabs, no navigation. One question that
 * matters (their name), two that help (dates), one that can wait (a
 * photograph), and one button. Typing a dead parent's name deserves a screen
 * of its own.
 */
export default function NewMemoirPage() {
  const router = useRouter();

  // Pre-filled from onboarding step 2 when they came through /begin; blank
  // for an existing owner adding a second memoir from their profile.
  const [name, setName] = useState(() => readOnboardingDraft().subjectName ?? "");
  const [dob, setDob] = useState("");
  const [dod, setDod] = useState("");
  const [isAlive, setIsAlive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Their name is how this memoir begins. Please enter it.");
      return;
    }
    if (dob && dob > today) {
      setError("Date of birth can't be in the future.");
      return;
    }
    if (!isAlive && dod) {
      if (dod > today) {
        setError("Date of passing can't be in the future.");
        return;
      }
      if (dob && dod < dob) {
        setError("Date of passing can't be before their date of birth.");
        return;
      }
    }

    setCreating(true);
    try {
      const draft = readOnboardingDraft();
      const created = await api.createMemoir({
        subject_name: name.trim(),
        subject_born_on: dob.trim() || undefined,
        subject_died_on: isAlive ? undefined : dod.trim() || undefined,
        subject_is_living: isAlive,
        relationship: draft.relationship,
      });
      const memoir = created.data || created;

      // Best-effort: the memoir exists by now, so a failed photo upload must
      // not strand them here. They can add one later from the workspace, by
      // the same upload path.
      if (photoFile && memoir?.id) {
        try {
          const mediaId = await uploadMediaAsset(
            memoir.id,
            photoFile,
            photoFile.name,
            photoFile.type,
            "photo",
          );
          await api.setMemoirCover(memoir.id, mediaId);
        } catch (photoErr) {
          console.error("Could not set the cover photo", photoErr);
        }
      }

      // Only now: the account exists AND the onboarding answers have been
      // persisted into a real memoir. Clearing any earlier would lose them
      // on a failure between signup and creation.
      clearOnboardingDraft();

      router.replace(`/memoirs/${memoir.id}/memories`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not create this memoir. Please try again.",
      );
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 font-serif text-xl text-foreground mb-10">
          <LeafMark className="w-5 h-5 text-accent" />
          The Family Memoir
        </div>

        <h1 className="font-serif text-4xl text-foreground leading-snug mb-3">
          Who is this memoir for?
        </h1>
        <p className="text-sm text-muted-foreground mb-12 max-w-sm mx-auto">
          This is where their story will live. Everything else can be added once it exists.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 text-left rounded-md border border-border bg-card px-5 py-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
          <div className="flex flex-col items-center gap-2 mb-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Add a photograph of them"
              className="relative w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center cursor-pointer border border-border hover:border-accent transition-colors"
            >
              {photoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-muted-foreground" />
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              {photoPreview ? "Looking good." : "A photograph of them (optional)."}
            </p>
          </div>

          <div>
            <Label htmlFor="new-memoir-name">Their name</Label>
            <Input
              id="new-memoir-name"
              type="text"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g. Fatima Khan"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-memoir-dob">Born</Label>
              <Input
                id="new-memoir-dob"
                type="date"
                value={dob}
                max={today}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Label htmlFor="new-memoir-dod">Passed</Label>
              <Input
                id="new-memoir-dod"
                type="date"
                value={dod}
                min={dob || undefined}
                max={today}
                disabled={isAlive}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDod(e.target.value)}
                className="cursor-pointer"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer select-none -mt-1">
            <input
              type="checkbox"
              checked={isAlive}
              onChange={(e) => {
                setIsAlive(e.target.checked);
                if (e.target.checked) setDod("");
              }}
              className="w-4.5 h-4.5 rounded-sm border-border accent-accent cursor-pointer"
            />
            Still with us
          </label>

          <Button type="submit" size="lg" loading={creating} className="w-full mt-4">
            {creating ? "Creating…" : "Create this memoir"}
          </Button>
        </form>
      </div>
    </main>
  );
}
