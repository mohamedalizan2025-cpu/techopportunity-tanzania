/**
 * Focused tests for the User Profile + Personalized Opportunity foundation:
 * the deterministic matching-input contract, explainable ranking, the
 * Explore/For You boundary, progressive-profile parsing, and owner-only privacy.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Opportunity } from "../lib/types";
import {
  EMPTY_TALENT_PROFILE,
  buildMatchingInput,
  explainMatch,
  hasCoreProfile,
  normalizeTalentProfile,
  parseCareerLevel,
  parseSkillList,
  rankForYou,
  type TalentProfile,
} from "../lib/personalization";
import { ownsTalentProfile, parseProfileForm } from "../lib/profile-state";
import { mapTalentProfileRow } from "../lib/data/talent-profile";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

function makeOpportunity(partial: Partial<Opportunity>): Opportunity {
  return {
    id: partial.id ?? "00000000-0000-4000-8000-000000000000",
    slug: partial.slug ?? "example",
    title: partial.title ?? "Example opportunity",
    category: partial.category ?? "other",
    organization: partial.organization ?? null,
    description: partial.description ?? "Description text.",
    url: partial.url ?? "https://example.org",
    deadline: partial.deadline ?? null,
    location: partial.location ?? null,
    imageUrl: null,
    status: "published",
    createdAt: partial.createdAt ?? "2026-09-01T00:00:00Z",
  };
}

const baseProfile: TalentProfile = { ...EMPTY_TALENT_PROFILE };

// --- Matching-input contract: normalization + determinism ------------------

test("empty profile is not core-complete", () => {
  assert.equal(hasCoreProfile(buildMatchingInput(baseProfile)), false);
});

test("any single core signal makes the profile core-complete", () => {
  assert.equal(
    hasCoreProfile(buildMatchingInput({ ...baseProfile, careerLevel: "student" })),
    true
  );
  assert.equal(
    hasCoreProfile(buildMatchingInput({ ...baseProfile, sectors: ["ai-data"] })),
    true
  );
  assert.equal(
    hasCoreProfile(buildMatchingInput({ ...baseProfile, preferredTypes: ["grant"] })),
    true
  );
  assert.equal(
    hasCoreProfile(buildMatchingInput({ ...baseProfile, fieldDiscipline: "Physics" })),
    true
  );
});

test("optional-only signals do not make the profile core-complete", () => {
  assert.equal(
    hasCoreProfile(
      buildMatchingInput({ ...baseProfile, skills: ["python"], region: "Arusha" })
    ),
    false
  );
});

test("matching input dedupes and deterministically orders list signals", () => {
  const input = buildMatchingInput(
    normalizeTalentProfile({
      sectors: ["health", "ai-data", "health"],
      preferredTypes: ["grant", "scholarship", "grant"],
      skills: ["Python", "python", "SQL"],
    })
  );
  assert.deepEqual(input.sectors, ["ai-data", "health"]);
  assert.deepEqual(input.preferredTypes, ["grant", "scholarship"]);
  assert.deepEqual(input.skills, ["python", "sql"]);
  assert.equal(input.schemaVersion, 1);
});

test("out-of-vocabulary sectors and types are dropped", () => {
  const profile = normalizeTalentProfile({
    sectors: ["ai-data", "not-a-sector", "<script>"],
    preferredTypes: ["grant", "made-up", "jobs"],
  });
  assert.deepEqual(profile.sectors, ["ai-data"]);
  assert.deepEqual(profile.preferredTypes, ["grant", "jobs"]);
});

test("career and experience levels reject unknown values", () => {
  assert.equal(parseCareerLevel("student"), "student");
  assert.equal(parseCareerLevel("ceo"), null);
  assert.equal(normalizeTalentProfile({ experienceLevel: "guru" }).experienceLevel, null);
});

test("field discipline strips control/grammar characters and bounds length", () => {
  const profile = normalizeTalentProfile({
    fieldDiscipline: `  Compu%ter;\nScience ${"x".repeat(120)}`,
  });
  assert.ok(profile.fieldDiscipline !== null);
  assert.ok(profile.fieldDiscipline!.length <= 80);
  assert.doesNotMatch(profile.fieldDiscipline!, /[%;\n]/);
});

test("blank text fields normalize to null (unknown stays unknown)", () => {
  const profile = normalizeTalentProfile({
    fieldDiscipline: "   ",
    region: "",
    goals: "  \n ",
  });
  assert.equal(profile.fieldDiscipline, null);
  assert.equal(profile.region, null);
  assert.equal(profile.goals, null);
});

test("skills are bounded, lowercased, and de-duplicated", () => {
  const skills = parseSkillList(
    Array.from({ length: 40 }, (_, index) => `Skill${index % 5}`)
  );
  assert.ok(skills.length <= 30);
  assert.deepEqual(skills, [...new Set(skills)].sort());
  assert.ok(skills.every((skill) => skill === skill.toLowerCase()));
});

test("matching input is stable across repeated builds", () => {
  const profile = normalizeTalentProfile({
    sectors: ["finance", "ai-data"],
    preferredTypes: ["jobs", "grant"],
    skills: ["excel", "analysis"],
  });
  assert.deepEqual(buildMatchingInput(profile), buildMatchingInput(profile));
});

// --- Explainable ranking (no percentages / gimmicks) -----------------------

test("a followed opportunity type produces a plain-language reason", () => {
  const input = buildMatchingInput({ ...baseProfile, preferredTypes: ["scholarship"] });
  const reasons = explainMatch(makeOpportunity({ category: "scholarship" }), input);
  assert.deepEqual(reasons, ["A type you follow: Scholarship"]);
});

test("a matching sector produces a field reason", () => {
  const input = buildMatchingInput({ ...baseProfile, sectors: ["ai-data"] });
  const reasons = explainMatch(
    makeOpportunity({ title: "Data Science and AI Fellowship", category: "fellowship" }),
    input
  );
  assert.ok(reasons.includes("In your field: AI / Data"));
});

test("a matching region produces a location reason", () => {
  const input = buildMatchingInput({ ...baseProfile, region: "Arusha" });
  const reasons = explainMatch(
    makeOpportunity({ location: { venueName: null, address: null, city: null, region: "arusha", country: "Tanzania", latitude: null, longitude: null } }),
    input
  );
  assert.ok(reasons.includes("In your region: Arusha"));
});

test("a matching discipline produces a reason", () => {
  const input = buildMatchingInput({ ...baseProfile, fieldDiscipline: "public health" });
  const reasons = explainMatch(
    makeOpportunity({ title: "Public Health Research Call", description: "Open call." }),
    input
  );
  assert.ok(reasons.includes("Matches your discipline: public health"));
});

test("skill reasons are capped at two and multi-word skills match", () => {
  const input = buildMatchingInput({
    ...baseProfile,
    skills: ["python", "data analysis", "machine learning"],
  });
  const reasons = explainMatch(
    makeOpportunity({
      title: "Python and data analysis and machine learning bootcamp",
      description: "Training.",
    }),
    input
  );
  const skillReasons = reasons.filter((reason) => reason.startsWith("Uses your skill:"));
  assert.equal(skillReasons.length, 2);
  assert.ok(skillReasons.includes("Uses your skill: data analysis"));
});

test("no signal produces no reason and the row is excluded from For You", () => {
  const input = buildMatchingInput({ ...baseProfile, sectors: ["mining"] });
  const ranked = rankForYou(
    [makeOpportunity({ title: "Health workshop", category: "workshop" })],
    input
  );
  assert.deepEqual(ranked, []);
});

test("recommendations never expose a percentage or numeric score", () => {
  const input = buildMatchingInput({
    ...baseProfile,
    preferredTypes: ["scholarship"],
    sectors: ["ai-data"],
    skills: ["python"],
  });
  const ranked = rankForYou(
    [
      makeOpportunity({
        title: "AI Python Scholarship",
        category: "scholarship",
        deadline: "2026-12-01T00:00:00Z",
      }),
    ],
    input
  );
  const reasons = ranked.flatMap((entry) => entry.reasons).join(" ");
  assert.ok(reasons.length > 0);
  assert.doesNotMatch(reasons, /%/);
  assert.doesNotMatch(reasons, /\bmatch score\b|\b\d+\s*\/\s*\d+\b/i);
});

test("more matched signals rank first", () => {
  const input = buildMatchingInput({
    ...baseProfile,
    preferredTypes: ["scholarship"],
    sectors: ["ai-data"],
  });
  const strong = makeOpportunity({
    id: "00000000-0000-4000-8000-00000000000a",
    title: "AI Data Science Scholarship",
    category: "scholarship",
    deadline: "2026-12-01T00:00:00Z",
  });
  const weak = makeOpportunity({
    id: "00000000-0000-4000-8000-00000000000b",
    title: "General Scholarship",
    category: "scholarship",
    deadline: "2026-10-01T00:00:00Z",
  });
  const ranked = rankForYou([weak, strong], input);
  assert.equal(ranked[0].opportunity.id, strong.id);
  assert.ok(ranked[0].reasons.length > ranked[1].reasons.length);
});

test("equal signals order by soonest known deadline, unknown last", () => {
  const input = buildMatchingInput({ ...baseProfile, preferredTypes: ["scholarship"] });
  const later = makeOpportunity({ id: "00000000-0000-4000-8000-00000000000c", title: "Scholarship C", category: "scholarship", deadline: "2026-12-01T00:00:00Z" });
  const sooner = makeOpportunity({ id: "00000000-0000-4000-8000-00000000000d", title: "Scholarship D", category: "scholarship", deadline: "2026-10-01T00:00:00Z" });
  const unknown = makeOpportunity({ id: "00000000-0000-4000-8000-00000000000e", title: "Scholarship E", category: "scholarship", deadline: null });
  const ranked = rankForYou([later, unknown, sooner], input);
  assert.deepEqual(
    ranked.map((entry) => entry.opportunity.id),
    [sooner.id, later.id, unknown.id]
  );
});

test("ranking is deterministic for identical input", () => {
  const input = buildMatchingInput({ ...baseProfile, preferredTypes: ["grant"] });
  const corpus = [
    makeOpportunity({ id: "00000000-0000-4000-8000-000000000001", title: "Grant B", category: "grant" }),
    makeOpportunity({ id: "00000000-0000-4000-8000-000000000002", title: "Grant A", category: "grant" }),
  ];
  const first = rankForYou(corpus, input).map((entry) => entry.opportunity.id);
  const second = rankForYou(corpus, input).map((entry) => entry.opportunity.id);
  assert.deepEqual(first, second);
  assert.deepEqual(first, ["00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000001"]);
});

// --- Progressive-profile form parsing --------------------------------------

test("profile form parses multi-select controls and comma-separated skills", () => {
  const data = new FormData();
  data.set("careerLevel", "student");
  data.set("fieldDiscipline", "Computer Science");
  data.append("sectors", "ai-data");
  data.append("sectors", "health");
  data.append("preferredTypes", "scholarship");
  data.set("skills", "Python, Data Analysis");
  data.set("region", "Arusha");
  const profile = parseProfileForm(data);
  assert.equal(profile.careerLevel, "student");
  assert.deepEqual(profile.sectors, ["ai-data", "health"]);
  assert.deepEqual(profile.preferredTypes, ["scholarship"]);
  assert.deepEqual(profile.skills, ["data analysis", "python"]);
  assert.equal(profile.region, "Arusha");
});

test("profile form ignores a client-supplied user id", () => {
  const data = new FormData();
  data.set("user_id", "22222222-2222-4222-8222-222222222222");
  data.set("careerLevel", "student");
  const profile = parseProfileForm(data);
  assert.deepEqual(Object.keys(profile).sort(), [
    "careerLevel",
    "experienceLevel",
    "fieldDiscipline",
    "goals",
    "preferredTypes",
    "region",
    "sectors",
    "skills",
  ]);
});

test("an empty form submission yields an empty (skippable) profile", () => {
  assert.deepEqual(parseProfileForm(new FormData()), EMPTY_TALENT_PROFILE);
});

test("profile ownership comes from the authenticated id, never input", () => {
  const user = "11111111-1111-4111-8111-111111111111";
  assert.equal(ownsTalentProfile(user, user), true);
  assert.equal(ownsTalentProfile(user, "22222222-2222-4222-8222-222222222222"), false);
  assert.equal(ownsTalentProfile(null, user), false);
});

test("a database row maps through the same normalizers", () => {
  const profile = mapTalentProfileRow({
    user_id: "11111111-1111-4111-8111-111111111111",
    career_level: "researcher",
    field_discipline: "Epidemiology",
    sectors: ["health", "bogus"],
    preferred_types: ["research-call"],
    skills: ["Git", "STATA"],
    region: "Mbeya",
    experience_level: "expert",
    goals: "Lead a national health study.",
  });
  assert.deepEqual(profile.sectors, ["health"]);
  assert.deepEqual(profile.skills, ["git", "stata"]);
  assert.equal(profile.careerLevel, "researcher");
  assert.equal(profile.experienceLevel, "expert");
});

// --- Source-level boundary assertions --------------------------------------

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const migration = read("supabase/migrations/0018_talent_profile.sql");
const personalization = read("lib/personalization.ts");
const profileData = read("lib/data/talent-profile.ts");
const profileAction = read("lib/data/talent-profile-actions.ts");
const forYouData = read("lib/data/for-you.ts");
const forYouPage = read("app/for-you/page.tsx");
const profilePage = read("app/profile/page.tsx");
const profileForm = read("components/profile-form.tsx");
const home = read("app/(home)/page.tsx");

test("migration creates only the owner-scoped talent profile table", () => {
  assert.match(migration, /create table public\.talent_profiles/);
  assert.match(migration, /user_id\s+uuid primary key references auth\.users \(id\) on delete cascade/);
  assert.doesNotMatch(migration, /alter table public\.opportunities\s+add/i);
});

test("migration enables RLS and binds every policy to the owner", () => {
  assert.match(migration, /alter table public\.talent_profiles enable row level security/);
  assert.equal((migration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 4);
});

test("migration grants no staff/organization read and revokes anonymous access", () => {
  assert.doesNotMatch(migration, /is_staff\(\)/);
  assert.match(migration, /revoke all on table public\.talent_profiles from anon/);
  assert.match(migration, /grant select, insert, update on table public\.talent_profiles to authenticated/);
  assert.doesNotMatch(migration, /grant delete/i);
});

test("migration bounds the arrays to keep the matching input deterministic", () => {
  assert.match(migration, /array_length\(sectors, 1\) is null or array_length\(sectors, 1\) <= 13/);
  assert.match(migration, /array_length\(skills, 1\) is null or array_length\(skills, 1\) <= 30/);
});

test("personalization is a pure module with no data/network client", () => {
  assert.doesNotMatch(personalization, /@supabase|createClient|\bfetch\s*\(|https?:\/\//);
  assert.doesNotMatch(personalization, /SUPABASE_SERVICE_ROLE_KEY|service_role/);
});

test("personalization exposes no percentage or score gimmick", () => {
  assert.doesNotMatch(personalization, /percent|matchScore|score\s*[:=]\s*\d/i);
});

test("profile read is owner-scoped and never staff/org scoped", () => {
  assert.match(profileData, /\.eq\("user_id", user\.userId\)/);
  assert.match(profileData, /missingProfileSchema/);
  assert.doesNotMatch(profileData, /is_staff|service_role/);
});

test("profile save derives identity from claims and never trusts a client id", () => {
  assert.match(profileAction, /getAuthenticatedUser\(\)/);
  assert.match(profileAction, /user_id: user\.userId/);
  assert.doesNotMatch(profileAction, /formData\.get\(["']user_?id["']\)/i);
  assert.match(profileAction, /onConflict: "user_id"/);
});

test("For You reuses the same trusted public corpus", () => {
  assert.match(forYouData, /getPublicBrowseData\(\{\}\)/);
  assert.match(forYouData, /rankForYou\(browse\.opportunities, input\)/);
  assert.doesNotMatch(forYouData, /service_role|is_staff/);
});

test("For You gates only on availability and core profile, never fabricates", () => {
  assert.match(forYouData, /if \(!profileResult\.available\) return EMPTY_FOR_YOU/);
  assert.match(forYouData, /if \(!hasCoreProfile\(input\)\)/);
});

test("For You page protects the route and links back to Explore", () => {
  assert.match(forYouPage, /if \(!user\) redirect\("\/login\?next=%2Ffor-you"\)/);
  assert.match(forYouPage, /Explore the full list/);
  assert.match(forYouPage, /Why this fits you/);
});

test("progressive profile is skippable and never required", () => {
  assert.match(profilePage, /if \(!user\) redirect\("\/login\?next=%2Fprofile"\)/);
  assert.match(profileForm, /Skip for now — continue exploring/);
  assert.doesNotMatch(profileForm, /\brequired\b/);
});

test("Explore is never gated by profile or personalization", () => {
  assert.doesNotMatch(home, /personalization|getForYouData|getTalentProfile|hasCoreProfile/);
  assert.doesNotMatch(home, /redirect\(["']\/login/);
});

console.log(`\n${passed} talent-profile and personalization tests passed.`);
