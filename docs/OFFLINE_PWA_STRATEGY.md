# Offline / PWA strategy (authoritative)

Status: implemented on branch `offline-pwa` from `origin/main` `00dcdfa`;
production unchanged until owner merge + deploy. This file is the
authoritative offline contract. Permanent trust rule:
**cached information must never pretend to be freshly verified.**

## Guarantees

Online visit → bounded verified opportunity cache → offline
Explore / recent items / Saved / Activity → queued safe mutations →
reconnect → server reconciliation → refresh / reverification.

- Public cache: latest/relevant ≤100 active published opportunities,
  seeded by `OfflineCacheSeed` after a successful online visit. No
  unlimited history.
- Recently viewed: ≤20 opportunity details via `OfflineRecentRecorder`,
  opened inline on `/offline` (expandable cached detail, no navigation
  while offline).
- Saved + Activity: per-account snapshots (`OfflineSavedSeed`,
  `OfflineActivitySeed`), readable offline, visibly stale.
- Mutations: Save/unsave + Interested/Applying/Applied queue locally
  (`queueMutationOnce` dedupes — one queued intent per opportunity per
  kind), sync on reconnect via `POST /api/offline-sync` (idempotent:
  insert-if-missing / delete-if-present / upsert; unpublished targets
  drain as server-truth; failures stay queued). Server truth wins.
  Applying/Applied never claim a submitted application.
- Staleness: every offline card/detail carries "Cached · may be
  outdated" + last-updated timestamp (Africa/Dar_es_Salaam) where
  available. Deadline/eligibility/source are never presented as
  rechecked offline. Unknown stays unknown.
- Privacy: private keys are `…:<userId>`-scoped; `OfflineAccountScope`
  sweeps foreign accounts on authenticated pages; sign-out clears all
  private keys (`clearAllPrivateOfflineCache`); public cache may remain.
  No raw Ask AI chat is persisted anywhere (transcript lives in live
  client memory only).
- Ask AI: offline composer is disabled with "Ask AI needs a connection";
  prompts are never queued; reconnect restores normal behavior.
- Service worker (`public/sw.js`): unchanged static-only policy —
  precache `/offline` + icons, cache-first `/_next/static/`, `/icons/`,
  fonts; navigations network-first with `/offline` fallback; APIs, auth,
  account/staff pages and AI are network-only passthrough, never stored
  or served stale. A permanent boundary invariant pins this.
- Network UX (`OfflineStatus`, top-anchored so it never covers the
  phone bottom nav): "Offline — showing cached information" /
  "Connection restored — updating…" / brief "Updated", then quiet.
- Game (`OpportunityRun`, inside `/offline`, secondary): collect cards,
  avoid expired-deadline obstacles; keyboard (←/→, A/D, Space) + touch
  buttons; pause/restart; reduced-motion aware; zero network calls, zero
  analytics, zero dependencies.

## Non-goals

No unlimited history, no background sync of private rows, no SW caching
of APIs/auth/account/staff/AI, no queued Ask prompts, no stored chat,
no "views" metric, no Production DB or AI change in this milestone.

## Files

`lib/offline-cache.ts` (pure contract) · `components/offline-seeds.tsx` ·
`components/offline-explore.tsx` · `components/offline-page-client.tsx` ·
`components/offline-queue-sync.tsx` · `components/offline-status.tsx` ·
`components/opportunity-run.tsx` · `components/sign-out-button.tsx` ·
`app/api/offline-sync/route.ts` · `app/offline/page.tsx` ·
`tests/offline-cache.test.ts` (`npm run test:offline`, 55 checks).

## Verification

`git diff --check` clean · `npm run verify` green · `npm run build`
green (32 pages incl. `/offline` + `/api/offline-sync`) ·
`npm audit --omit=dev` 0 vulnerabilities · mobile 360–430px static-safe
(no horizontal overflow, banner top-anchored, cards readable, game fits,
touch targets ≥44px, dark/light via tokens). Signed-in browser and
deployed-access proofs remain owner-side.
