# Frontend Guide — Explained Simply

Hi! Let's learn this frontend together, step by step, like building with LEGO blocks.
No rushing. Small pieces. One idea at a time.

---

## 1. What is this project, really?

Think of the frontend like a **restaurant**.

- The **customer** is the person using the website.
- The **waiter** takes the customer's order to the kitchen and brings food back. That's `app/`.
- The **kitchen** cooks the actual food (the real work). That's `features/`.
- The **delivery truck** that brings ingredients from the farm (the backend) is `lib/api/client.ts`.
- The **plates and cups** (things every dish uses) are `components/ui/`.

That's the whole idea. Everything else is just details of this same picture.

---

## 2. The big map

```
app/        → the waiter (routes/pages, stays thin)
features/   → the kitchen (one folder per "dish" = one feature)
lib/        → the delivery truck + rules (talks to backend, checks env, sets up tools)
components/ → the plates & cups (shared UI, knows nothing special)
hooks/      → shared little tricks anyone in the kitchen can use (empty for now)
utils/      → shared little math/text helpers (empty for now)
```

This project only has ONE real feature right now, called `example`. It's not
a real feature — it's a **teaching sample** you copy to build your own features.

---

## 3. Let's walk through each folder

### `src/app/` — the front door

This is where **pages/routes** live. Rule: this folder must stay **thin**,
meaning it should NOT do real work. It just calls the kitchen (`features/`)
and shows what comes back.

| File | What it's for, in kid words |
|---|---|
| `layout.tsx` | The outer shell of every page — like the walls of the restaurant. |
| `providers.tsx` | Turns on tools every page needs (like turning on the lights). It's the ONE file allowed to say `"use client"` at the top level. |
| `page.tsx` | The homepage. |
| `example/page.tsx` | The page for our sample feature. |
| `error.tsx` | If something breaks, this shows a friendly "oops" screen instead of a scary crash. |

### `src/features/example/` — the kitchen for one dish

Every feature (like "example") gets **its own folder** with everything it needs.
If you delete the folder, the whole feature disappears — nothing is left behind
scattered elsewhere. That's the rule.

| File | What it's for, in kid words |
|---|---|
| `schemas.ts` | The **recipe card**. It says exactly what shape the data must be (what fields, what type). |
| `api.ts` | The **order slip**. It's the ONLY file that knows the backend's address (`/example/greet`). |
| `queries.ts` | Path #1: fetch data **on the server** (before the page even reaches the browser). |
| `hooks.ts` | Path #2: fetch data **in the browser**, after a button click. |
| `index.ts` | The "menu" — the only door other files use to grab things from this feature. |
| `server.ts` | Same as `index.ts` but only usable by server code. |
| `components/GreetingCard.tsx` | Just shows a message. Doesn't fetch anything itself. |
| `components/GreetingForm.tsx` | A form the user types into and clicks a button. |

### `src/lib/` — the delivery truck and the rulebook

Nothing here knows what a "greeting" is. It just handles **plumbing**.

