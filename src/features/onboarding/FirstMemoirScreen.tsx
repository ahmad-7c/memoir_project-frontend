"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

interface PendingMemoirDraft {
  subject_name?: string;
  subject_born_on?: string | null;
  subject_died_on?: string | null;
  subject_is_living?: boolean;
  description?: string;
}

/**
 * The first deliberate, named moment in this product: creating the memoir
 * itself. Previously this happened silently in the background right after
 * signup/login, with the owner never seeing it happen. Typing a dead
 * parent's name deserves a screen of its own, not a loading spinner on the
 * way to a dashboard.
 *
 * Name and dates only -- nothing else. If onboarding already collected
 * these (features/onboarding/MemorySubjectSelection.tsx), they're
 * pre-filled here rather than asked again; a user who skipped onboarding
 * (e.g. logged in directly) still gets a blank, working form.
 */
export default function FirstMemoirScreen() {
  const router = useRouter();

  const draft: PendingMemoirDraft = (() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem("pending_memoir");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const [name, setName] = useState(draft.subject_name || "");
  const [dob, setDob] = useState(draft.subject_born_on || "");
  const [dod, setDod] = useState(draft.subject_died_on || "");
  const [isAlive, setIsAlive] = useState(draft.subject_is_living ?? false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Same real-world constraint as the onboarding version of this form: no
  // future birth dates, and a date of passing has to fall between birth and
  // today.
  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Their name is how this memoir begins. Please enter it.");
      return;
    }
    if (!dob.trim()) {
      setError("Please add a date of birth.");
      return;
    }
    if (dob > today) {
      setError("Date of birth can't be in the future.");
      return;
    }
    if (!isAlive && !dod.trim()) {
      setError('Please add a date of passing, or check "Still with us".');
      return;
    }
    if (!isAlive && dod.trim()) {
      if (dod > today) {
        setError("Date of passing can't be in the future.");
        return;
      }
      if (dod < dob) {
        setError("Date of passing can't be before their date of birth.");
        return;
      }
    }

    setCreating(true);
    try {
      const created = await api.createMemoir({
        subject_name: name.trim(),
        subject_born_on: dob.trim(),
        subject_died_on: isAlive ? undefined : dod.trim(),
        subject_is_living: isAlive,
        description: draft.description,
      });
      const memoir = created.data || created;
      localStorage.setItem("active_memoir", JSON.stringify(memoir));
      localStorage.removeItem("pending_memoir");
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create this memoir. Please try again.");
      setCreating(false);
    }
  };

  return (
    <section className="min-h-screen bg-canvas flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="w-full max-w-110 text-center"
      >
        <h1 className="font-serif text-heading text-ink leading-snug mb-3">Create your first memoir</h1>
        <p className="text-body-ui text-ink-secondary mb-12 max-w-sm mx-auto">
          This is where their story will live. Everything else can be added once it exists.
        </p>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 text-left rounded-md border border-line bg-surface px-5 py-4">
            <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
            <p className="text-body-ui text-ink">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
          <div>
            <Label htmlFor="first-memoir-name">Their name</Label>
            <Input
              id="first-memoir-name"
              type="text"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g. Fatima Khan"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-memoir-dob">Born</Label>
              <Input
                id="first-memoir-dob"
                type="date"
                value={dob}
                max={today}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Label htmlFor="first-memoir-dod">Passed</Label>
              <Input
                id="first-memoir-dod"
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

          <label className="flex items-center gap-2.5 text-body-ui text-ink-secondary cursor-pointer select-none -mt-1">
            <input
              type="checkbox"
              checked={isAlive}
              onChange={(e) => {
                setIsAlive(e.target.checked);
                if (e.target.checked) setDod("");
              }}
              className="w-4.5 h-4.5 rounded-sm border-line accent-ink cursor-pointer"
            />
            Still with us
          </label>

          <Button type="submit" size="lg" loading={creating} className="w-full mt-4">
            {creating ? "Creating…" : "Create this memoir"}
          </Button>
        </form>
      </motion.div>
    </section>
  );
}
