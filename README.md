# Tech Opportunity Tanzania

Tech Opportunity helps Tanzanian students, builders, and early-career talent find
credible national and international opportunities. The product combines a
moderated public directory, accounts and saved opportunities, deadline alerts,
and a deterministic discovery pipeline that never publishes automatically.

Production: <https://techopportunity-tanzania.vercel.app>

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase PostgreSQL, Auth, Row Level Security, and Storage
- Vercel deployment
- GitHub Actions for verification, discovery, health monitoring, and alerts

## Local development

1. Install Node.js 20 or newer and run `npm install`.
2. Review `.env.example` and establish an explicitly authorized local target. In
   this established workspace `.env.local` is production-only; never treat it as
   staging or use it for staging writes. Never commit or share an environment file.
3. Run `npm run dev` and open <http://localhost:3000>.
4. Before committing an implementation change, run `npm run verify`. Use
   `npm run verify:ci` when the change requires a production-equivalent build.

Do not apply database migrations, alter cloud configuration, or perform a production
write merely to start the app. Environment identity and mutation rules are below.

## Repository map

| Path | Purpose |
|---|---|
| `app/` | Pages, route handlers, and server actions |
| `components/` | Reusable UI |
| `lib/data/` | The only application data-access boundary |
| `lib/` | Domain rules and framework-independent logic |
| `scripts/discovery/` | Controlled acquisition, qualification, dedupe, and health |
| `scripts/verification/` | Change classification and architecture/security checks |
| `supabase/migrations/` | Reviewed forward schema changes; not a license to replay history |
| `tests/` | Deterministic product and boundary tests |

## Authoritative documentation

- [Engineering rules](docs/ENGINEERING_RULES.md) — permanent security, data,
  verification, and milestone rules.
- [Product roadmap](docs/PRODUCT_ROADMAP.md) — product direction and the next
  approved planning phase.
- [Architecture](docs/architecture.md) — current system shape and invariants.
- [Current handoff](docs/NEXT_SESSION_HANDOFF.md) — the focused operational
  checkpoint for the next session.
- [Verification contract](docs/VERIFICATION_CONTRACT.md) — standard and
  change-triggered gates.
- [Database recovery](docs/DATABASE_RECOVERY.md) — protected recovery inventory,
  limitations, and restore procedure.
- [Discovery health](docs/DISCOVERY_HEALTH.md) — scheduler and pipeline-health
  evidence semantics.
- [M31 activation record](docs/M31_STAGING_RUNBOOK.md) — closed historical staging
  and production activation evidence; not an active rollout checklist.

Specialized historical design records remain in `docs/` only where they retain
unique source-research, AI-boundary, or M31 trust value. Point-in-time M16–M26
reports were removed from the working tree after consolidation; Git history remains
the source for their full audit narratives.