| File | What it's for, in kid words |
|---|---|
| `api/client.ts` | The ONLY file in the whole app allowed to call `fetch`. Every request to the backend passes through here. |
| `api/errors.ts` | Turns every possible failure into one neat shape: `ApiError`. |
| `config/env.ts` | Checks that your `.env` settings (like the backend's URL) are correct **before** the app even starts. |
| `query/client.ts` | Settings for how long to trust cached data, how many times to retry, etc. |

### `src/components/ui/` — plates and cups

Generic buttons, cards, inputs, labels. They don't know what a "greeting" or
a "user" is. If a component knows about your business idea, it does NOT
belong here — it belongs inside a feature folder.

### `src/hooks/` and `src/utils/` — empty toolboxes

Both are empty on purpose! Rule: **don't add a tool until a second feature
actually needs it.** Right now there's only one feature, so nothing has been
promoted here yet.

---

## 4. How does one page actually work? (the story)

Let's trace `/example` — the sample page — like a treasure map.

### Story A: Page loads by itself (Server Path)

```
1. Browser asks for /example
2. app/example/page.tsx runs on the SERVER
3. It calls getGreeting() from features/example/server.ts
4. server.ts calls postGreeting() from features/example/api.ts
5. api.ts calls apiRequest() from lib/api/client.ts
6. client.ts does the real fetch() to the FastAPI backend
7. Backend replies → client.ts checks the reply against schemas.ts
8. If it matches → data flows back up, page.tsx shows it as ready-made HTML
```

No spinner. No loading wheel. The visitor just sees the finished page,
because all of this happened before the page was even sent to their browser.

### Story B: User clicks a button (Client Path)

```
1. User types a name into GreetingForm.tsx and clicks "Greet"
2. GreetingForm.tsx calls useGreetingMutation() from features/example/hooks.ts
3. hooks.ts calls postGreeting() from features/example/api.ts  (same file as before!)
4. api.ts calls apiRequest() from lib/api/client.ts             (same file as before!)
5. client.ts fetches the backend, checks the answer against schemas.ts
6. Result comes back into the browser, GreetingForm.tsx re-renders with it
```

Notice: **both stories end up going through the exact same `api.ts` and the
exact same `schemas.ts`.** That's on purpose — one door in, one door out, so
nothing gets written twice.

### Picture it like a river

```
             ┌── queries.ts  (server) ──┐
app/ pages ──┤                          ├── api.ts ── lib/api/client.ts ── BACKEND
             └── hooks.ts   (client) ───┘
```

Every road leads through `api.ts`, then through `client.ts`, then to the
real backend. Nothing skips this river.

---

## 5. Why does data get "checked" (validated)?

Imagine the backend sends a box. Before opening it in front of guests, we
peek inside and make sure it has exactly what we expect (a `message`, a
`success` flag). This peeking is done by **Zod schemas** (`schemas.ts`).

- If the box is missing something → we throw a clear error: **"contract
  broken, fix the code."**
- If the truck never arrived (backend is down) → **"network error."**
- If the backend says "no, bad request" → **"http error."**

This means nobody in the app ever touches a messy, un-checked surprise box.

---

## 6. Files that talk to the backend (call the routers)

This is the important part you asked about — **where does the frontend
actually reach out and call the backend's API routes?**

There is only **one true doorway** in the whole app:

### `src/lib/api/client.ts`
This is the **only** file in the ENTIRE frontend allowed to call `fetch()`.
It builds the full URL using `env.NEXT_PUBLIC_API_BASE_URL` + the path it's given.

Everything else reaches the backend **indirectly**, by calling this file:

| File | How it reaches the backend |
|---|---|
| `src/features/example/api.ts` | Calls `apiRequest()` from `client.ts`, and is the only file that writes the actual route path: `"/example/greet"` |
| `src/features/example/queries.ts` | Calls `postGreeting()` from `api.ts` — used for the **server-side** page load |
| `src/features/example/hooks.ts` | Calls `postGreeting()` from `api.ts` — used for the **client-side** button click |

So the real chain, top to bottom, is always:

```
queries.ts  ─┐
             ├──▶  api.ts  ──▶  lib/api/client.ts  ──▶  FastAPI backend router
hooks.ts    ─┘
```

**Simple rule to remember:** if you ever want to know which backend routes
the frontend calls, just open every feature's `api.ts` file — that's the
ONLY place route paths (like `/example/greet`) are ever written.

---

## Quick recap (say it out loud!)

- `app/` = thin waiter, no real work.
- `features/<name>/` = one folder, one whole feature, everything about it.
- `api.ts` = the only place a backend route's path is written.
- `client.ts` = the only file allowed to `fetch()`.
- `schemas.ts` = the rulebook that checks data shape both ways.
- Two paths to get data: `queries.ts` (server, default) and `hooks.ts` (client, only on user action).

Great job — you now know how the frontend breathes! 🎉 Ready for the next task whenever you are.
