/** Offline PWA tests: bounded cache, stale honesty, queue, privacy, Ask gating. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  OFFLINE_MAX_OPPORTUNITIES,
  OFFLINE_MAX_RECENT,
  boundOpportunities,
  filterCachedOpportunities,
  foreignPrivateKeys,
  isPrivateOfflineKey,
  parseMutationQueue,
  parsePublicSnapshot,
  parseRecentList,
  queueMutationOnce,
  removeQueuedMutations,
  activityKeyFor,
  queueKeyFor,
  savedKeyFor,
} from "../lib/offline-cache";
import type { Opportunity } from "../lib/types";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function fakeOpportunity(i: number): Opportunity {
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    slug: `opp-${i}`,
    title: `Opportunity ${i} fellowship`,
    category: "fellowship",
    organization: "Org",
    description: "A genuine open call with details.",
    url: "https://example.org/apply",
    deadline: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: new Date().toISOString(),
  };
}

// --- bounded cache -----------------------------------------------------------

check("public cache bound is 100", OFFLINE_MAX_OPPORTUNITIES === 100);
check("recent bound is 20", OFFLINE_MAX_RECENT === 20);
check(
  "first online load seeds a bounded set",
  boundOpportunities(Array.from({ length: 250 }, (_, i) => fakeOpportunity(i))).length === 100
);
check(
  "bounded cache preserves order (latest/relevant first)",
  boundOpportunities([fakeOpportunity(1), fakeOpportunity(2)], 1)[0]?.slug === "opp-1"
);

// --- offline Explore ---------------------------------------------------------

const corpus = [fakeOpportunity(1), { ...fakeOpportunity(2), title: "Tech internship", category: "internship" as const }];
check(
  "offline Explore filters locally by text",
  filterCachedOpportunities(corpus, { q: "internship" }).length === 1
);
check(
  "offline Explore filters by category",
  filterCachedOpportunities(corpus, { category: "fellowship" }).length === 1
);
const explore = read("components/offline-explore.tsx");
check("offline Explore shows cached-state warning", /Cached · may be outdated|may be outdated/i.test(explore));
check("offline Explore shows last updated", /last updated/i.test(explore));
check("offline Explore does local search only", !/fetch\(/.test(explore));

// --- cached detail -----------------------------------------------------------

const recentRecorder = read("components/offline-seeds.tsx");
check("recent recorder is bounded", recentRecorder.includes("OFFLINE_MAX_OPPORTUNITIES") || recentRecorder.includes("boundRecent"));
check("detail page records recent views", read("app/opportunities/[slug]/page.tsx").includes("OfflineRecentRecorder"));
const offlineClient = read("components/offline-page-client.tsx");
check("cached detail opens inline without pretending freshness", /Cached detail · may be outdated/i.test(offlineClient));
check("cached detail warns unknown stays unknown", /Unknown stays unknown/i.test(offlineClient));

// --- stale honesty ------------------------------------------------------------

const offlinePage = read("app/offline/page.tsx");
check("offline page warns facts may have changed", /may have changed/i.test(offlinePage));
check("offline page never presents cached as current", /never presented as current/i.test(offlinePage));
check("offline page is never indexed", offlinePage.includes("index: false"));
check("offline page embeds the useful client", offlinePage.includes("OfflinePageClient"));

// --- mutation queue -----------------------------------------------------------

const q1 = queueMutationOnce([], { type: "save", opportunityId: fakeOpportunity(1).id });
const q2 = queueMutationOnce(q1, { type: "save", opportunityId: fakeOpportunity(1).id });
check("offline mutation queues once (save dedup)", q2.length === 1);
const q3 = queueMutationOnce(q2, { type: "unsave", opportunityId: fakeOpportunity(1).id });
check("save then unsave collapses to latest", q3.length === 1 && q3[0]?.type === "unsave");
const q4 = queueMutationOnce([], { type: "interested", opportunityId: fakeOpportunity(3).id });
const q5 = queueMutationOnce(q4, { type: "applied", opportunityId: fakeOpportunity(3).id });
check("activity collapses to latest funnel intent", q5.length === 1 && q5[0]?.type === "applied");
check(
  "reconnect removes only server-confirmed ids",
  removeQueuedMutations(
    [...q3, ...q5],
    [q3[0]?.id ?? ""]
  ).length === 1
);
check("queue parser rejects malformed rows", parseMutationQueue('[{"nope":1}]').length === 0);
check("snapshot parser rejects malformed cache", parsePublicSnapshot("not json") === null);
check("recent parser tolerates missing storage", parseRecentList(null).length === 0);

const syncRoute = read("app/api/offline-sync/route.ts");
check("sync route requires auth", syncRoute.includes("401"));
check("sync is idempotent on duplicate saves", syncRoute.includes('23505'));
check("sync drains unpublished targets (server truth wins)", /nothing saveable|nothing to track|Server truth/i.test(syncRoute));
check(
  "sync never touches Ask chat",
  !syncRoute.includes("AskAnswer") && !syncRoute.includes("/api/ask")
);
const queueSync = read("components/offline-queue-sync.tsx");
check("queue sync shows sync state", /Syncing queued|waiting to sync|Queued changes synced/i.test(queueSync));
check("queue sync replays on reconnect", queueSync.includes('"online"'));

// --- account privacy ----------------------------------------------------------

check("private keys are account-scoped", savedKeyFor("u1") !== savedKeyFor("u2"));
check("activity and queue keys are account-scoped", activityKeyFor("u1") !== activityKeyFor("u2") && queueKeyFor("u1") !== queueKeyFor("u2"));
check("private key detector covers saved/activity/queue", isPrivateOfflineKey(savedKeyFor("x")) && isPrivateOfflineKey(activityKeyFor("x")) && isPrivateOfflineKey(queueKeyFor("x")));
check("public cache key is not private", !isPrivateOfflineKey("techopportunity:offline:opportunities:v1"));
check(
  "account switch sweeps foreign private keys only",
  (() => {
    const mine = savedKeyFor("me");
    const foreign = foreignPrivateKeys([mine, savedKeyFor("other"), "techopportunity:offline:opportunities:v1"], "me");
    return foreign.length === 1 && foreign[0] === savedKeyFor("other");
  })()
);
const signOut = read("components/sign-out-button.tsx");
check("logout clears private offline cache", signOut.includes("clearAllPrivateOfflineCache"));
check("saved page scopes to current account", read("app/saved/page.tsx").includes("OfflineAccountScope"));
check("activity page scopes to current account", read("app/activity/page.tsx").includes("OfflineAccountScope"));

// --- Ask AI offline ------------------------------------------------------------

const askForm = read("components/ask-form.tsx");
check("Ask composer states AI needs connection", /needs a connection/i.test(askForm));
check("Ask does not queue prompts offline", /aren’t queued|not.*queued/i.test(askForm));
check("Ask persists no raw chat", !/localStorage|sessionStorage|indexedDB/i.test(askForm));

// --- service worker -------------------------------------------------------------

const worker = read("public/sw.js");
check("worker still precaches the offline shell", worker.includes('"/offline"'));
check("worker never caches APIs", !/\/api\//.test(worker));
check(
  "worker never caches account/staff/AI paths",
  !/\/(saved|activity|profile|moderation|campaigns|for-you)["'\s]/.test(worker)
);
check("worker never stores secrets", !/supabase|service_role|NEXT_PUBLIC/i.test(worker));

// --- offline page + game without network -----------------------------------------

const game = read("components/opportunity-run.tsx");
check("game has keyboard controls", /ArrowLeft|ArrowRight/i.test(game));
check("game has touch controls", /Move left|Move right/i.test(game));
check("game has pause/restart", /Pause|Resume|Restart run/i.test(game));
check("game makes no network calls", !/fetch\(|XMLHttpRequest|navigator\.sendBeacon/i.test(game));
check("game has no analytics calls", !/gtag\(|posthog|capture\(|track\(/.test(game));
check("offline page embeds the game secondarily", offlineClient.includes("OpportunityRun") || offlinePage.includes("OpportunityRun") || read("components/offline-page-client.tsx").includes("OpportunityRun"));

// --- global status UX ------------------------------------------------------------

const status = read("components/offline-status.tsx");
check("status shows cached-information wording offline", /showing cached information/i.test(status));
check("status shows updating wording on reconnect", /updating/i.test(status));
check("status is quiet while online", status.includes('if (state === "online") return null'));
check("status never covers the bottom nav (top-anchored)", status.includes("top-0"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
