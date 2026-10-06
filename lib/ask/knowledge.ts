/**
 * Curated public knowledge for Ask Tech Opportunity (V1).
 *
 * User-safe facts ONLY: product behavior, trust methodology, and policy
 * summaries with links to the authoritative pages. No incident docs, no
 * secrets, no handoffs, no moderator notes, no private data. Providers
 * may rephrase these entries but can never add facts beyond them plus
 * grounded opportunity rows (see contract.ts).
 */

export interface AskFaqEntry {
  id: string;
  title: string;
  keywords: string[];
  body: string;
  routes: string[];
}

export const ASK_FAQ: readonly AskFaqEntry[] = [
  {
    id: "verification",
    title: "How does Tech Opportunity verify opportunities?",
    keywords: ["verify", "verification", "verified", "review", "checked", "vetting", "trust"],
    body: "Every listing is reviewed by a person before anything goes public. Review checks the authoritative source, deadline evidence, and eligibility evidence. Listings that pass the full evidence checks carry an Evidence verified label.",
    routes: ["/", "/organizations"],
  },
  {
    id: "evidence-verified",
    title: "What does Evidence verified mean?",
    keywords: ["evidence verified", "badge", "label", "verified mean"],
    body: "Evidence verified marks only records that meet the full evidence checks: source, relevance, eligibility, and human review. It is not an endorsement and not a promise of selection — always confirm final requirements at the official source.",
    routes: ["/"],
  },
  {
    id: "tanzanian-access",
    title: "What does Tanzanian access evidenced mean?",
    keywords: ["tanzanian access", "tanzania", "eligible", "eligibility", "access evidenced", "who can apply"],
    body: "It means the stored evidence confirms Tanzanian applicants can apply. Where access is unknown, the listing says eligibility is not confirmed instead — a location is never treated as proof of eligibility, and AI never decides it.",
    routes: ["/"],
  },
  {
    id: "funnel-states",
    title: "What is the difference between Saved, Interested, Applying, and Applied?",
    keywords: ["saved", "interested", "applying", "applied", "activity", "track", "tracking", "bookmark", "funnel", "states", "difference"],
    body: "Saved is your private bookmark list. Interested, Applying, and Applied record your own application progress on your Activity page. Marking a state never submits anything — applications happen only at the official source.",
    routes: ["/saved", "/activity"],
  },
  {
    id: "ai-match",
    title: "How does AI Match work?",
    keywords: ["ai match", "match", "matching", "recommend", "recommendation", "for you", "profile", "personaliz"],
    body: "AI Match orders the same published list as Explore using your optional profile, with a reason on each suggestion. Only listings with verified Tanzanian access appear as eligible matches; anything with unknown eligibility stays separate. AI explains the fit — it never decides eligibility and never shows percentages or chances.",
    routes: ["/for-you", "/profile"],
  },
  {
    id: "privacy",
    title: "What data does Tech Opportunity keep about me?",
    keywords: ["privacy", "data", "personal", "collect", "store", "gdpr", "private"],
    body: "Your email, optional profile fields, saved items, application states, and reminder preferences — visible only to you, never sold, never shared with providers except as aggregate counts. The full detail is on the Privacy Policy page.",
    routes: ["/privacy", "/profile"],
  },
  {
    id: "terms",
    title: "What are the basic rules of using Tech Opportunity?",
    keywords: ["terms", "rules", "allowed", "guarantee", "selection", "promise"],
    body: "Use genuine opportunity discovery and tracking, submit only legitimate open calls, and always verify final requirements at the official source. Tech Opportunity does not guarantee admission, employment, funding, or selection. Details are in the Terms of Use.",
    routes: ["/terms"],
  },
  {
    id: "account-deletion",
    title: "How do I delete my account?",
    keywords: ["delete", "deletion", "remove account", "close account", "erase"],
    body: "Open your Profile page, find Delete account, and type DELETE to confirm. This permanently removes your profile, saved items, activity, and reminder preferences. Reports you sent stay for moderation with your identity removed.",
    routes: ["/profile", "/privacy"],
  },
  {
    id: "reporting",
    title: "How do I report incorrect information?",
    keywords: ["report", "incorrect", "wrong", "broken", "fraud", "scam", "suspicious", "mistake", "correction", "deadline passed"],
    body: "Signed-in users can report a problem directly from any opportunity page — reports go to human review and never change a listing automatically. Anyone can also message us on WhatsApp from the Contact page.",
    routes: ["/contact"],
  },
  {
    id: "providers",
    title: "How do providers and universities work with Tech Opportunity?",
    keywords: ["provider", "organization", "university", "hub", "ngo", "government", "campaign", "partner", "advertise", "promote"],
    body: "Providers submit legitimate open calls for human review through a staff-managed pilot. Paid promotion can never bypass verification, and reports share only aggregate counts — never private talent data. Self-service provider accounts do not exist yet.",
    routes: ["/organizations", "/contact"],
  },
  {
    id: "tracking",
    title: "How do I track an application?",
    keywords: ["track application", "how do i apply", "apply", "application", "next step", "submit"],
    body: "Open the opportunity, confirm the requirements at the official source, and submit there. Mark it Interested, Applying, or Applied on this platform to track your own progress — the platform never submits on your behalf.",
    routes: ["/activity", "/"],
  },
  {
    id: "using-platform",
    title: "How do I use Tech Opportunity?",
    keywords: ["how do i use", "how does it work", "getting started", "start", "help", "guide", "what is tech opportunity"],
    body: "Explore the published shelf, open anything interesting to check its source, deadline, and access evidence, save what fits, and track progress through Interested, Applying, and Applied. Add an optional profile to get ordered AI Match suggestions.",
    routes: ["/", "/for-you", "/activity"],
  },
];

