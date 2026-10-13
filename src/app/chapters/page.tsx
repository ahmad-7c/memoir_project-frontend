import { FlatRouteRedirect } from "@/features/memoirs/FlatRouteRedirect";

/** Resolver, not a screen -- see /memories. */
export default function ChaptersFlatRoute() {
  return <FlatRouteRedirect section="chapters" />;
}
