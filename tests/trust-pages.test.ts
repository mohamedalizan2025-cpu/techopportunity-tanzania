/**
 * Pre-pilot P0A: public trust shell (/privacy, /terms, /contact).
 *
 * Source-level contract checks: the three policy routes exist as public
 * pages, the footer links them, the owner-approved WhatsApp channel is
 * present exactly once per surface, and the pages make no claim the
 * product cannot honor (no incorporation, no 18+ gate, no analytics
 * banner, no fake deletion self-service, AI OFF stated honestly).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { CANONICAL_SITE_URL, publicPageMetadata, SITE_NAME } from "../lib/site";
import { join } from "node:path";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf-8");
}

const WHATSAPP_NUMBER = "+255 624 295 705";
const WHATSAPP_HREF = "https://wa.me/255624295705";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const privacy = read("app/privacy/page.tsx");
const terms = read("app/terms/page.tsx");
const contact = read("app/contact/page.tsx");
const layout = read("app/layout.tsx");
const loginForm = read("app/login/login-form.tsx");
const profileForm = read("components/profile-form.tsx");

/** JSX wraps prose across lines; compare against collapsed whitespace. */
function flat(source: string): string {
  return source.replace(/\s+/g, " ");
}

test("privacy/terms/contact are public pages with metadata", () => {
  for (const [label, source] of [["privacy", privacy], ["terms", terms], ["contact", contact]] as const) {
    assert.match(source, /export const metadata: Metadata/, `${label} metadata`);
    assert.match(source, /id="main-content"/, `${label} main landmark`);
    assert.match(source, /<h1/, `${label} heading`);
  }
  assert.match(privacy, /"Privacy Policy"/);
  assert.match(terms, /"Terms of Use"/);
  assert.match(contact, /"Contact"/);
});

test("privacy documents actual data categories and controls", () => {
  for (const fragment of [
    "Account identity",
    "Talent profile",
    "Saved opportunities",
    "Interested / Applying / Applied",
    "Essential session cookies",
    "PWA cache",
    "aggregate counts",
    "Your controls",
    "WhatsApp",
  ]) {
    assert.ok(privacy.includes(fragment), fragment);
  }
});

test("vendor disclosure names real processors with correct AI status", () => {
  for (const fragment of ["Supabase", "Vercel", "Gemini", "Groq", "Production AI", "OFF"]) {
    assert.ok(privacy.includes(fragment), fragment);
  }
  assert.ok(
    flat(privacy).includes("receive no Production user information today"),
    "no production AI traffic claimed"
  );
});

test("privacy states AI allowlist principles honestly", () => {
  const text = flat(privacy);
  assert.ok(text.includes("never decides eligibility"));
  assert.ok(text.includes("cannot guarantee selection"));
  assert.ok(text.includes("are never sent"));
});

test("privacy claims no analytics and no cookie banner", () => {
  const text = flat(privacy);
  assert.ok(text.includes("no analytics or advertising cookies"));
  assert.doesNotMatch(text, /we use cookies to (track|personalize ads|measure)/i);
});

test("privacy describes deletion honestly (self-service since P0C)", () => {
  const text = flat(privacy);
  assert.ok(text.includes("Delete your whole account yourself on the Profile page"));
  assert.ok(text.includes("identity removed"));
  assert.ok(text.includes("cannot be purged instantly"));
  assert.doesNotMatch(text, /self-service account deletion is being built/i);
  assert.doesNotMatch(text, /delete your account (anytime|instantly|in settings)/i);
});

test("terms covers sources, guarantees, providers, and change", () => {
  const text = flat(terms);
  for (const fragment of [
    "official opportunity source",
    "authoritative",
    "does not guarantee",
    "selection",
    "Acceptable use",
    "misleading",
    "paid promotion can never buy approval",
    "as-is",
    "Human review reduces risk",
  ]) {
    assert.ok(text.includes(fragment), fragment.slice(0, 32));
  }
});

test("no 18+ restriction and no invented legal certainty anywhere", () => {
  for (const [label, source] of [["privacy", privacy], ["terms", terms], ["contact", contact]] as const) {
    assert.doesNotMatch(source, /18\+|eighteen|must be at least 18|over 18/i, `${label} age gate`);
    assert.doesNotMatch(source, /governing law|arbitration|jurisdiction of|registered company|we are incorporated|registration number|office at/i, `${label} invented legal`);
  }
});

