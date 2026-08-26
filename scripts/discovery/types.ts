export type SourceType =
  | "university"
  | "government"
  | "ngo"
  | "company"
  | "innovation_hub"
  | "hackathon_platform"
  | "scholarship_provider"
  | "fellowship_provider"
  | "conference"
  | "other";

export interface SourceRecord {
  id: string;
  name: string;
  base_url: string;
  source_type: SourceType;
  country: string;
  region: string | null;
  active: boolean;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

export interface CandidateOpportunity {
  title: string;
  description: string;
  category: string;
  organization: string | null;
  url: string;
  deadline: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  sourceId: string;
  sourceUrl: string;
  discoveryMethod: "rss" | "json-ld" | "html" | "sitemap";
}

export interface DiscoverySummary {
  sourcesChecked: number;
  sourcesSucceeded: number;
  candidatesFound: number;
  validCandidates: number;
  insertedPending: number;
  duplicatesSkipped: number;
  errors: number;
}
