/**
 * Source-specific adapter tests (bounded first-party TZ batch).
 *
 * These adapters are the ONLY exception to the institutional generic-HTML
 * block, so the contract pinned here is narrow on purpose:
 *   - each adapter is keyed to an EXACT dedicated LISTING base_url, so the
 *     already-active site homepages never trigger it (owner-gated activation);
 *   - extraction is purely structural (a precise detail-page link boundary),
 *     excluding self-links, off-host and short navigation anchors;
 *   - the admission gate downstream is UNCHANGED: fixtures prove real
 *     actionable tech/research calls ADMIT while news / undergraduate
 *     admissions / stale calls are extracted but REJECTED. Weakening the
 *     parser is never the answer.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  adapterKeyFor,
  extractSourceAdapterCandidates,
  findSourceAdapter,
  SOURCE_ADAPTER_IDS,
} from "../scripts/discovery/source-adapters";
import { extractAllCandidates } from "../scripts/discovery/adapters";
import { normalizeCandidate } from "../scripts/discovery/normalize";
import { validateCandidate } from "../scripts/discovery/validate";
import { qualifyOpportunity, shouldAdmitCandidate } from "../scripts/discovery/qualification";
import type { SourceType } from "../scripts/discovery/types";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

const ID = "00000000-0000-0000-0000-0000000000ad";
const TYPE: SourceType = "university";
const NOW = new Date("2026-09-16T00:00:00Z");

function loadFixture(file: string): string {
  return readFileSync(resolve("scripts/discovery/fixtures", file), "utf8");
}

function admittedTitles(body: string, baseUrl: string): Set<string> {
  const source = { base_url: baseUrl };
  const out = new Set<string>();
  for (const raw of extractSourceAdapterCandidates(body, source)) {
    const normalized = normalizeCandidate(raw, ID);
    if (!normalized || !validateCandidate(normalized)) continue;
    const qualification = qualifyOpportunity(normalized, NOW, { sourceType: TYPE });
    if (shouldAdmitCandidate(normalized, qualification, TYPE, NOW)) out.add(normalized.title);
  }
  return out;
}

function extractedTitles(body: string, baseUrl: string): Set<string> {
  return new Set(
    extractSourceAdapterCandidates(body, { base_url: baseUrl }).map((c) => String(c.title))
  );
}

// ---- 1. exact-keyed opt-in: owner-gating guarantee -------------------------
assert("adapter registry is bounded to the two measured sources", SOURCE_ADAPTER_IDS.length === 2, SOURCE_ADAPTER_IDS.join(","));
assert("UDSM listing base_url resolves an adapter", findSourceAdapter({ base_url: "https://www.udsm.ac.tz/announcement" })?.id === "udsm-announcements");
assert("NM-AIST listing base_url resolves an adapter", findSourceAdapter({ base_url: "https://nm-aist.ac.tz/event/" })?.id === "nm-aist-events");
assert("adapterKeyFor tolerates trailing slash", adapterKeyFor("https://nm-aist.ac.tz/event/") === adapterKeyFor("https://nm-aist.ac.tz/event"));
// The already-active site HOMEPAGES must NOT trigger any adapter, so adding
// the listing rows never auto-activates extraction on rows already in prod.
assert("UDSM homepage (already active) triggers no adapter", findSourceAdapter({ base_url: "https://www.udsm.ac.tz" }) === undefined);
assert("NM-AIST homepage (already active) triggers no adapter", findSourceAdapter({ base_url: "https://nm-aist.ac.tz" }) === undefined);
assert("foreign listing path triggers no adapter", findSourceAdapter({ base_url: "https://example.org/announcement" }) === undefined);

// ---- 2. UDSM structural extraction -----------------------------------------
const udsm = loadFixture("udsm-announcements-listing.html");
const udsmExtracted = extractedTitles(udsm, "https://www.udsm.ac.tz/announcement");
assert("UDSM: seven announcement detail cards extracted", udsmExtracted.size === 7, [...udsmExtracted].join(" | "));
assert("UDSM: listing self-link excluded", ![...udsmExtracted].some((t) => t === "Announcements"));
assert("UDSM: short nav anchor excluded", ![...udsmExtracted].some((t) => t === "News"));
assert("UDSM: off-host social anchor excluded", ![...udsmExtracted].some((t) => /twitter/i.test(t)));
assert("UDSM: pagination link excluded", ![...udsmExtracted].some((t) => /pagination/i.test(t)));

// ---- 3. UDSM unchanged admission gate --------------------------------------
const udsmAdmitted = admittedTitles(udsm, "https://www.udsm.ac.tz/announcement");
assert("UDSM: AI/climate scholarship admits", udsmAdmitted.has("Apply for Scholarships in Artificial Intelligence and Climate Change"));
assert("UDSM: CS/data-engineering PhD call admits", udsmAdmitted.has("Call for Applications for PhD Sponsorship in Computer Science and Data Engineering"));
assert("UDSM: energy/digital-innovation grants call admits", udsmAdmitted.has("Call for Proposals: Renewable Energy and Digital Innovation Research Grants"));
assert("UDSM: exactly three candidates admit", udsmAdmitted.size === 3, [...udsmAdmitted].join(" | "));
assert("UDSM: news keynote extracted but rejected", udsmExtracted.has("Vice Chancellor Delivers Keynote at the 56th Graduation Ceremony for the Class of 2026") && !udsmAdmitted.has("Vice Chancellor Delivers Keynote at the 56th Graduation Ceremony for the Class of 2026"));
assert("UDSM: undergraduate admissions extracted but rejected (excludedAdmission)", udsmExtracted.has("Applications for Undergraduate Admissions 2026 Now Open") && !udsmAdmitted.has("Applications for Undergraduate Admissions 2026 Now Open"));
assert("UDSM: stale 2024 call extracted but rejected", udsmExtracted.has("Call for Applications for Masters Scholarships 2024") && !udsmAdmitted.has("Call for Applications for Masters Scholarships 2024"));
assert("UDSM: successful-applicants selection list extracted but withheld (actionability guard)", udsmExtracted.has("List of Successful Applicants for the Artificial Intelligence Research Internship 2026") && !udsmAdmitted.has("List of Successful Applicants for the Artificial Intelligence Research Internship 2026"));

// ---- 4. NM-AIST structural extraction --------------------------------------
const nmaist = loadFixture("nmaist-events-listing.html");
const nmaistExtracted = extractedTitles(nmaist, "https://nm-aist.ac.tz/event/");
assert("NM-AIST: five event cards extracted (Continue Reading deduped)", nmaistExtracted.size === 5, [...nmaistExtracted].join(" | "));
assert("NM-AIST: archive self-link excluded", ![...nmaistExtracted].some((t) => t === "Events"));
assert("NM-AIST: Continue Reading junk never becomes a title", ![...nmaistExtracted].some((t) => /continue reading/i.test(t)));
assert("NM-AIST: off-host social + home excluded", ![...nmaistExtracted].some((t) => /facebook|home/i.test(t)));

// ---- 5. NM-AIST unchanged admission gate -----------------------------------
const nmaistAdmitted = admittedTitles(nmaist, "https://nm-aist.ac.tz/event/");
assert("NM-AIST: Samia DS/AI scholarship admits", nmaistAdmitted.has("Samia Scholarship Extended: Data Science and AI Cohort 2026"));
assert("NM-AIST: Applied AI programme call admits", nmaistAdmitted.has("Call for Applications for the MSc/PhD Program in Applied Artificial Intelligence"));
assert("NM-AIST: exactly two candidates admit", nmaistAdmitted.size === 2, [...nmaistAdmitted].join(" | "));
assert("NM-AIST: stale 2025 ceremony extracted but rejected", nmaistExtracted.has("NM-AIST Graduation and Prize Giving Ceremony 2025") && !nmaistAdmitted.has("NM-AIST Graduation and Prize Giving Ceremony 2025"));
assert("NM-AIST: open-day extracted but rejected", nmaistExtracted.has("Open Day and Campus Tour for Prospective Students and Parents") && !nmaistAdmitted.has("Open Day and Campus Tour for Prospective Students and Parents"));
assert("NM-AIST: shortlisted-names notice extracted but withheld (actionability guard)", nmaistExtracted.has("Majina 50 Wanaotakiwa Kuomba ufadhili wa Samia Scholarship Extended(DS/AI+) 2026") && !nmaistAdmitted.has("Majina 50 Wanaotakiwa Kuomba ufadhili wa Samia Scholarship Extended(DS/AI+) 2026"));

// ---- 6. adapter does not weaken the generic path ---------------------------
// With institutional generic-HTML blocked (as the worker enforces), the
// listing fixtures yield NOTHING through the ordinary extractors: the narrow,
// fixture-backed adapter is the sole, deliberate acquisition path.
assert(
  "UDSM fixture yields zero via generic extractors when html is denied",
  extractAllCandidates(udsm, ID, "https://www.udsm.ac.tz/announcement", { allowGenericHtml: false }).length === 0
);
assert(
  "NM-AIST fixture yields zero via generic extractors when html is denied",
  extractAllCandidates(nmaist, ID, "https://nm-aist.ac.tz/event/", { allowGenericHtml: false }).length === 0
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
