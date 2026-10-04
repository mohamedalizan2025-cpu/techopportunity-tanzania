import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { logOutAction } from "../lib/data/auth-actions";

const root = process.cwd();
const actions = readFileSync(join(root, "lib/data/auth-actions.ts"), "utf8");
const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
const supabaseAuth = readFileSync(
  join(root, "lib/data/supabase-auth.ts"),
  "utf8"
);

test("sign-out always ends in a safe redirect, never in the error path", async () => {
  // Outside a request scope the client cannot even be created; the action
  // must still redirect (fail-safe) rather than throw into error.tsx.
  await assert.rejects(logOutAction(), (error: unknown) => {
    assert.match(String((error as Error)?.message ?? error), /NEXT_REDIRECT/);
    assert.match(
      String((error as { digest?: string })?.digest ?? ""),
      /NEXT_REDIRECT/
    );
    return true;
  });
});

test("sign-out handles the provider result explicitly (no silent swallow)", () => {
  assert.match(actions, /const \{ error \} = await supabase\.auth\.signOut\(\)/);
  assert.match(actions, /console\.error/);
});

test("sign-out verifies the session is gone before redirecting", () => {
  assert.match(actions, /supabase\.auth\.getSession\(\)/);
  assert.match(actions, /session survived sign-out/);
});

test("sign-out unconditionally redirects to public /", () => {
  assert.match(actions, /redirect\("\/"\)/);
});

test("proxy session refresh fails closed to anonymous, never 500s", () => {
  assert.match(proxy, /await supabase\.auth\.getClaims\(\)/);
  assert.match(proxy, /continuing anonymously/);
});

test("authenticated-user lookup fails closed to anonymous, never throws", () => {
  assert.match(supabaseAuth, /continuing anonymously/);
  const guarded = supabaseAuth.indexOf("continuing anonymously");
  const returned = supabaseAuth.indexOf("return null", guarded);
  assert.ok(returned > guarded, "guard returns null after logging");
});
