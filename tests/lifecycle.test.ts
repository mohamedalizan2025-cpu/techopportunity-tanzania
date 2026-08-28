/**
 * Lifecycle derivation tests. Four distinct states; the governing rule is
 * "absence of evidence is not evidence": null or malformed deadlines
 * derive "unknown" — NEVER "rolling". Rolling is reserved for explicit
 * evidence that the current schema cannot yet express. Fixed "now" keeps
 * the suite deterministic.
 */
import { deriveLifecycleState, isActionableNow } from "../lib/lifecycle";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const NOW = new Date("2026-08-29T12:00:00.000Z");

// 1. missing deadline proves NOTHING → unknown, never rolling
assert("1 null deadline derives unknown", deriveLifecycleState(null, NOW) === "unknown");
assert("1b null deadline never derives rolling", deriveLifecycleState(null, NOW) !== "rolling");
assert("1c unknown stays visible (not treated as expired)", isActionableNow(null, NOW) === true);

// 2. explicit future deadline = active
assert(
  "2 explicit future deadline derives active",
  deriveLifecycleState("2026-10-01T00:00:00.000Z", NOW) === "active"
);

// 3. explicit past deadline = expired — derivation never deletes/unpublishes
assert(
  "3 explicit past deadline derives expired",
  deriveLifecycleState("2026-01-15T00:00:00.000Z", NOW) === "expired"
);
assert("3b expired is not actionable-now", isActionableNow("2026-01-15T00:00:00.000Z", NOW) === false);

// 4. boundary: exactly-now deadline is expired (the closing instant passed)
assert(
  "4 deadline exactly at now derives expired",
  deriveLifecycleState("2026-08-29T12:00:00.000Z", NOW) === "expired"
);

// 5. malformed deadline proves NOTHING → unknown, never a guessed state
assert(
  "5 malformed deadline derives unknown, never guessed",
  deriveLifecycleState("not-a-date", NOW) === "unknown"
);
assert(
  "5b empty-string deadline derives unknown",
  deriveLifecycleState("", NOW) === "unknown"
);

// 6. rolling is unreachable from deadline evidence alone: no input to this
//    function may ever produce it — it requires explicit future schema
//    evidence, guarding against fabricated lifecycle claims
const probe: Array<string | null> = [null, "", "not-a-date", "2026-10-01T00:00:00.000Z", "2026-01-15T00:00:00.000Z"];
assert(
  "6 rolling is never derived from deadline evidence alone",
  probe.every((d) => deriveLifecycleState(d, NOW) !== "rolling")
);

// 7. derivation is a pure function of (deadline, now): same inputs, same
//    output — no hidden clock access beyond the injected instant
assert(
  "7 derivation is deterministic for a fixed now",
  deriveLifecycleState("2026-10-01T00:00:00.000Z", NOW) ===
    deriveLifecycleState("2026-10-01T00:00:00.000Z", NOW)
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
