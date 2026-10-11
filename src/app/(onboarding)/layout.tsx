// src/app/(onboarding)/layout.tsx
//
// Deliberately no Navbar or AnnouncementBar here. The onboarding sequence is
// one question per screen with nothing else competing for attention -- a
// marketing nav and a pricing banner have no place mid-flow. Each screen
// carries its own quiet "n of m" progress mark (see features/onboarding/*).
//
// PageTurn wraps the route change between steps as a book page turning
// rather than a hard navigation -- see features/onboarding/PageTurn.tsx.

import { PageTurn } from "@/features/onboarding/PageTurn";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas">
      <PageTurn>{children}</PageTurn>
    </main>
  );
}
