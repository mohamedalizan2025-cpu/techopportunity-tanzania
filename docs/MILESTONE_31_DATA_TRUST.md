# Milestone 31 — Data trust architecture

M31 is a forward-only trust repair. M30 remains closed. Migrations 0005–0009
remain historical designs and must not be replayed blindly against a production
database that already contains the M30/0012 schema.

## Authority boundary

The authoritative flow remains:

`source -> controlled fetch -> extraction -> normalization -> deterministic
qualification -> evidence preservation -> dedupe -> pending -> staff decision
-> published`

No AI component participates in acquisition, qualification, publication,
eligibility verification, deadline truth, or canonical identity.

## Source-quality disposition

Generic heading extraction is disabled for university, government, NGO,
company, innovation-hub, scholarship-provider, and fellowship-provider source
types. Those sources may still yield candidates through structured JSON-LD or
an advertised RSS/Atom feed. A source-specific HTML adapter may be enabled only
after representative fixtures prove an actual opportunity boundary.

This directly covers the audited NM-AIST, SUA, UDSM, UDOM, DIT, VETA, HESLB,
YUNA Tanzania, and Jane Goodall Institute sources without deactivating their
authoritative structured channels. ICT Commission and the other government or
university calls receive the same fail-closed rule. Buni Innovation Hub and
Sahara Sparks receive the innovation-hub rule. No dormant source, including
COSTECH or MUST, is activated by M31; each needs a measured feed, structured
endpoint, or source-specific fixture before activation. Roundup pages are
never retained as a single opportunity when child extraction fails.

## Forward schema activation

Migration 0013 is the only M31 schema entry point. It is additive where
possible, removes only the unsafe future `country = Tanzania` default, labels
all historical country values as unverified, and retains every existing row.

Application order:

1. Owner reviews the M31 baseline and migration 0013.
2. Owner takes a production backup/export.
3. Owner applies migration 0013 in staging and runs its verification queries.
4. Owner deploys M31 code with `M31_TRUST_SCHEMA_ENABLED=true` in staging.
5. Owner verifies moderation, public reads, anonymous RLS, discovery pending
   insertion, references, and the AI-readiness report.
6. Only after staging evidence is accepted may the same two-step activation be
   performed in production.

Code is deliberately production-compatible before activation: legacy public
reads continue to use columns known to exist, automated insertion remains
pending-only, and approval is blocked when the trust schema is not enabled.

## Evidence contract

A newly discovered row records separate relevance and eligibility decisions,
their exact evidence fragments, and the deterministic rule version. Unknown
eligibility remains unknown. A moderator may publish only after recording
explicit relevance and Tanzanian eligibility evidence.

Opportunity identity remains one canonical opportunity with multiple evidence
references. URL equality stays the strong automatic identity rule; conservative
cross-source title matching remains a duplicate signal, never a destructive
merge.

## Historical country values

Migration 0013 does not erase the 261 historical `Tanzania` strings. It marks
their verification state `unknown`, so they cannot be treated as evidence.
Moderators may later set `verified_tanzania` or `verified_other` only with a
bounded evidence statement. Future rows receive no country default.

## Corpus remediation

The M31 remediation command is read-only by default. It classifies pending rows
into `reject_noise`, `review_required`, and `potentially_qualifying` buckets.
The optional apply path can only unpublish deterministic public test
artifacts, requires an exact confirmation token, updates status only, and never
deletes a row. All other reclassification remains a human moderation action.

Legacy non-test published rows have a second, separate owner-gated path back to
`pending`. It runs only after 0013 exists, targets rows whose qualification
version and decision timestamp are still null, changes only `status`, and uses
the exact confirmation `M31-REQUEUE-LEGACY-PUBLISHED`. This makes those records
reviewable through the normal evidence-required moderator form; it never
publishes or deletes them. Test quarantine and legacy requeue cannot run in the
same invocation.

## AI readiness

AI readiness is a verification result, not a feature flag. It remains NO-GO
until every critical corpus, evidence, country, attribution, duplicate, and
security condition is genuinely satisfied. Missing data fails closed; no
threshold can be weakened to manufacture a green report.

The current production result is intentionally `NO_GO`: 0013 is not applied,
published trust/evidence is incomplete, and the public test rows have not yet
been owner-quarantined. The verifier exits non-zero until every row-level and
security criterion passes.
