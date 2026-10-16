/** OfflineStatus hydration + pointer-events regression (read-only, no network). */
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const status = read("components/offline-status.tsx");

// --- hydration-safe deterministic initial render -------------------------------
// Server has no navigator, so any navigator read in the useState initializer
// makes the first client render differ from the server render (React #418).
check(
  "initial state is deterministic online (no navigator read in useState initializer)",
  status.includes('useState<NetState>("online")') && !/useState\(\(\)\s*=>[^)]*navigator/.test(status)
);
check(
  "connectivity is evaluated only after client mount (inside useEffect)",
  (() => {
    const effectStart = status.indexOf("useEffect(");
    if (effectStart < 0) return false;
    // Strip comments so doc mentions of navigator.onLine do not count as code.
    const stripComments = (src: string) =>
      src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const before = stripComments(status.slice(0, effectStart));
    const after = stripComments(status.slice(effectStart));
    return after.includes("navigator.onLine") && !before.includes("navigator.onLine");
  })()
);
check(
  "mount effect seeds genuine offline as a post-hydration update",
  /Evaluate connectivity only after client mount/.test(status) &&
    /if \(typeof navigator !== "undefined" && !navigator\.onLine\)[\s\S]*?setTracked\("offline"\)/.test(status)
);
check("quiet while online (returns null, no banner to hide)", status.includes('if (state === "online") return null'));

// --- pointer-events: full-width wrapper must not intercept --------------------
check(
  "noninteractive wrapper does not intercept pointer events",
  /role="status"[\s\S]*?pointer-events-none[\s\S]*?fixed inset-x-0 top-0/.test(status) ||
    /pointer-events-none fixed inset-x-0 top-0/.test(status)
);
check(
  "inner status pill stays readable (pointer-events-auto on content)",
  /pointer-events-auto inline-flex/.test(status)
);
check("banner stays top-anchored (never covers bottom nav)", status.includes("top-0"));
check("banner keeps status role and polite live region", status.includes('role="status"') && status.includes('aria-live="polite"'));

// --- honest behavior preserved (no blind hiding) -------------------------------
check("honest offline wording preserved", /Offline — showing cached information/.test(status));
check("reconnecting flow preserved", /Connection restored — updating/.test(status) && /reconnecting/.test(status));
check("synced confirmation preserved", /Updated — fresh information where available/.test(status));
check(
  "false-offline is re-verified with HEAD evidence, never hidden blindly",
  /method: "HEAD"/.test(status) && /reverifyOffline/.test(status) && /probeReachability/.test(status)
);
check(
  "failed probe keeps honest offline state",
  /if \(reachable && stateRef === "offline"\) handleOnline\(\)/.test(status)
);
check("listens for real online/offline transitions", status.includes('"offline"') && status.includes('"online"'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
