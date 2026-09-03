export const ALWAYS_GATES = [
  { id: "tests", command: "npm test", purpose: "Run the complete regression suite." },
  { id: "typecheck", command: "npx tsc --noEmit", purpose: "Reject TypeScript contract drift." },
  { id: "lint", command: "npm run lint", purpose: "Reject static-quality regressions." },
  {
    id: "boundaries",
    command: "npm run verify:boundaries",
    purpose: "Re-assert security, moderation, discovery, and workflow invariants.",
  },
] as const;

export type ChangeGateId =
  | "build"
  | "discovery-regression"
  | "discovery-health"
  | "qualification-regression"
  | "acquisition-security"
  | "moderation-auth"
  | "assistant-kill-switch"
  | "migration-review"
  | "source-registry-review"
  | "workflow-review";

export interface ChangeGate {
  id: ChangeGateId;
  command: string | null;
  reason: string;
  selected: boolean;
  skippedReason: string | null;
}

export interface VerificationPlan {
  schemaVersion: 1;
  changedFiles: string[];
  alwaysGates: typeof ALWAYS_GATES;
  changeTriggeredGates: ChangeGate[];
  productionEvidence: {
    required: boolean;
    reasons: string[];
  };
  ownerActions: string[];
  classifications: {
    discovery: string[];
    security: string[];
    migrations: string[];
    sourceRegistry: string[];
    workflow: string[];
    build: string[];
  };
}

