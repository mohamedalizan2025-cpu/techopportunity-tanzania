import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRejection,
  runOpportunityIntelligenceEvaluation,
} from "../scripts/opportunity-intelligence/evaluate";

function catalogInput() {
  return {
    evidenceCatalog: [
      { id: "verified.type", basis: "verified_fact" },
      { id: "verified.eligibility", basis: "verified_fact" },
      { id: "match.0", basis: "profile_observation" },
    ],
  } as unknown as Parameters<typeof classifyRejection>[1];
}

interface FixtureItem {
  text: string;
  basis: string;
  evidenceRefs: string[];
}

interface FixturePayload {
  readiness: FixtureItem[];
  missingOrUnclear: FixtureItem[];
  nextActions: FixtureItem[];
  confidence: { level: string; limitations: string[] };
}

function validItem(): FixtureItem {
  return {
    text: "Confirm every requirement at the official source.",
    basis: "profile_observation",
    evidenceRefs: ["match.0"],
  };
}

function validPayload(): FixturePayload {
  return {
    readiness: [validItem()],
    missingOrUnclear: [{
      text: "Anything absent from the evidence remains unknown.",
      basis: "unknown",
      evidenceRefs: [],
    }],
    nextActions: [validItem()],
    confidence: { level: "medium", limitations: ["Only supplied evidence was used."] },
  };
}

test("classifier finds no failure in a valid payload (confidence stage)", () => {
  assert.equal(classifyRejection(validPayload(), catalogInput()), "confidence");
});

test("classifier reports unknown basis mixed with evidence refs", () => {
  const payload = validPayload();
  payload.missingOrUnclear = [{
    text: "Something is unclear here.",
    basis: "unknown",
    evidenceRefs: ["verified.eligibility"],
  }];
  assert.equal(classifyRejection(payload, catalogInput()), "unknown-with-refs");
});

test("classifier reports references outside the catalog", () => {
  const payload = validPayload();
  payload.readiness = [{
    text: "Something relevant here.",
    basis: "profile_observation",
    evidenceRefs: ["match.999"],
  }];
  assert.equal(classifyRejection(payload, catalogInput()), "bad-evidence-ref");
});

test("classifier reports extra top-level keys", () => {
  const payload = { ...validPayload(), whyFit: [] };
  assert.equal(classifyRejection(payload, catalogInput()), "top-keys");
});

test("classifier reports unverified citations for verified_fact basis", () => {
  const payload = validPayload();
  payload.nextActions = [{
    text: "Check the source before acting.",
    basis: "verified_fact",
    evidenceRefs: ["match.0"],
  }];
  assert.equal(classifyRejection(payload, catalogInput()), "unverified-citation");
});

test("contract simulation keeps default behavior: no pacing, no transport, null classes", async () => {
  const report = await runOpportunityIntelligenceEvaluation({});
  assert.equal(report.execution, "contract-simulation");
  assert.equal(report.transport, undefined);
  assert.ok(report.cases.every((item) => item.rejectionClass === null));
});
