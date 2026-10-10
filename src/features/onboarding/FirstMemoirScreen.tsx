"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";

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
    if (!isAlive && !dod.trim()) {
      setError('Please add a date of passing, or check "Still with us".');
      return;
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
    <section className="min-h-screen bg-memory-bg dark:bg-memory-bg text-memory-primary dark:text-memory-ink flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        <h1 className="font-serif text-3xl md:text-4xl leading-snug mb-3">
          Create your first memoir
        </h1>
        <p className="text-memory-muted text-[15px] leading-relaxed mb-12 max-w-sm mx-auto">
          This is where their story will live. You can add everything else once
          it exists.
        </p>

        {error && (
          <div role="alert" className="mb-6 text-left p-4 bg-memory-card dark:bg-memory-card border border-memory-border rounded-xl text-sm text-memory-primary dark:text-memory-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
          <div>
            <label
              htmlFor="first-memoir-name"
              className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 dark:text-memory-ink/70 mb-2"
            >
              Their name
            </label>
            <input
              id="first-memoir-name"
              type="text"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g. Fatima Khan"
              autoFocus
              className="w-full rounded-xl border border-memory-border bg-white dark:bg-memory-card px-5 py-4 text-[17px] text-memory-primary dark:text-memory-ink placeholder:text-memory-muted/60 outline-none focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first-memoir-dob"
                className="block text-xs uppercase tracking-widest font-bold text-memory-primary/70 dark:text-memory-ink/70 mb-2"
              >
                Born
              </label>
              <input
                id="first-memoir-dob"
                type="date"
                value={dob}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
                className="w-full rounded-xl border border-memory-border bg-white dark:bg-memory-card px-4 py-4 text-[15px] text-memory-primary dark:text-memory-ink outline-none focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="first-memoir-dod"
                  className="text-xs uppercase tracking-widest font-bold text-memory-primary/70 dark:text-memory-ink/70"
                >
                  Passed
                </label>
              </div>
              <input
                id="first-memoir-dod"
                type="date"
                value={dod}
                disabled={isAlive}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDod(e.target.value)}
                className={`w-full rounded-xl border px-4 py-4 text-[15px] outline-none transition-all ${
                  isAlive
                    ? "bg-memory-card dark:bg-memory-card/60 border-memory-border text-memory-muted cursor-not-allowed"
                    : "bg-white dark:bg-memory-card border-memory-border text-memory-primary dark:text-memory-ink focus:border-memory-accent focus:ring-2 focus:ring-memory-accent/20 cursor-pointer"
                }`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-memory-muted cursor-pointer select-none -mt-1">
            <input
              type="checkbox"
              checked={isAlive}
              onChange={(e) => {
                setIsAlive(e.target.checked);
                if (e.target.checked) setDod("");
              }}
              className="w-[18px] h-[18px] rounded border-memory-border accent-memory-primary cursor-pointer"
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
