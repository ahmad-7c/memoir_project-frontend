"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { api, OwnerMemoirSummary, OwnerProfile } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/ScreenStates";

function formatDates(m: OwnerMemoirSummary): string {
  if (m.subject_is_living) {
    const born = m.subject_born_on ? new Date(m.subject_born_on).getFullYear() : "";
    return born ? `${born} — Present` : "Living";
  }
  const born = m.subject_born_on ? new Date(m.subject_born_on).getFullYear() : "";
  const died = m.subject_died_on ? new Date(m.subject_died_on).getFullYear() : "";
  if (!born && !died) return "";
  return `${born} — ${died}`;
}

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getOwnerProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Clicking a memoir hands the chosen one to the dashboard/final-memoir
  // pages exactly the way they already resolve their active memoir
  // elsewhere (useAuth, dashboard/page.tsx) -- via the same localStorage key.
  const openMemoir = (memoir: OwnerMemoirSummary) => {
    localStorage.setItem(
      "active_memoir",
      JSON.stringify({
        id: memoir.id,
        subject_name: memoir.subject_name,
        subject_born_on: memoir.subject_born_on,
        subject_died_on: memoir.subject_died_on,
      }),
    );
    router.push(memoir.status === "published" ? "/final-memoir" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-memory-bg dark:bg-memory-bg text-stone-900 dark:text-memory-ink font-sans px-6 md:px-12 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-memory-muted hover:text-memory-primary dark:hover:text-memory-ink text-[13px] font-medium transition cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading your profile…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : profile ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-memory-card dark:bg-memory-card border border-memory-border rounded-3xl px-8 py-8 mb-10 shadow-sm"
            >
              <h1 className="font-serif text-3xl text-memory-primary dark:text-memory-ink mb-1">{profile.name}</h1>
              <p className="text-memory-muted text-[15px] mb-4">{profile.email}</p>
              <Badge variant={profile.subscription_status === "free" ? "neutral" : "primary"}>
                {profile.subscription_status}
              </Badge>
            </motion.div>

            <h2 className="font-serif text-xl text-memory-primary dark:text-memory-ink mb-4">Your Memoirs</h2>

            {profile.memoirs.length === 0 ? (
              <EmptyState
                title="No memoirs yet"
                description="Once you create one, it will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {profile.memoirs.map((memoir) => (
                  <motion.button
                    key={memoir.id}
                    type="button"
                    onClick={() => openMemoir(memoir)}
                    whileHover={{ y: -2 }}
                    className="text-left bg-memory-card dark:bg-memory-card border border-memory-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4"
                  >
                    <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-200 dark:bg-memory-border border border-stone-200 dark:border-memory-border">
                      {memoir.cover_image_url ? (
                        <Image
                          src={memoir.cover_image_url}
                          alt={memoir.subject_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-2xl text-stone-400">
                          {memoir.subject_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-serif text-lg text-stone-900 dark:text-memory-ink truncate">
                          {memoir.subject_name}
                        </h3>
                        {memoir.status === "published" ? (
                          <Badge variant="primary">Published</Badge>
                        ) : (
                          <Badge variant="neutral">Draft</Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-stone-500 mb-2">{formatDates(memoir)}</p>
                      <p className="text-[11px] text-stone-400 uppercase tracking-wide">
                        {memoir.memory_count} {memoir.memory_count === 1 ? "memory" : "memories"} ·
                        Updated {formatUpdated(memoir.updated_at)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
