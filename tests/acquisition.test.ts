/**
 * Acquisition-safety and country-honesty tests.
 *
 * Two contracts are pinned here:
 *
 * 1. acquisitionBlockReason() is the deterministic pre-flight screen every
 *    URL (and every redirect hop) must pass. The screen is pure, so it is
 *    tested directly — no network involved. It is documented as necessary-
 *    but-not-sufficient (DNS-resolution checks are the next gate, §12.5),
 *    but the classes it CAN catch statically must stay caught.
 *
 * 2. Country honesty: no structured country evidence ⇒ null. The pipeline
 *    must never default country to "Tanzania" (or anything else); a
 *    legitimate explicit value is preserved untouched.
 */
import { acquisitionBlockReason } from "../scripts/discovery/fetch";
import { normalizeCandidate, inferCategory } from "../scripts/discovery/normalize";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

// ---- 1. acquisition guard: allowed traffic ---------------------------------
assert("A1 public https page is allowed", acquisitionBlockReason("https://example.com/page") === null);
assert("A1b public http feed is allowed", acquisitionBlockReason("http://feeds.example.org/rss.xml") === null);
assert("A1c public IPv4 literal is allowed", acquisitionBlockReason("https://203.0.113.7/") === null);

// ---- 2. acquisition guard: scheme screen ------------------------------------
assert("A2 file: scheme blocked", acquisitionBlockReason("file:///etc/passwd") !== null);
assert("A2b javascript: scheme blocked", acquisitionBlockReason("javascript:alert(1)") !== null);
assert("A2c ftp: scheme blocked", acquisitionBlockReason("ftp://example.com/x") !== null);
assert("A2d malformed URL blocked", acquisitionBlockReason("not a url") !== null);

// ---- 3. acquisition guard: loopback / private hosts -------------------------
assert("A3 localhost blocked", acquisitionBlockReason("http://localhost/x") !== null);
assert("A3b loopback IPv4 blocked", acquisitionBlockReason("http://127.0.0.1:54321/") !== null);
assert("A3c 10/8 blocked", acquisitionBlockReason("http://10.0.0.5/") !== null);
assert("A3d 192.168/16 blocked", acquisitionBlockReason("http://192.168.1.1/") !== null);
assert("A3e 172.16/12 blocked (low edge)", acquisitionBlockReason("http://172.16.0.1/") !== null);
assert("A3f 172.16/12 blocked (high edge)", acquisitionBlockReason("http://172.31.255.255/") !== null);
assert("A3g 172.32 just outside the block is allowed", acquisitionBlockReason("http://172.32.0.1/") === null);
assert("A3h link-local 169.254 blocked", acquisitionBlockReason("http://169.254.169.254/latest") !== null);
assert("A3i carrier-grade NAT 100.64/10 blocked", acquisitionBlockReason("http://100.64.0.1/") !== null);
assert("A3j 0.0.0.0 blocked", acquisitionBlockReason("http://0.0.0.0/") !== null);

// ---- 4. acquisition guard: private suffixes + IPv6 --------------------------
assert("A4 .internal suffix blocked", acquisitionBlockReason("http://db.internal/") !== null);
assert("A4b .local suffix blocked", acquisitionBlockReason("http://printer.local/") !== null);
assert("A4c bracketed IPv6 blocked", acquisitionBlockReason("http://[::1]/") !== null);
assert("A4d bare IPv6 blocked", acquisitionBlockReason("http://::1/") !== null);
assert("A4e malformed IPv4 literal blocked", acquisitionBlockReason("http://999.1.1.1/") !== null);

// ---- 5. country honesty: no evidence, no country ----------------------------
function mkCandidate(overrides: Record<string, string | null> = {}) {
  return normalizeCandidate(
    {
      title: "Example Opportunity",
      url: "https://example.org/opportunity",
      category: null,
      description: "A hackathon for builders.",
      organization: null,
      deadline: null,
      venueName: null,
      address: null,
      city: null,
      region: null,
      country: null,
      sourceUrl: "https://example.org/",
      ...overrides,
    },
    "src-test"
  );
}

const c1 = mkCandidate();
assert("C1 missing country evidence stays null (no Tanzania default)", c1 !== null && c1.country === null);

const c2 = mkCandidate({ country: "   " });
assert("C2 whitespace-only country collapses to null", c2 !== null && c2.country === null);

const c3 = mkCandidate({ country: "Kenya" });
assert("C3 explicit country evidence is preserved", c3 !== null && c3.country === "Kenya");

const c4 = mkCandidate({ country: "  United   Republic of Tanzania " });
assert("C4 country evidence is cleaned, not invented", c4 !== null && c4.country === "United Republic of Tanzania");

// ---- 6. jobs inference stays conservative -----------------------------------
assert("J1 'vacancy' infers jobs", inferCategory(["Programme Officer Vacancy"]) === "jobs");
assert("J2 'ajira' infers jobs", inferCategory(["Ajira kwa vijana"]) === "jobs");
assert("J3 'nafasi za kazi' infers jobs", inferCategory(["Nafasi za kazi mpya"]) === "jobs");
assert(
  "J4 news-noise terms stay unmapped (position/career/officer alone)",
  inferCategory(["New Officer position announced"]) !== "jobs"
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
