import { acquisitionBlockReason, fetchPage } from "./fetch";
import { decodeHtmlEntities } from "./normalize";
import type {
  CandidateOpportunity,
  DetailEvidence,
  DetailDeadlineKind,
  SourceRecord,
} from "./types";

export const MAX_DETAIL_FETCHES_PER_SOURCE = 5;

const DETAIL_SOURCE_HOSTS: Record<string, string> = {
  OpportunityDesk: "opportunitydesk.org",
  OpportunitiesForAfricans: "opportunitiesforafricans.com",
};

export interface DetailAcquisitionMetrics {
  fetches: number;
  succeeded: number;
  failures: number;
  deadlineFound: number;
  eligibilityFound: number;
  applicationFound: number;
}

type DetailFetcher = (url: string) => Promise<string>;

function canonicalHost(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function canonicalUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

/**
 * The registry remains the channel boundary. Only the two measured source
 * families are enabled, and only their own direct RSS item pages qualify.
 */
export function supportsDetailAcquisition(
  source: Pick<SourceRecord, "name" | "base_url">,
  candidate: CandidateOpportunity
): boolean {
  const expectedHost = DETAIL_SOURCE_HOSTS[source.name];
  if (!expectedHost || candidate.discoveryMethod !== "rss") return false;
  if (candidate.referenceKind === "evidence-document") return false;
  return canonicalHost(source.base_url) === expectedHost
    && canonicalHost(candidate.url) === expectedHost;
}

function articleRegion(html: string): string {
  return html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    ?? html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
    ?? html;
}

function plainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

function boundedDescription(articleText: string): string | null {
  if (!articleText) return null;
  const cut = articleText.search(/\b(?:You may also like|Related Posts|Previous post|next post)\b/i);
  return articleText.slice(0, cut >= 0 ? cut : 8_000).trim().slice(0, 8_000) || null;
}

function sectionEvidence(text: string): string | null {
  const heading = /\b(?:Eligibility|Who can apply|Requirements)\b/i.exec(text);
  if (!heading || heading.index === undefined) return null;
  const section = text.slice(heading.index, heading.index + 1_600);
  const next = section.slice(heading[0].length).search(
    /\b(?:Benefits|Application(?: Process)?|How to Apply|Selection(?: Process)?|Timeline|For More Information|Funding|Duration)\b/i
  );
  const end = next >= 0 ? heading[0].length + next : section.length;
  return section.slice(0, end).trim().slice(0, 1_400) || null;
}

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

function deadlineEvidence(text: string): {
  deadline: string | null;
  deadlineKind: DetailDeadlineKind;
  evidence: string | null;
} {
  const label = new RegExp(
    `\\b((?:Application|Registration)\\s+Deadline|Deadline)\\s*:\\s*` +
      `(Rolling(?:\\s+Basis)?|No\\s+fixed\\s+deadline|` +
      `${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,)?\\s+20\\d{2}(?:\\s+\\d{1,2}:\\d{2}(?:\\s*(?:UTC(?:[+-]\\d{1,2})?|EAT|GMT))?)?|` +
      `\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}\\.?(?:,)?\\s+20\\d{2}(?:,?\\s+\\d{1,2}:\\d{2}(?:\\s*(?:UTC(?:[+-]\\d{1,2})?|EAT|GMT))?)?)`,
    "i"
  );
  const match = label.exec(text);
  if (!match) return { deadline: null, deadlineKind: "unknown", evidence: null };
  const evidence = `${match[1]}: ${match[2]}`.replace(/\s+/g, " ").trim();
  if (/^(?:Rolling|No fixed deadline)/i.test(match[2])) {
    return { deadline: null, deadlineKind: "rolling", evidence };
  }
  const parsed = parseCalendarDate(match[2]);
  return {
    deadline: parsed,
    deadlineKind: parsed ? "date" : "unknown",
    evidence,
  };
}

function parseCalendarDate(value: string): string | null {
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const cleaned = value.replace(/(\d)(?:st|nd|rd|th)\b/gi, "$1");
  const monthFirst = new RegExp(`(${MONTH})\\.?\\s+(\\d{1,2})(?:,)?\\s+(20\\d{2})`, "i").exec(cleaned);
  const dayFirst = new RegExp(`(\\d{1,2})\\s+(${MONTH})\\.?(?:,)?\\s+(20\\d{2})`, "i").exec(cleaned);
  const day = Number(monthFirst?.[2] ?? dayFirst?.[1]);
  const monthName = monthFirst?.[1] ?? dayFirst?.[2] ?? "";
  const year = Number(monthFirst?.[3] ?? dayFirst?.[3]);
  const month = months[monthName.slice(0, 3).toLowerCase()];
  if (!Number.isInteger(day) || day < 1 || day > 31 || month === undefined || !year) return null;
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return date.toISOString();
}

function explicitApplicationUrl(articleHtml: string, baseUrl: string): string | null {
  for (const match of articleHtml.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
    const label = plainText(match[2]);
    if (!/^(?:click here to apply|apply now|apply today|register(?: now)?|application form|submit (?:an? )?application)\b/i.test(label)) continue;
    try {
      const url = new URL(match[1], baseUrl).toString();
      if (acquisitionBlockReason(url) === null) return url;
    } catch {}
  }
  return null;
}

/** Pure extraction: no URL discovered in a detail page is fetched. */
export function extractDetailEvidence(html: string, detailUrl: string): DetailEvidence {
  const articleHtml = articleRegion(html);
  const articleText = plainText(articleHtml);
  const canonicalTitle = plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || null;
  const deadline = deadlineEvidence(articleText);
  const applicationUrl = explicitApplicationUrl(articleHtml, detailUrl);
  const eligibilityEvidence = sectionEvidence(articleText);
  const action = articleText.match(
    /\b(?:Applications? (?:are |is )?(?:now )?open(?: for)?|Nominations? (?:are |is )?(?:now )?open|Call for applications?|Apply (?:now|today))\b/i
  )?.[0] ?? null;
  const location = articleText.match(/\b(?:Location|Venue)\s*:\s*([^.;]{3,120})/i)?.[1]?.trim() ?? null;

  return {
    canonicalTitle,
    opportunityUrl: detailUrl,
    evidenceUrl: detailUrl,
    description: boundedDescription(articleText),
    applicationUrl,
    deadline: deadline.deadline,
    deadlineKind: deadline.deadlineKind,
    deadlineEvidence: deadline.evidence,
    location,
    eligibilityEvidence,
    relevanceEvidence: action ?? (applicationUrl ? "explicit application link" : null),
  };
}

export function applyDetailEvidence(
  candidate: CandidateOpportunity,
  detail: DetailEvidence
): CandidateOpportunity {
  return {
    ...candidate,
    title: detail.canonicalTitle ?? candidate.title,
    description: detail.description ?? candidate.description,
    deadline:
      detail.deadlineKind === "date"
        ? detail.deadline
        : detail.deadlineKind === "rolling"
          ? null
          : candidate.deadline,
    sourceUrl: detail.evidenceUrl,
    evidenceUrl: detail.evidenceUrl,
    referenceKind: "evidence-document",
    detailEvidence: detail,
  };
}

/**
 * Per-source one-hop acquirer. Duplicate detail URLs share one cached result;
 * failures are isolated and never discard the original feed candidate.
 */
export function createBoundedDetailAcquirer(
  source: Pick<SourceRecord, "name" | "base_url">,
  fetcher: DetailFetcher = fetchPage
) {
  const cache = new Map<string, Promise<DetailEvidence | null>>();
  const metrics: DetailAcquisitionMetrics = {
    fetches: 0,
    succeeded: 0,
    failures: 0,
    deadlineFound: 0,
    eligibilityFound: 0,
    applicationFound: 0,
  };

  async function enrich(candidate: CandidateOpportunity): Promise<CandidateOpportunity> {
    if (!supportsDetailAcquisition(source, candidate)) return candidate;
    const key = canonicalUrl(candidate.url);
    let acquisition = cache.get(key);
    if (!acquisition) {
      if (metrics.fetches >= MAX_DETAIL_FETCHES_PER_SOURCE) return candidate;
      metrics.fetches += 1;
      acquisition = fetcher(candidate.url)
        .then((html) => {
          const detail = extractDetailEvidence(html, candidate.url);
          metrics.succeeded += 1;
          if (detail.deadlineEvidence) metrics.deadlineFound += 1;
          if (detail.eligibilityEvidence) metrics.eligibilityFound += 1;
          if (detail.applicationUrl) metrics.applicationFound += 1;
          return detail;
        })
        .catch((error) => {
          metrics.failures += 1;
          console.error(
            `[${source.name}] detail fetch failed ${candidate.url}: ${error instanceof Error ? error.message : error}`
          );
          return null;
        });
      cache.set(key, acquisition);
    }
    const detail = await acquisition;
    return detail ? applyDetailEvidence(candidate, detail) : candidate;
  }

  return {
    enrich,
    metrics: (): DetailAcquisitionMetrics => ({ ...metrics }),
  };
}
