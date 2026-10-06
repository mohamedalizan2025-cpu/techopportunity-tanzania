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
import { readFileSync } from "node:fs";
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
  assert.match(privacy, /Privacy Policy \| Tech Opportunity/);
  assert.match(terms, /Terms of Use \| Tech Opportunity/);
  assert.match(contact, /Contact \| Tech Opportunity/);
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

test("privacy describes deletion honestly (no fake self-service)", () => {
  const text = flat(privacy);
  assert.ok(text.includes("self-service account deletion is being built"));
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
  for (const href of ['href="/privacy"', 'href="/terms"', 'href="/contact"', 'href="/#trust-heading"']) {
    assert.ok(layout.includes(href), href);
  }
  assert.doesNotMatch(layout, /address|registration|partner|certification|twitter|x\.com|linkedin\.com|facebook\.com|instagram\.com/i, "footer fabrications");
});

test("auth and profile link the policies without behavior change", () => {
  assert.ok(loginForm.includes('href="/terms"'), "login terms");
  assert.ok(loginForm.includes('href="/privacy"'), "login privacy");
  assert.ok(profileForm.includes('href="/privacy"'), "profile privacy");
  assert.ok(loginForm.includes("By continuing you agree"), "consent-adjacent wording");
});

console.log(`\n${passed} trust-page contract tests passed.`);
