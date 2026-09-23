interface SchedulerEnv {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPOSITORY: string;
  GITHUB_WORKFLOW: string;
  GITHUB_REF: string;
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function nominalSlotFromScheduledTime(scheduledTime: number): string {
  const slot = new Date(scheduledTime);
  if (
    !Number.isFinite(slot.getTime())
    || slot.getUTCMinutes() !== 17
    || slot.getUTCHours() % 2 !== 0
  ) {
    throw new Error("Cloudflare scheduled time is outside the configured two-hour :17 cadence.");
  }
  slot.setUTCSeconds(0, 0);
  return slot.toISOString();
}

export async function dispatchDiscovery(
  env: SchedulerEnv,
  scheduledTime: number,
  fetchImpl: FetchLike = fetch
): Promise<{ nominalSlot: string; status: number }> {
  const nominalSlot = nominalSlotFromScheduledTime(scheduledTime);
  const endpoint = new URL(
    `/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPOSITORY)}`
      + `/actions/workflows/${encodeURIComponent(env.GITHUB_WORKFLOW)}/dispatches`,
    "https://api.github.com"
  );
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "tech-opportunity-discovery-scheduler",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    body: JSON.stringify({
      ref: env.GITHUB_REF,
      inputs: {
        trigger_kind: "external_schedule",
        nominal_slot: nominalSlot,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`GitHub workflow dispatch failed with HTTP ${response.status}.`);
  }
  return { nominalSlot, status: response.status };
}

const scheduler = {
  async scheduled(controller: ScheduledEvent, env: SchedulerEnv): Promise<void> {
    const result = await dispatchDiscovery(env, controller.scheduledTime);
    console.log(JSON.stringify({
      event: "external_schedule_dispatched",
      cron: controller.cron,
      nominalSlot: result.nominalSlot,
      httpStatus: result.status,
    }));
  },
};

export default scheduler;
