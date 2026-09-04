import type { OpportunityTrust } from "./opportunity-trust";

export const OPPORTUNITY_CATEGORIES = [
  "hackathon",
  "competition",
  "scholarship",
  "conference",
  "workshop",
  "internship",
  "fellowship",
  "grant",
  "tech-event",
  "admissions",
  // Owner-gated migration 0010 seeds this row; discovery skips `jobs`
  // candidates (skip + warn, never crash) until the seed exists.
  "jobs",
  "other",
] as const;

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export type OpportunityStatus = "pending" | "published" | "rejected" | "expired";

export interface OpportunityLocation {
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  /** null = unknown; never inferred, only evidenced or moderator-set. */
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  category: OpportunityCategory;
  /** Organizer name when a real organization is attached; never inferred. */
  organization: string | null;
  /** Attached organizer id (null = unknown/none). Moderator-controlled. */
  organizationId?: string | null;
  /** Discovery provenance (relational model); null unless moderator-visible context populates them. */
  sourceName?: string | null;
  sourceUrl?: string | null;
  discoveredAt?: string | null;
  discoveryMethod?: string | null;
  description: string;
  url: string;
  deadline: string | null;
  deadlinePrecision?: "unknown" | "date" | "date_time" | "rolling" | "unspecified";
  deadlineEvidence?: string | null;
  location: OpportunityLocation | null;
  imageUrl: string | null;
  status: OpportunityStatus;
  createdAt: string;
  /** M31 evidence contract. Undefined until the forward trust schema is enabled. */
  trust?: OpportunityTrust;
}
