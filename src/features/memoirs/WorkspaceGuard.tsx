"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import AppTopBar from "@/components/AppTopBar";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import type { MemoirSummary } from "./memoirRouting";

const MemoirContext = createContext<MemoirSummary | null>(null);

/**
 * The memoir this workspace route is scoped to. Guaranteed non-null and
 * guaranteed DRAFT: WorkspaceGuard does not render children otherwise.
 */
export function useWorkspaceMemoir(): MemoirSummary {
  const memoir = useContext(MemoirContext);
  if (!memoir) {
    throw new Error("useWorkspaceMemoir must be used inside a WorkspaceGuard");
  }
  return memoir;
}

/**
 * Enforces §1's lifecycle on every /memoirs/[id]/* workspace route.
 *
 *   published → the workspace does not exist for this memoir. Redirect to
 *               the profile. Not a disabled view, not a read-only view with
 *               the controls greyed out -- gone. §6 is explicit that an
 *               edit affordance must be ABSENT, and the cleanest way to
 *               guarantee that is for the route itself to stop existing.
 *   404/403   → the id isn't theirs or isn't real. The API deliberately does
 *               not distinguish those, and neither does this.
 *   draft     → render.
 *
 * Ownership is verified by the API on this call and on every subsequent one;
 * this component is the UX layer over that, not the security boundary.
 */
export function WorkspaceGuard({
  memoirId,
  children,
}: {
  memoirId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [memoir, setMemoir] = useState<MemoirSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .getMemoir(memoirId)
      .then((m) => {
        if (cancelled) return;
        if (m.status === "published") {
          router.replace("/profile");
          return;
        }
        setMemoir(m as MemoirSummary);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 404 || status === 403) {
          router.replace("/profile");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not open this memoir.");
      });

    return () => {
      cancelled = true;
    };
  }, [memoirId, router]);

  if (error) {
    return (
      <main className="min-h-screen">
        <AppTopBar />
        <div className="py-16">
          <ErrorState message={error} />
        </div>
      </main>
    );
  }

  if (!memoir) {
    return (
      <main className="min-h-screen">
        <AppTopBar />
        <LoadingState label="Opening the memoir…" />
      </main>
    );
  }

  return <MemoirContext.Provider value={memoir}>{children}</MemoirContext.Provider>;
}
