# src/lib

App-wide infrastructure. Covers the ground the backend splits between `src/integrations/`
(talking to the outside world) and `src/core/` (app setup).

Code here knows nothing about any particular feature. If it mentions a greeting, a user, or an
order, it belongs in `src/features/` instead.

## Contents

| Path | Role | Backend equivalent |
| --- | --- | --- |
| `api/client.ts` | The **only** module that calls `fetch`. Base URL, timeouts, error normalization, response validation. | `integrations/llm_client.py` |
| `api/origin.ts` | Normalizes the configured API URL and derives its origin for browser requests and CSP. | `core/config.py` |
| `api/errors.ts` | The `ApiError` taxonomy: `network`, `http`, `contract`. | — |
| `config/env.ts` | Zod-validated environment variables. Fails at boot, not at runtime. | `core/` |
| `query/client.ts` | TanStack Query defaults: stale time, retry policy. | — |
| `utils.ts` | shadcn's `cn` helper. Managed by the shadcn CLI — leave it alone. | — |

## lib vs. utils vs. hooks

Three directories hold code no single feature owns. The line between them is dependencies:

| Directory | Holds | Test |
| --- | --- | --- |
| `lib/` | Infrastructure — dependencies, configuration, state, I/O | You mock it in tests |
| `utils/` | Pure functions — no dependencies, no I/O | You just call it |
| `hooks/` | Generic React hooks — state, effects, browser APIs, no fetching | It starts with `"use client"` |

Rule of thumb: if it has to be configured, awaited, or mocked, it belongs here in `lib/`.

Note that `utils.ts` in this directory is shadcn's `cn` helper and is unrelated to `src/utils/`. Leave
it where it is.

## Adding to this directory

Ask first whether it is really app-wide. A helper used by one feature belongs in that feature.

Good reasons to add here:

- A second external service the app talks to (analytics, file uploads) → new folder under `lib/`,
  built the way `api/` is: one module owning all contact with that service.
- App-wide configuration or a provider used by every route.

When authentication arrives, the token belongs in `api/client.ts` — the single place requests are
built — and nowhere else.
