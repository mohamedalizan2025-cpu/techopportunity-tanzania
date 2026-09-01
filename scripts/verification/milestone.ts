import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { classifyChanges } from "./contract";

const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";

function git(args: string[]): string {
  return execFileSync("git", ["-c", `core.excludesFile=${nullDevice}`, ...args], { encoding: "utf8" }).trim();
}

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function usableBase(value: string | undefined): value is string {
  if (!value || /^0+$/.test(value)) return false;
  try {
    git(["rev-parse", "--verify", `${value}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function argument(name: string): string | undefined {
  const position = process.argv.indexOf(name);
  return position >= 0 ? process.argv[position + 1] : undefined;
}

function determineChanges(): { base: string; files: string[] } {
  const requestedBase = argument("--base") ?? process.env.VERIFY_BASE_SHA;
  const workingTree = [
    ...lines(git(["diff", "--name-only", "HEAD"])),
    ...lines(git(["ls-files", "--others", "--exclude-standard"])),
  ];

  let base = "HEAD";
  let committed: string[] = [];
  if (usableBase(requestedBase)) {
    base = requestedBase;
    committed = lines(git(["diff", "--name-only", `${requestedBase}...HEAD`]));
  } else if (workingTree.length > 0) {
    // During implementation, HEAD itself is the milestone base; mixing in
    // HEAD^ would incorrectly attribute the previous milestone's files.
    base = git(["rev-parse", "HEAD"]);
  } else {
    try {
      base = git(["rev-parse", "HEAD^"]);
      committed = lines(git(["diff", "--name-only", `${base}...HEAD`]));
    } catch {
      base = "repository root";
      committed = lines(git(["ls-files"]));
    }
  }

  return { base, files: [...new Set([...committed, ...workingTree])] };
}

const { base, files } = determineChanges();
const head = git(["rev-parse", "HEAD"]);
const afterGates = process.argv.includes("--after-gates");
const plan = classifyChanges(files);

const selected = plan.changeTriggeredGates.filter((gate) => gate.selected);
const skipped = plan.changeTriggeredGates.filter((gate) => !gate.selected);
const report = {
  generatedAt: new Date().toISOString(),
  head,
  base,
  everyMilestoneGates: plan.alwaysGates.map((gate) => ({
    ...gate,
    status: afterGates ? "passed" : "planned",
  })),
  changedFiles: plan.changedFiles,
  classifications: plan.classifications,
  selectedChangeGates: selected,
  skippedChangeGates: skipped,
  productionEvidence: plan.productionEvidence,
  ownerActions: plan.ownerActions,
};

const summary = [
  "# Milestone verification report",
  "",
  `- HEAD: \`${head}\``,
  `- Comparison base: \`${base}\``,
  `- Changed files: ${plan.changedFiles.length}`,
  `- Every-milestone gates: ${afterGates ? "passed" : "planned"}`,
  `- Change-triggered gates: ${selected.length} selected; ${skipped.length} skipped with explicit reasons`,
  `- Production evidence: ${plan.productionEvidence.required ? "required" : "not required"}`,
  `- Owner actions: ${plan.ownerActions.length === 0 ? "none" : plan.ownerActions.join(" ")}`,
  "",
  "## Selected change-triggered gates",
  ...(selected.length === 0 ? ["- None."] : selected.map((gate) => `- ${gate.id}: ${gate.reason}`)),
  "",
  "## Skipped change-triggered gates",
  ...skipped.map((gate) => `- ${gate.id}: ${gate.skippedReason}`),
  "",
  "## Production evidence decision",
  ...(plan.productionEvidence.reasons.length === 0
    ? ["- Not required: no production-sensitive path changed."]
    : plan.productionEvidence.reasons.map((reason) => `- ${reason}`)),
].join("\n");

console.log(summary);
console.log(`VERIFICATION_REPORT_JSON=${JSON.stringify(report)}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, "utf8");
}
