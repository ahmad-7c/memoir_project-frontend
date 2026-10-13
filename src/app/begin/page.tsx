import { BeginFlow } from "@/features/onboarding/BeginFlow";

/**
 * §3b. Five steps, one question per screen, account created LAST.
 * All the state lives in BeginFlow; this is just the route.
 */
export default function BeginPage() {
  return <BeginFlow />;
}
