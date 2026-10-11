"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, OwnerMemoirSummary, OwnerProfile } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
    <div className="min-h-screen bg-canvas px-6 md:px-12 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-ink-muted hover:text-ink-secondary text-body-ui transition-colors cursor-pointer"
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
              transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
              className="mb-12"
            >
              <h1 className="font-serif text-heading text-ink mb-1">{profile.name}</h1>
              <p className="text-body-ui text-ink-secondary mb-4">{profile.email}</p>
              <Badge variant={profile.subscription_status === "free" ? "neutral" : "calm"}>
                {profile.subscription_status}
              </Badge>
            </motion.div>

            <h2 className="font-serif text-subhead text-ink mb-6">Your memoirs</h2>

            {profile.memoirs.length === 0 ? (
              <EmptyState title="No memoirs yet" description="Once you create one, it will appear here." />
            ) : (
              /* Ordering is the backend's, deliberately: drafts first
                 (newest-edit-first, since they need attention), then
                 published (newest-publish-first). Not re-sorted here. */
              <div className="flex flex-col gap-5">
                {profile.memoirs.map((memoir) => (
                  <button key={memoir.id} type="button" onClick={() => openMemoir(memoir)} className="text-left w-full cursor-pointer">
                    <Card className="flex flex-col sm:flex-row hover:border-brass-deep transition-colors">
                      <div className="sm:w-56 shrink-0">
                        {memoir.cover_image_url ? (
                          <Card.Media src={memoir.cover_image_url} alt={memoir.subject_name} />
                        ) : (
                          <div className="w-full aspect-3/2 bg-surface-sunk flex items-center justify-center">
                            <span className="font-serif text-heading text-ink-muted">
                              {memoir.subject_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 p-6 flex flex-col justify-center">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="font-serif text-display text-ink truncate">{memoir.subject_name}</h3>
                          {memoir.status === "published" && <Badge variant="brass">Published</Badge>}
                        </div>
                        <p className="text-small text-ink-muted mb-2">{formatDates(memoir)}</p>
                        <p className="text-small text-ink-muted">
                          {memoir.memory_count} {memoir.memory_count === 1 ? "memory" : "memories"} · updated{" "}
                          {formatUpdated(memoir.updated_at)}
                        </p>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
