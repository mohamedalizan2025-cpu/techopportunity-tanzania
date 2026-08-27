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
  "other",
] as const;

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export type OpportunityStatus = "pending" | "published" | "rejected" | "expired";

export interface OpportunityLocation {
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
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
  /** Discovery provenance (relational model); null unless moderator-visible context populates them. */
  sourceName?: string | null;
  discoveredAt?: string | null;
  discoveryMethod?: string | null;
  description: string;
  url: string;
  deadline: string | null;
  location: OpportunityLocation | null;
  imageUrl: string | null;
  status: OpportunityStatus;
  createdAt: string;
}
