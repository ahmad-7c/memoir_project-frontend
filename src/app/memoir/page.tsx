import { FlatRouteRedirect } from "@/features/memoirs/FlatRouteRedirect";

/** Resolver, not a screen -- see /memories. Lands on the draft's preview. */
export default function MemoirFlatRoute() {
  return <FlatRouteRedirect section="preview" />;
}
