import type { OpportunityCategory } from "./types";

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  hackathon: "Hackathon",
  competition: "Competition",
  scholarship: "Scholarship",
  conference: "Conference",
  workshop: "Workshop",
  internship: "Internship",
  fellowship: "Fellowship",
  grant: "Grant",
  "tech-event": "Tech Event",
  admissions: "Admissions & Programmes",
  other: "Other",
};

export function categoryLabel(category: OpportunityCategory): string {
  return CATEGORY_LABELS[category] ?? "Opportunity";
}
