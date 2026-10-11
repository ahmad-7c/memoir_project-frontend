"use client";

import { usePathname } from "next/navigation";

/**
 * Replaces the old 3D book-page-turn transition between onboarding steps.
 * That mechanic belonged to this project's previous theme, not this
 * reference's restrained motion language (one 700ms fade-up, no custom
 * easing, no stagger -- see docs/design-reference.md §5) -- carrying it
 * forward would have clashed tonally with every other screen in this
 * rebuild. `key={pathname}` forces a remount per step so `.fade-in`
 * actually restarts rather than only firing once on the layout's own
 * mount.
 */
export function OnboardingTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="fade-in">
      {children}
    </div>
  );
}
