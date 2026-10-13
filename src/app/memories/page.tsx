import { FlatRouteRedirect } from "@/features/memoirs/FlatRouteRedirect";

/**
 * Resolver, not a screen. §1: the flat workspace routes send the owner to
 * their most recently updated draft, so the workspace is never ambiguous
 * about which memoir it is showing.
 */
export default function MemoriesFlatRoute() {
  return <FlatRouteRedirect section="memories" />;
}
