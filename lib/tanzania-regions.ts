/**
 * Canonical Tanzania region taxonomy — the current official 31-region
 * administrative divisions: 26 mainland regions plus Zanzibar's 5.
 *
 * This taxonomy exists for FILTER/NAVIGATION consistency only. It is never
 * used to assign a location to an opportunity: stored opportunity locations
 * come exclusively from explicit evidence (structured discovery metadata,
 * organizer input, or moderator enrichment).
 *
 * Region filter matching is case-insensitive against stored values, so
 * records saved with different casing (e.g. "mjini magharibi") still match
 * their canonical option.
 */

export const TANZANIA_MAINLAND_REGIONS = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
] as const;

export const TANZANIA_ZANZIBAR_REGIONS = [
  "Mjini Magharibi",
  "Kaskazini Unguja",
  "Kusini Unguja",
  "Kaskazini Pemba",
  "Kusini Pemba",
] as const;

export const TANZANIA_REGIONS: readonly string[] = [
  ...TANZANIA_MAINLAND_REGIONS,
  ...TANZANIA_ZANZIBAR_REGIONS,
];

const LOWERCASE_SET = new Set(TANZANIA_REGIONS.map((r) => r.toLowerCase()));

/** True when a stored region value already matches the canonical taxonomy. */
export function isCanonicalTanzaniaRegion(value: string): boolean {
  return LOWERCASE_SET.has(value.trim().toLowerCase());
}

/**
 * Stored region values that do NOT match the canonical taxonomy (free-text
 * organizer/moderator input). These are appended to the filter so real data
 * is never hidden, but they are not folded into the canonical list.
 */
export function extraRegionValues(stored: readonly string[]): string[] {
  return stored.filter((v) => !isCanonicalTanzaniaRegion(v));
}
