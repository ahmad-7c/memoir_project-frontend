// src/app/(onboarding)/layout.tsx
//
// No SiteHeader/AppTopBar here. The onboarding sequence is one question per
// screen with nothing else competing for attention. Each screen carries its
// own quiet "n of m" progress mark (see features/onboarding/OnboardingProgress).

import { OnboardingTransition } from "@/features/onboarding/OnboardingTransition";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <OnboardingTransition>{children}</OnboardingTransition>
    </main>
  );
}
