/** PWA installability + cache-privacy tests (read-only, no network). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "../app/manifest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

// --- manifest carries real product values ------------------------------------

const meta = manifest();
check("manifest names the real product", meta.name === "Tech Opportunity");
check("manifest has a launcher-safe short name", typeof meta.short_name === "string" && meta.short_name.length <= 16);
check(
  "manifest description is the real proposition, not a placeholder",
  typeof meta.description === "string" &&
    meta.description.includes("Tanzania") &&
    !/lorem|example|demo|test/i.test(meta.description ?? "")
);
check("manifest starts at canonical root scope", meta.start_url === "/" && meta.scope === "/");
check("manifest is standalone", meta.display === "standalone");
check("manifest theme matches brand deep teal", meta.theme_color === "#082f2b");
const sizes = (meta.icons ?? []).map((icon) => icon.sizes);
check("manifest ships 192 + 512 icons", sizes.includes("192x192") && sizes.includes("512x512"));
check(
  "manifest ships maskable icons",
  (meta.icons ?? []).some((icon) => icon.purpose === "maskable" && icon.sizes === "512x512")
);
check(
  "manifest shortcuts are real routes only",
  (meta.shortcuts ?? []).length === 3 &&
    (meta.shortcuts ?? []).every((entry) => ["/", "/for-you", "/saved"].includes(entry.url ?? ""))
);
check(
  "manifest references local icons only",
  (meta.icons ?? []).every((icon) => (icon.src ?? "").startsWith("/icons/"))
);

// --- service worker: static resilience, never private data --------------------

const worker = read("public/sw.js");
check("worker precaches the offline shell", worker.includes('"/offline"'));
check("worker precaches brand icons only", worker.includes('"/icons/icon-192.png"'));
check("worker handles only GET requests", worker.includes('request.method !== "GET"'));
check("worker stays same-origin", worker.includes("url.origin !== self.location.origin"));
check("worker serves an offline fallback for navigations", /caches\.match\(["']\/offline["']\)/.test(worker));
check(
  "worker never caches API, auth, account, staff, or AI paths",
  !/["']\/(api|auth|login|saved|activity|profile|moderation|published-management|campaigns|for-you)["']/.test(
    worker.replace(/\/offline/g, "")
  )
);
check("worker contains no remote URLs or secrets", !/https?:\/\//.test(worker) && !/supabase|service_role|NEXT_PUBLIC/i.test(worker));

// --- install UX: eligible-only, dismissible, standalone-aware ------------------

const install = read("components/install-prompt.tsx");
check("install listens for browser eligibility", install.includes("beforeinstallprompt"));
check("install hides when dismissed persistently", install.includes("techopportunity-pwa-dismissed"));
check("install detects standalone mode", install.includes("display-mode: standalone"));
check("install handles iOS manual guidance", install.includes("Add to Home Screen"));
check("install handles declined prompts cleanly", install.includes("appinstalled"));
check("install posts no data anywhere", !/fetch\(/.test(install));

const register = read("components/pwa-register.tsx");
check("registration targets the local worker only", register.includes('"/sw.js"'));
check("registration fails silently without breaking the product", register.includes(".catch("));

// --- offline page honesty ------------------------------------------------------

const offline = read("app/offline/page.tsx");
check("offline page is never indexed", offline.includes("index: false"));
check("offline warns facts may have changed", /may have changed/i.test(offline));
check("offline never presents cached facts as current", /never presented as current/i.test(offline));

// --- theme-color lives in the viewport export (Next 16 rejects it in metadata) -

const layout = read("app/layout.tsx");
check(
  "layout sets themeColor through the viewport export",
  layout.includes("export const viewport") && layout.includes('themeColor: "#0B1F33"')
);
check(
  "layout keeps themeColor out of the metadata export",
  !/export const metadata[\s\S]*?themeColor/.test(layout.split("export const viewport")[0] ?? "")
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
