import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  dispatchDiscovery,
  nominalSlotFromScheduledTime,
} from "../ops/discovery-scheduler/cloudflare-worker";
import type { HealthHistory } from "../scripts/discovery/health";
import { resolveDiscoveryTrigger } from "../scripts/discovery/trigger-identity";

const root = process.cwd();
const config = readFileSync(join(root, "ops/discovery-scheduler/wrangler.toml"), "utf8");
const env = {
  GITHUB_TOKEN: "test-token-never-log",
  GITHUB_OWNER: "example-owner",
  GITHUB_REPOSITORY: "example-repository",
  GITHUB_WORKFLOW: "discovery.yml",
  GITHUB_REF: "main",
};

test("Cloudflare scheduled time becomes the exact two-hour UTC nominal slot", () => {
  assert.equal(
    nominalSlotFromScheduledTime(Date.parse("2026-09-23T10:17:00.000Z")),
    "2026-09-23T10:17:00.000Z"
  );
  assert.throws(
    () => nominalSlotFromScheduledTime(Date.parse("2026-09-23T11:17:00.000Z")),
    /outside the configured/
  );
});

test("scheduler dispatch uses Actions-write API with explicit external identity", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const result = await dispatchDiscovery(
    env,
    Date.parse("2026-09-23T10:17:00.000Z"),
    async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response('{"workflow_run_id":123}', { status: 200 });
    }
  );
  assert.equal(
    requestUrl,
    "https://api.github.com/repos/example-owner/example-repository/actions/workflows/discovery.yml/dispatches"
  );
  assert.equal(requestInit?.method, "POST");
  assert.equal(new Headers(requestInit?.headers).get("authorization"), "Bearer test-token-never-log");
  assert.deepEqual(JSON.parse(String(requestInit?.body)), {
    ref: "main",
    inputs: {
      trigger_kind: "external_schedule",
      nominal_slot: "2026-09-23T10:17:00.000Z",
    },
  });
  assert.deepEqual(result, { nominalSlot: "2026-09-23T10:17:00.000Z", status: 200 });
});

test("scheduler errors expose only HTTP status and never token or response body", async () => {
  await assert.rejects(
    dispatchDiscovery(
      env,
      Date.parse("2026-09-23T10:17:00.000Z"),
      async () => new Response("sensitive provider body", { status: 403 })
    ),
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      assert.equal(message, "GitHub workflow dispatch failed with HTTP 403.");
      assert.doesNotMatch(message, /test-token|sensitive provider body/);
      return true;
    }
  );
});

test("external identity requires owner enablement, exact actor, fresh slot, and no replay", () => {
  const accepted = resolveDiscoveryTrigger({
    event: "workflow_dispatch",
    requestedKind: "external_schedule",
    actor: "scheduler-bot",
    allowedExternalActor: "scheduler-bot",
    externalSchedulerEnabled: true,
    nominalSlot: "2026-09-23T10:17:00.000Z",
    evaluatedAt: "2026-09-23T10:18:00.000Z",
  });
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.triggerKind, "external_schedule");
  assert.equal(accepted.nominalSlot, "2026-09-23T10:17:00.000Z");

  assert.equal(resolveDiscoveryTrigger({
    event: "workflow_dispatch",
    requestedKind: "external_schedule",
    actor: "scheduler-bot",
    allowedExternalActor: "scheduler-bot",
    externalSchedulerEnabled: false,
    nominalSlot: "2026-09-23T10:17:00.000Z",
    evaluatedAt: "2026-09-23T10:18:00.000Z",
  }).accepted, false);
  assert.equal(resolveDiscoveryTrigger({
    event: "workflow_dispatch",
    requestedKind: "external_schedule",
    actor: "wrong-actor",
    allowedExternalActor: "scheduler-bot",
    externalSchedulerEnabled: true,
    nominalSlot: "2026-09-23T10:17:00.000Z",
    evaluatedAt: "2026-09-23T10:18:00.000Z",
  }).accepted, false);

  const retainedSlot = {
    schemaVersion: 1,
    observations: [{
      identity: {
        event: "workflow_dispatch",
        triggerKind: "external_schedule",
        nominalSlot: "2026-09-23T10:17:00.000Z",
        startedAt: "2026-09-23T10:18:00.000Z",
      },
    }],
  } as unknown as HealthHistory;
  const replay = resolveDiscoveryTrigger({
    event: "workflow_dispatch",
    requestedKind: "external_schedule",
    actor: "scheduler-bot",
    allowedExternalActor: "scheduler-bot",
    externalSchedulerEnabled: true,
    nominalSlot: "2026-09-23T10:17:00.000Z",
    evaluatedAt: "2026-09-23T10:19:00.000Z",
    history: retainedSlot,
  });
  assert.equal(replay.accepted, false);
  assert.match(replay.reason, /already retained/);
});

test("manual dispatch cannot claim external schedule evidence", () => {
  assert.deepEqual(resolveDiscoveryTrigger({
    event: "workflow_dispatch",
    requestedKind: "manual",
    nominalSlot: "2026-09-23T10:17:00.000Z",
  }), {
    accepted: false,
    triggerKind: "manual",
    nominalSlot: null,
    reason: "Manual runs cannot claim a nominal scheduled slot.",
  });
});

test("deployment manifest is private, fixed at :17 every two hours, and requires a secret", () => {
  assert.match(config, /workers_dev = false/);
  assert.match(config, /crons = \["17 \*\/2 \* \* \*"\]/);
  assert.match(config, /required = \["GITHUB_TOKEN"\]/);
  assert.doesNotMatch(config, /ghp_|github_pat_|Bearer\s+[A-Za-z0-9]/);
});