/** Public routes an answer may cite. Nothing else is a valid source. */
export const ASK_SOURCE_ROUTES: readonly string[] = [
  "/",
  "/for-you",
  "/ai-match",
  "/activity",
  "/saved",
  "/profile",
  "/organizations",
  "/privacy",
  "/terms",
  "/contact",
  "/ask",
];

const INJECTION_MARKERS = [
  "ignore your rules",
  "ignore previous",
  "system prompt",
  "moderator notes",
  "user emails",
  "another user's",
  "another users",
  "saved opportunities of",
  "database secret",
  "api key",
  "show me the prompt",
  "disregard your instructions",
  "jailbreak",
  "do anything now",
];

const OUT_OF_SCOPE_MARKERS = [
  "homework",
  "physics",
  "math problem",
  "president of",
  "tell me a joke",
  "write me",
  "weather",
  "football score",
  "recipe",
  "translate",
];

const OPPORTUNITY_SIGNALS = [
  "opportunit",
  "internship",
  "fellowship",
  "scholarship",
  "grant",
  "hackathon",
  "competition",
  "conference",
  "deadline",
  "deadlines",
  "apply",
  "open",
  "available",
  "data science",
  "which",
  "list",
  "find",
];

function normalizedWords(value: string): string[] {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("en")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

export type AskClassification =
  | { kind: "faq"; entryId: string }
  | { kind: "opportunities" }
  | { kind: "refusal"; reason: "injection" | "out_of_scope" };

/**
 * Deterministic intent classifier. Runs BEFORE any provider call: FAQ and
 * opportunity matches may use AI phrasing, but refusals and empty results
 * never spend a provider token.
 */
export function classifyAskQuestion(question: string): AskClassification {
  const lowered = ` ${question.toLocaleLowerCase("en")} `;
  for (const marker of INJECTION_MARKERS) {
    if (lowered.includes(marker)) return { kind: "refusal", reason: "injection" };
  }
  let best: { id: string; hits: number } | null = null;
  for (const entry of ASK_FAQ) {
    let hits = 0;
    for (const keyword of entry.keywords) {
      if (lowered.includes(keyword)) hits += 1;
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { id: entry.id, hits };
  }
  if (best) return { kind: "faq", entryId: best.id };
  const words = new Set(normalizedWords(question));
  for (const signal of OPPORTUNITY_SIGNALS) {
    if (signal.includes(" ")) {
      if (lowered.includes(signal)) return { kind: "opportunities" };
    } else if (words.has(signal) || [...words].some((word) => word.length >= 4 && signal.length >= 5 && (word.startsWith(signal) || signal.startsWith(word)))) {
      return { kind: "opportunities" };
    }
  }
  for (const marker of OUT_OF_SCOPE_MARKERS) {
    if (lowered.includes(marker)) return { kind: "refusal", reason: "out_of_scope" };
  }
  return { kind: "refusal", reason: "out_of_scope" };
}

export function faqEntryById(id: string): AskFaqEntry | null {
  return ASK_FAQ.find((entry) => entry.id === id) ?? null;
}
