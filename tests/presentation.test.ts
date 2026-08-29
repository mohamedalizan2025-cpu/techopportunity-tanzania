/**
 * Presentation-layer honesty tests. Two invariants govern the public UI:
 * (1) the live taxonomy decides which categories users can see — a slug
 * without a seeded row is never surfaced; (2) country is never rendered
 * while migration 0008 (country evidence) is unapplied, because every
 * stored value is the schema default, not a verified fact.
 */
import { mapLiveCategories } from "../lib/data/categories";
import {
  buildCardMetaSegments,
  formatLocationDisplay,
} from "../lib/opportunity-presentation";
import type { Opportunity } from "../lib/types";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// --- live taxonomy mapping -------------------------------------------------

// 1. seeded slugs pass through with their database label, in table order
const baseRows = [
  { slug: "hackathon", label: "Hackathon" },
  { slug: "scholarship", label: "Scholarship" },
  { slug: "tech-event", label: "Tech Event" },
];
const baseLive = mapLiveCategories(baseRows);
assert(
  "1 seeded slugs map through with db labels, preserving order",
  baseLive.map((c) => `${c.slug}:${c.label}`).join(",") ===
    "hackathon:Hackathon,scholarship:Scholarship,tech-event:Tech Event"
);

// 2. admissions/jobs appear automatically once their seed rows exist —
//    the 0004/0010 pickup path requires no frontend change
const withOwnerSeeds = mapLiveCategories([
  ...baseRows,
  { slug: "admissions", label: "Admissions & Programmes" },
  { slug: "jobs", label: "Jobs & Vacancies" },
]);
assert(
  "2 owner-seeded admissions/jobs surface automatically when present",
  withOwnerSeeds.some((c) => c.slug === "admissions") &&
    withOwnerSeeds.some((c) => c.slug === "jobs")
);

// 3. a slug with no seed row is never surfaced (no absent claim)
assert(
  "3 unseeded slugs are never surfaced",
  baseLive.every((c) => c.slug !== "admissions" && c.slug !== "jobs")
);

// 4. slugs outside the application taxonomy are dropped defensively
const withUnknown = mapLiveCategories([
  ...baseRows,
  { slug: "not-a-real-category", label: "Mystery" },
]);
assert(
  "4 unknown slugs outside the taxonomy are dropped",
  withUnknown.length === baseRows.length &&
    withUnknown.every((c) => (c.slug as string) !== "not-a-real-category")
);

// 5. blank database labels fall back to the human-friendly application label
const withBlankLabel = mapLiveCategories([{ slug: "fellowship", label: "   " }]);
assert(
  "5 blank db label falls back to application label",
  withBlankLabel.length === 1 && withBlankLabel[0].label === "Fellowship"
);

// --- card meta honesty -----------------------------------------------------

function makeOpportunity(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: "id-1",
    slug: "slug-1",
    title: "Example opportunity",
    category: "scholarship",
    organization: null,
    description: "Example description.",
    url: "https://example.com/scholarship",
    deadline: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// 6. organizer and recorded place appear when verified
const fullCard = buildCardMetaSegments(
  makeOpportunity({
    organization: "Example Foundation",
    location: {
      venueName: null,
      address: null,
      city: "Dar es Salaam",
      region: "Dar es Salaam",
      country: "Tanzania",
      latitude: null,
      longitude: null,
    },
  })
);
assert(
  "6 organizer and place segments shown when present",
  fullCard[0] === "Example Foundation" && fullCard[1] === "Dar es Salaam, Dar es Salaam",
  JSON.stringify(fullCard)
);

// 7. country is NEVER a card segment, even when the row carries the
//    schema-default value — defaults must not read as verified facts
assert(
  "7 country is never rendered on cards (0008 gate)",
  fullCard.every((segment) => !segment.includes("Tanzania"))
);

// 8. unknown fields are simply absent — neutral, no placeholder noise
const bareCard = buildCardMetaSegments(makeOpportunity({}));
assert("8 unknown organizer/location yield no card segments", bareCard.length === 0);

// 9. whitespace-only fields are treated as unknown
const blankCard = buildCardMetaSegments(
  makeOpportunity({
    organization: "   ",
    location: {
      venueName: null,
      address: null,
      city: "  ",
      region: null,
      country: "Tanzania",
      latitude: null,
      longitude: null,
    },
  })
);
assert("9 whitespace-only organizer/city yield no segments", blankCard.length === 0);

// --- detail location lines ---------------------------------------------------

// 10. venue/address then city + region; country excluded even when present
const detailLines = formatLocationDisplay({
  venueName: "Innovation Hub",
  address: "12 Example Street",
  city: "Arusha",
  region: "Arusha",
  country: "Tanzania",
  latitude: null,
  longitude: null,
});
assert(
  "10 detail lines keep venue/address/place, exclude country",
  detailLines.length === 3 &&
    detailLines[0] === "Innovation Hub" &&
    detailLines[1] === "12 Example Street" &&
    detailLines[2] === "Arusha, Arusha",
  JSON.stringify(detailLines)
);

// 11. a location object holding only the country default degrades to the
//     neutral unknown state — never a bare implied-Tanzania line
const countryOnly = formatLocationDisplay({
  venueName: null,
  address: null,
  city: null,
  region: null,
  country: "Tanzania",
  latitude: null,
  longitude: null,
});
assert(
  "11 country-only location shows neutral 'not specified' state",
  countryOnly.length === 1 && countryOnly[0] === "Location not specified",
  JSON.stringify(countryOnly)
);

// 12. blank-only location also degrades to the neutral state
const blankLocation = formatLocationDisplay({
  venueName: " ",
  address: "",
  city: null,
  region: "  ",
  country: null,
  latitude: null,
  longitude: null,
});
assert(
  "12 blank-only location shows neutral 'not specified' state",
  blankLocation.length === 1 && blankLocation[0] === "Location not specified"
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
