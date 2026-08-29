import { runDiscovery } from "./runner";

async function main() {
  try {
    const summary = await runDiscovery();
    console.log(JSON.stringify(summary, null, 2));
    // Whole-run health gate: individual source failures stay isolated
    // (logged + counted, run exits 0), but when EVERY checked source
    // errored the scheduled run must NOT go green silently — that is a
    // worker-level failure (network, registry, credentials, DB), not a
    // source problem. Partial runs with at least one success keep the
    // designed isolation behavior.
    if (summary.sourcesChecked > 0 && summary.sourcesSucceeded === 0 && summary.errors > 0) {
      console.error(
        `Discovery run failed: all ${summary.sourcesChecked} sources errored (see perSource). Exiting non-zero so the workflow surfaces the outage.`
      );
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown discovery error";
    console.error(message);
    process.exitCode = 1;
  }
}

main();
