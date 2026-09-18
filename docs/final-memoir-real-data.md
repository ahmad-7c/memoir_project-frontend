# Wiring `final-memoir/page.tsx` to real data

## The gap
`final-memoir/page.tsx` renders entirely from `FinalMemoir/mockData.ts`
(`mockMemories`, `mockHeroPhotos`, `mockShortQuotes`). Comments and PDF export
already call the real API; the memory list itself does not.

## Approach
One new hook, zero JSX changes. The page's components only know about three
shapes, already defined in `FinalMemoir/types.ts`:

```ts
MemoryItem  { id, author, title?, text, reactionsCount, imageUrl?, imageCaption?, chapter, chapterSubtitle?, date }
ShortQuote  { id, author, text }
HeroPhoto   { id, url, caption }
```

If a new data source produces arrays of exactly these shapes, the page
doesn't need to change at all — it already renders whatever `mockMemories`/
`mockHeroPhotos`/`mockShortQuotes` contain.

### `src/hooks/useFinalMemoirData.ts` (new)
Fetches in parallel, using endpoints already wired elsewhere:
- `api.getMemoirFeed(memoirId)` — the memories
- `api.getChapters(memoirId)` — chapter id → title, for grouping

Maps each feed item to a `MemoryItem`:
| MemoryItem field | Source |
|---|---|
| `id`, `text` (from `body_text`), `title`, `date` (from `occurred_start`) | direct from the feed record |
| `chapter` | look up `item.chapter_id` in the chapters map → `title`; memories with no `chapter_id` (organize never run, or the model left them ungrouped) fall into a fixed `"Uncategorized"` bucket so nothing silently disappears |
| `imageUrl` / `imageCaption` | first photo-kind media asset's `playback_url` / `caption`, if any |
| `author` | placeholder (`"Family"`) for now — the feed doesn't currently return a participant display name, only `author_participant_id`; resolving a real name would need a small backend addition, called out separately below rather than folded in silently |
| `reactionsCount` | always `0` — there is no reactions concept anywhere in the schema. Stays purely client-side/local state exactly as it is today; not persisted, not backend-integrated. Treating this as decorative-only avoids inventing a feature that was never asked for |

`HeroPhoto[]`: the first few photo playback URLs across all memories, in place of the fixed mock set.

`ShortQuote[]`: short excerpts (first ~120 characters) from a handful of memories with body text, in place of the fixed mock set. Lower-fidelity than a "real" pull-quote feature would be, but avoids inventing curation logic that isn't specified anywhere.

### `final-memoir/page.tsx` (one import swap)
```diff
- import { mockHeroPhotos, mockMemories, mockShortQuotes } from "@/features/FinalMemoir/mockData";
+ import { useFinalMemoirData } from "@/hooks/useFinalMemoirData";
...
- const filteredMemories = mockMemories.filter(...)
+ const { memories, heroPhotos, shortQuotes, loading } = useFinalMemoirData(memoirId);
+ const filteredMemories = memories.filter(...)
```
Same loading-state pattern already used in `dashboard/page.tsx` (a text placeholder while `loading` is true) — not a new visual pattern.

## Known follow-up, not folded into this change
Real commenter/author names need a backend addition (the feed doesn't return
one today) — flagged separately rather than bundled in, since it touches a
different endpoint's response shape.

## What stays untouched
- All JSX, layout, animations, styling in every `FinalMemoir/*` component.
- The reactions UI and its local `useState` — kept exactly as-is, just fed a `reactionsCount` of 0 instead of a mock number.
- Comments and export — already real, not touched.
