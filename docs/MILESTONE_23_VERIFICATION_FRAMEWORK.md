# Milestone 23 — Permanent Verification Framework

## Evidence gap inherited from M22

M22 is commit `27b8f695070da3e878a9592789b2747c495a77b9`. At the M23 baseline,
local `HEAD` and `origin/main` both resolved to that SHA and the working tree was
clean. A GitHub Actions API query across all workflows for that exact
`head_sha` returned `total_count: 0`.

Consequently, M22 has 393/393 local regression tests plus TypeScript, ESLint,
and security-review evidence, but **no exact-SHA GitHub Actions execution and
no exact-SHA production Discovery Sync**. M22 must not be represented as having
production-run or six-hour-readiness proof.

## M23 implementation

- `scripts/verification/contract.ts` deterministically maps changed files to
  focused gates, production-evidence requirements, and owner-only actions.
- `scripts/verification/milestone.ts` obtains the comparison from Git, emits a
  readable report and versioned JSON, and writes a GitHub step summary in CI.
- `scripts/verification/boundaries.ts` statically re-asserts the acquisition,
  pending-only, moderation, assistant, credential, workflow, and read-only
  verification boundaries.
- `tests/verification-contract.test.ts` protects classification behavior.
- `npm run verify` is the reusable standard command; `npm run verify:ci` adds
  a production build.
- `Milestone verification` provides credential-free push/PR CI.
- The existing `Discovery sync` schedule remains daily and pending-only. It now
  also runs automatically on discovery-sensitive pushes to `main`, allowing
  the pushed M23 head—which contains M22—to establish the next honest
  production baseline without a repetitive manual dispatch.

No migration, registry change, source activation, schedule change, AI system,
data cleanup, or discovery-semantic change is part of M23.

## Interpretation

An exact-M23 successful production run can prove that the integrated head,
including M22 qualification, executed once. It cannot retroactively create an
exact-M22 run, cannot validate deleted/changed historical state, and cannot
prove six-hour repeatability. That latter claim requires multiple correlated
scheduled runs over time.