test("contact uses the owner-approved WhatsApp channel with valid link", () => {
  assert.ok(contact.includes(WHATSAPP_NUMBER), "number present");
  assert.ok(contact.includes(WHATSAPP_HREF), "wa.me link present");
  assert.match(contact, /wa\.me\/255624295705/);
  assert.ok(contact.includes('target="_blank"'), "new-tab");
  assert.ok(contact.includes('rel="noopener noreferrer"'), "rel");
  assert.ok(
    flat(contact).includes("no ticket system, no response-time promise"),
    "honest no-SLA disclaimer"
  );
  assert.doesNotMatch(contact, /dedicated support team|live chat|guaranteed response|account manager/i, "no support-team claims");
  for (const category of [
    "General support",
    "Privacy or data request",
    "Deadline correction",
    "Eligibility concern",
    "Suspicious or fraudulent listing",
    "Provider or organization enquiry",
  ]) {
    assert.ok(contact.includes(category), category);
  }
});

test("footer links the trust shell and invents nothing", () => {
  // Metadata may declare Twitter cards; the claim applies to rendered footer links.
  const footer = layout.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer, "rendered footer exists");
  for (const href of ['href="/privacy"', 'href="/terms"', 'href="/contact"', 'href="/#trust-heading"']) {
    assert.ok(footer.includes(href), href);
  }
  assert.doesNotMatch(footer, /address|registration|partner|certification|twitter|x\.com|linkedin\.com|facebook\.com|instagram\.com/i, "footer fabrications");
});

test("auth and profile link the policies without behavior change", () => {
  assert.ok(loginForm.includes('href="/terms"'), "login terms");
  assert.ok(loginForm.includes('href="/privacy"'), "login privacy");
  assert.ok(profileForm.includes('href="/privacy"'), "profile privacy");
  assert.ok(loginForm.includes("By continuing you agree"), "consent-adjacent wording");
});

test("root layout never lends homepage identity to sibling routes", () => {
  assert.doesNotMatch(layout, /alternates:|openGraph:|twitter:/);
  assert.match(layout, /template: `%s \| \$\{SITE_NAME\}`/);
  const home = read("app/(home)/page.tsx");
  assert.ok(home.includes('publicPageMetadata("/", SITE_NAME, SITE_DESCRIPTION)'));
  assert.deepEqual(publicPageMetadata("/", SITE_NAME, "Home").title, { absolute: SITE_NAME });
});

test("every indexable public static page owns its canonical and social identity", () => {
  const routes = ["organizations", "ask", "contact", "privacy", "terms", "submit"];
  const sitemap = read("app/sitemap.ts");
  for (const route of routes) {
    const source = read(`app/${route}/page.tsx`);
    assert.ok(source.replaceAll("\r\n", "\n").includes(`publicPageMetadata(\n  "/${route}",`), route);
    const metadata = publicPageMetadata(`/${route}`, "Page title", "Page description");
    const url = `${CANONICAL_SITE_URL}/${route}`;
    assert.equal(metadata.alternates?.canonical, url);
    assert.equal((metadata.openGraph as { url: string }).url, url);
    assert.equal(metadata.title, "Page title", "only the layout supplies the document brand suffix");
    assert.equal((metadata.twitter as { title: string }).title, "Page title | Tech Opportunity");
    assert.ok(sitemap.includes(`CANONICAL_SITE_URL}/${route}`), `${route} is in sitemap`);
  }
});

test("metadata title literals do not already carry the layout brand suffix", () => {
  function inspect(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (entry.name === "page.tsx") {
        const source = readFileSync(path, "utf8");
        assert.doesNotMatch(source, /title: ["`][^\n]*(?:\| Tech Opportunity|TechOpportunity Tanzania)["`]/, path);
      }
    }
  }
  inspect(join(process.cwd(), "app"));
});

test("detail metadata stays route-specific and sitemap never invents modification times", () => {
  const detail = read("app/opportunities/[slug]/page.tsx");
  assert.match(detail, /publicPageMetadata\([\s\S]*?`\/opportunities\/\$\{opportunity\.slug\}`/);
  const metadata = publicPageMetadata("/opportunities/example", "Example", "Description", "article");
  assert.equal(metadata.title, "Example");
  assert.equal(metadata.alternates?.canonical, `${CANONICAL_SITE_URL}/opportunities/example`);
  assert.equal((metadata.openGraph as { type: string }).type, "article");
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /export const revalidate = 60/);
  assert.doesNotMatch(sitemap, /lastModified:/);
  assert.match(sitemap, /await listPublishedOpportunities\(\)/);
  for (const excluded of ["login", "profile", "saved", "activity", "for-you", "ai-match", "offline", "moderation", "campaigns", "reports"]) {
    assert.ok(!sitemap.includes(`CANONICAL_SITE_URL}/${excluded}`), `${excluded} excluded`);
  }
});

console.log(`\n${passed} trust-page contract tests passed.`);
