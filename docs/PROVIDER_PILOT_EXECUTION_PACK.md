# Provider revenue pilot execution pack (companion — strategy unchanged)

Status 2026-10-05: **PREPARATION ONLY — NO PROVIDER HAS BEEN CONTACTED.**
Runs ONLY after the user pilot
([USER_PILOT_EXECUTION_PACK.md](USER_PILOT_EXECUTION_PACK.md)) passes its
success criteria. Authoritative strategy:
[PROVIDER_PILOT_BRIEF_2026-10-02.md](PROVIDER_PILOT_BRIEF_2026-10-02.md) —
this pack only makes it easy to run. No customers, revenue, pricing
acceptance, or traction is claimed — the pilot exists to discover whether
any exists.

Scope (fixed): **one provider, one legitimate opportunity, one community,
~2 weeks, first trial free**, then a pricing/renewal conversation.

Permanent privacy rules (never bend): no raw private talent data; no
names/emails/activity history shared; aggregate engagement only;
small-cell suppression reviewed before any external report; paid placement
never bypasses verification (charge is for staff work and delivery, never
for passing verification). No guaranteed applicant counts. No automated
targeted sending and no conversion attribution — counts are overlapping
Saved/Interested/Applying/Applied states, not a causal funnel.

## 1. Short outreach message (copy/paste, one provider only)

> Hello [Name/Organization]! We run Tech Opportunity, helping
> Tanzanian students and young professionals find verified openings.
> We'd like to offer a FREE 2-week trial: we verify and feature your
> current open call, share it with one student community we can reach,
> then send aggregate engagement such as Saved, Interested, Applying
> and Applied, where available — never personal data. No cost, no
> obligation. Open to a 15-minute call?

## 2. One-page managed-campaign explanation (send after YES)

> **Tech Opportunity — managed campaign trial (free, 2 weeks)**
>
> 1. **We verify.** Your opportunity goes through our human moderation
>    check (real call, open now, clear eligibility, official source). Only
>    verified calls are published — payment can never buy verification.
> 2. **We distribute.** Together we agree ONE community (e.g. a campus or
>    developer group we can genuinely reach) and the message for it.
> 3. **We report.** After ~2 weeks you get a manual aggregate report:
>    reach as actually measured, return visits, source visits where
>    obtainable without new tracking, self-reported application progress,
>    and our staff hours. Counts only — never names, emails, or per-user
>    lists.
> 4. **We price the NEXT run.** The trial is free. Afterwards we propose a
>    scoped price for a repeat run and record your renewal decision — yes
>    or no, with reason.
>
> What we never do: sell private talent data, guarantee applicant numbers,
> or let paid placement skip verification.

## 3. Provider intake questions (document actual agreement)

1. Organization + contact + role (buyer or recommender? who pays next time?)
2. The opportunity: title, official application link, exact deadline,
   eligibility — independently reviewed as an open call? (Y/N + evidence)
3. Your existing distribution baseline (what do you do today, what reach
   does it get?)
4. Agreed community for this run: ___
5. Agreed delivery brief (message/channel/dates): ___
6. Agreed count definitions (what counts as reach / save / interest /
   application start): ___
7. Named buyer willing to pay for the NEXT run: ___
8. Staff effort/cost log started? (Y/N)

All prerequisites required before the run: one reachable consenting
community; one timely independently reviewed open call; provider-approved
delivery brief; agreed count definitions; effort/cost log; named buyer for
the next run.

## 4. Campaign execution checklist

- [ ] Intake (§3) complete and filed; opportunity verified + published
      through the normal human moderation path (never fast-tracked).
- [ ] Staff campaign row created ONLY through the staff UI by a signed-in
      moderator (never via SQL/service-role); never customer-named beyond
      the agreed trial.
- [ ] Distribution executed exactly per the agreed brief; deviations logged.
- [ ] Staff hours logged throughout (total: ___).
- [ ] No private talent data exposed at any point; small-cell suppression
      reviewed before drafting the report.
- [ ] Aggregate report (§5) delivered to the provider.
- [ ] Renewal/willingness-to-pay conversation held (§6); decision recorded.

## 5. Aggregate report template (manual, aggregate only)

```text
Provider: ___  Opportunity: ___  Community: ___  Period: ___ to ___
Reach as actually measured: ___
Return visits: ___
Source visits (where obtainable without new tracking): ___
Self-reported application progress (Saved / Interested / Applying / Applied): ___ / ___ / ___ / ___
Staff hours spent: ___
Provider feedback (their words): ___
Notes / deviations from brief: ___
Scoped price proposal for a repeat run: ___
Renewal decision: YES / NO — reason: ___
```

## 6. Renewal / willingness-to-pay questions (ask after the report)

1. Was this report worth anything to you? What part was most useful?
2. Would you pay for a repeat run at [scoped price]? Why / why not?
3. What would have to be true (reach, report detail, timing) for you to say
   yes?
4. Who else should we talk to? (referral — no claim made about them)
5. May we quote your YES/NO + reason anonymously in our internal evidence?
   (Y/N)

## 7. Success / failure criteria + staff-hours log (added for the run)

First pilot is free/low-risk by design: the provider pays nothing; we
spend staff hours to learn whether paid repeats are viable. Track
every hour — verification, distribution, reporting, calls.

Staff-hours log:

| Date | Activity (verify / distribute / report / call) | Hours |
|---|---|---|
|  |  |  |
| Total |  | ___ |

SUCCESS (justifies a priced offer): report delivered on time from
honestly measured counts; zero private-data exposure; provider says a
part of the report was useful; a scoped repeat price is proposed and a
YES/NO renewal with reason is recorded — either answer counts as
learning, but only YES justifies outreach to a second provider.
FAILURE (do not repeat this shape): counts couldn't be measured
honestly; provider found nothing useful; no buyer named for a next
run; or any privacy/verification rule was bent — that routes to
process fixes, not to more pilots.
