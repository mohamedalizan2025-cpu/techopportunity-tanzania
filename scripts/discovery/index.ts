import { runDiscovery } from "./runner";

async function main() {
  try {
    const summary = await runDiscovery();
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown discovery error";
    console.error(message);
    process.exitCode = 1;
  }
}

main();
