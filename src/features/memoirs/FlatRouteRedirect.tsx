"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppTopBar from "@/components/AppTopBar";
import Footer from "@/components/Footer";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { resolveFlatRouteTarget } from "./memoirRouting";

/**
 * The flat workspace routes (/memories, /chapters, /memoir) are not screens
 * of their own -- they resolve which memoir the owner means and hand off to
 * the id-scoped route. §1: the workspace must never be ambiguous about which
 * memoir it is showing.
 *
 * The one case that renders instead of redirecting is "every memoir is
 * published": the clean beginning from §1's post-publish behaviour. No
 * subject name, no memories, no chapters, one action. It is not an error and
 * must not read like one.
 */
export function FlatRouteRedirect({ section }: { section: "memories" | "chapters" | "preview" }) {
  const router = useRouter();
  const [state, setState] = useState<"resolving" | "empty" | "error">("resolving");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    resolveFlatRouteTarget()
      .then((target) => {
        if (cancelled) return;
        if (target.kind === "draft") {
          // replace, not push: the flat URL is a resolver, and leaving it in
          // history means Back lands on it and immediately bounces forward
          // again, trapping the user.
          router.replace(`/memoirs/${target.memoirId}/${section}`);
        } else if (target.kind === "create") {
          router.replace("/memoirs/new");
        } else {
          setState("empty");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load your memoirs.");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [router, section]);

  if (state === "resolving") {
    return (
      <main className="min-h-screen">
        <AppTopBar />
        <LoadingState label="Finding your memoir…" />
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen">
        <AppTopBar />
        <div className="py-16">
          <ErrorState message={error ?? "Something went wrong."} />
        </div>
      </main>
    );
  }

  // Every memoir is published. A clean beginning, not an empty dashboard:
  // no counters, no "0 memories", nothing the owner has to dismiss.
  return (
    <main className="min-h-screen flex flex-col">
      <AppTopBar />
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-4">
            A quiet page
          </p>
          <h1 className="font-serif text-4xl text-foreground mb-4 leading-tight">
            Everyone has someone to remember.
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Their memoir is finished and safe. When you&rsquo;re ready, there is room here for
            another.
          </p>
          <Link
            href="/memoirs/new"
            className="inline-flex items-center justify-center h-11 px-7 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Begin a memoir for someone you love
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