const normalize = (file: string) => file.replaceAll("\\", "/").replace(/^\.\//, "");
const matches = (file: string, expressions: RegExp[]) => expressions.some((expression) => expression.test(file));

const DISCOVERY = [/^scripts\/discovery\//, /^tests\/(qualification|detail-acquisition|dedupe|discovery-summary|acquisition)\.test\.ts$/];
const QUALIFICATION = [
  /^scripts\/discovery\/(qualification|normalize|validate|extract|adapters)\.ts$/,
  /^tests\/(qualification|detail-acquisition)\.test\.ts$/,
];
const ACQUISITION = [/^scripts\/discovery\/(fetch|detail)\.ts$/, /^tests\/acquisition\.test\.ts$/];
const DISCOVERY_HEALTH = [
  /^scripts\/discovery\/(health|health-artifact|index|runner|summary|types)\.ts$/,
  /^tests\/(discovery-health|discovery-summary)\.test\.ts$/,
  /^\.github\/workflows\/discovery(?:-health)?\.yml$/,
];
const MODERATION_AUTH = [
  /^app\/(auth|moderation|published-management|login|saved)(\/|$)/,
  /^components\/save-opportunity-control\.tsx$/,
  /^lib\/auth-redirect\.ts$/,
  /^lib\/saved-opportunity-state\.ts$/,
  /^lib\/data\/(moderation|moderation-actions|published-management|auth-actions|supabase-auth|saved-opportunities|saved-opportunity-actions)\.ts$/,
  /^tests\/(moderation-review|published-management|lifecycle|accounts-saved)\.test\.ts$/,
  /^proxy\.ts$/,
];
const ASSISTANT = [/^app\/api\/assistant\//, /^lib\/assistant\//, /^tests\/assistant\.test\.ts$/];
const MIGRATIONS = [/^supabase\/migrations\//];
const SOURCE_REGISTRY = [/^supabase\/seeds\/0002_pilot_sources\.sql$/, /^scripts\/discovery\/sources\.ts$/];
const WORKFLOW = [/^\.github\/workflows\//];
const BUILD = [
  /^app\//,
  /^components\//,
  /^lib\//,
  /^public\//,
  /^next\.config\./,
  /^postcss\.config\./,
  /^tsconfig\.json$/,
  /^package(-lock)?\.json$/,
];

const DISCOVERY_PRODUCTION = [
  /^scripts\/discovery\/(adapters|dedupe|detail|extract|fetch|health|health-artifact|index|normalize|qualification|runner|sources|summary|types|validate)\.ts$/,
  /^\.github\/workflows\/discovery\.yml$/,
  /^\.github\/workflows\/discovery-health\.yml$/,
  /^supabase\/seeds\/0002_pilot_sources\.sql$/,
  /^supabase\/migrations\//,
  /^package(-lock)?\.json$/,
];

function gate(
  id: ChangeGateId,
  command: string | null,
  reason: string,
  selected: boolean,
  skippedReason: string
): ChangeGate {
  return { id, command, reason, selected, skippedReason: selected ? null : skippedReason };
}

export function classifyChanges(inputFiles: string[]): VerificationPlan {
  const changedFiles = [...new Set(inputFiles.map(normalize).filter(Boolean))].sort();
  const select = (patterns: RegExp[]) => changedFiles.filter((file) => matches(file, patterns));

  const discovery = select(DISCOVERY);
  const qualification = select(QUALIFICATION);
  const acquisition = select(ACQUISITION);
  const discoveryHealth = select(DISCOVERY_HEALTH);
  const moderationAuth = select(MODERATION_AUTH);
  const assistant = select(ASSISTANT);
  const migrations = select(MIGRATIONS);
  const sourceRegistry = select(SOURCE_REGISTRY);
  const workflow = select(WORKFLOW);
  const build = select(BUILD);

  const productionReasons: string[] = [];
  const discoveryProduction = select(DISCOVERY_PRODUCTION);
  if (discoveryProduction.length > 0) {
    productionReasons.push(`Discovery production behavior changed: ${discoveryProduction.join(", ")}`);
  }
  if (moderationAuth.some((file) => !file.startsWith("tests/"))) {
    productionReasons.push("Moderation or authentication behavior changed and requires deployed access verification.");
  }

  const ownerActions: string[] = [];
  if (migrations.length > 0) {
    ownerActions.push("Review and explicitly approve any production migration before applying it.");
  }
  if (sourceRegistry.some((file) => file.startsWith("supabase/seeds/"))) {
    ownerActions.push("Review and explicitly approve any live source-registry mutation before applying it.");
  }

  return {
    schemaVersion: 1,
    changedFiles,
    alwaysGates: ALWAYS_GATES,
    changeTriggeredGates: [
      gate("build", "npm run build", "Runtime or build inputs changed.", build.length > 0, "No runtime or build input changed."),
      gate("discovery-regression", "npm test", "Discovery behavior or its tests changed.", discovery.length > 0, "No discovery path changed."),
      gate("discovery-health", "npm run test:health", "Discovery metrics, health semantics, retention, or scheduling changed.", discoveryHealth.length > 0, "No discovery-health path changed."),
      gate("qualification-regression", "npm run test:qualification", "Qualification evidence rules changed.", qualification.length > 0, "No qualification path changed."),
      gate("acquisition-security", "npm run test:acquisition", "Network acquisition boundaries changed.", acquisition.length > 0, "No acquisition path changed."),
      gate("moderation-auth", "npm run test:review && npm run test:published-management", "Moderation or auth boundaries changed.", moderationAuth.length > 0, "No moderation or auth path changed."),
      gate("assistant-kill-switch", "npm run test:assistant", "Assistant behavior or kill switch changed.", assistant.length > 0, "No assistant path changed."),
      gate("migration-review", null, "Database migration files changed.", migrations.length > 0, "No migration changed."),
      gate("source-registry-review", null, "Discovery registry behavior changed.", sourceRegistry.length > 0, "No source-registry path changed."),
      gate("workflow-review", "npm run verify:boundaries", "Automation definitions changed.", workflow.length > 0, "No workflow changed."),
    ],
    productionEvidence: {
      required: productionReasons.length > 0,
      reasons: productionReasons,
    },
    ownerActions,
    classifications: {
      discovery,
      security: [...new Set([...acquisition, ...moderationAuth, ...assistant])].sort(),
      migrations,
      sourceRegistry,
      workflow,
      build,
    },
  };
}
