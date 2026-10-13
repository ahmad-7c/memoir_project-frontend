import { WorkspaceGuard } from "@/features/memoirs/WorkspaceGuard";

/**
 * Every workspace route under /memoirs/[id] is scoped to one memoir and
 * exists only while that memoir is a draft. WorkspaceGuard resolves it once
 * here, so the child pages never re-fetch it and never have to handle the
 * published / not-yours cases themselves.
 */
export default async function MemoirWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceGuard memoirId={id}>{children}</WorkspaceGuard>;
}
