"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeafMark } from "./Logo";
import { InitialAvatar } from "./ui/InitialAvatar";
import { api } from "@/lib/api/client";

/**
 * The logged-in top bar on /memories, /chapters: wordmark, "Your memoir",
 * "Read the memoir", account initial. The avatar resolves to the real
 * signed-in owner's name (not a hardcoded "S") and links to /profile --
 * previously the only account-level screen in the app with no way to
 * reach it from here, and no way to log out from anywhere at all.
 */
export default function AppTopBar() {
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    let cancelled = false;
    api
      .getOwnerProfile()
      .then((profile) => {
        if (!cancelled && profile?.name) setInitial(profile.name[0].toUpperCase());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="flex items-center justify-between max-w-[1440px] h-[84px] mx-auto px-6 md:px-16">
      <Link href="/memories" className="flex items-center gap-3 font-serif text-2xl font-semibold text-foreground">
        <LeafMark className="w-6 h-6 text-primary" />
        The Family Memoir
      </Link>
      <nav className="flex items-center gap-[34px]">
        <Link href="/memories" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          Your memoir
        </Link>
        <Link href="/memoir" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          Read the memoir
        </Link>
        <Link href="/profile" aria-label="Your profile">
          <InitialAvatar initial={initial} size={36} />
        </Link>
      </nav>
    </header>
  );
}
