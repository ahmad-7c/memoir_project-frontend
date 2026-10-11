/**
 * @file OnboardingProgress.tsx
 * @description Quiet "n of 5" progress mark shared by every onboarding
 * screen (memory-subject-selection -> handwritten-note -> unfold-memory ->
 * memory-moment -> invite-family-friends, in that order) -- Micro type, not
 * a progress bar.
 */

export const ONBOARDING_STEP_COUNT = 5;

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <p className="text-micro uppercase tracking-[0.06em] font-semibold text-ink-muted text-center mb-6">
      {step} of {ONBOARDING_STEP_COUNT}
    </p>
  );
}
