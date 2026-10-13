/**
 * The three workspace tabs, scoped to one memoir.
 *
 * Labels are fixed by the design and must not drift; only the hrefs change
 * per memoir. Kept in one place so /memories and /chapters cannot disagree
 * about what the third tab is called or where it points.
 */
export function workspaceTabs(memoirId: string) {
  return [
    { label: "Memories", href: `/memoirs/${memoirId}/memories` },
    { label: "The chapters", href: `/memoirs/${memoirId}/chapters` },
    { label: "Preview memoir", href: `/memoirs/${memoirId}/preview` },
  ];
}
