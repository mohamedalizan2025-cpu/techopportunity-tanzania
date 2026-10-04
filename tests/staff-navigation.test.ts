import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  canSeeStaffNavigation,
  isModeratorRole,
  isStaffRoute,
} from "../lib/staff-navigation";

const root = process.cwd();
const header = readFileSync(join(root, "components/site-header.tsx"), "utf8");
const bottomNav = readFileSync(
  join(root, "components/bottom-navigation.tsx"),
  "utf8"
);
const navLink = readFileSync(
  join(root, "components/navigation-link.tsx"),
  "utf8"
);
const moderation = readFileSync(join(root, "lib/data/moderation.ts"), "utf8");

test("anonymous sees no staff navigation", () => {
  assert.equal(canSeeStaffNavigation(null), false);
  assert.equal(canSeeStaffNavigation(undefined), false);
});

test("ordinary user role sees no staff navigation", () => {
  assert.equal(canSeeStaffNavigation("user"), false);
  assert.equal(isModeratorRole("user"), false);
});

test("moderator role sees staff navigation", () => {
  assert.equal(canSeeStaffNavigation("moderator"), true);
  assert.equal(isModeratorRole("moderator"), true);
});

test("admin role does NOT see public staff navigation (moderator-only)", () => {
  assert.equal(canSeeStaffNavigation("admin"), false);
  assert.equal(isModeratorRole("admin"), false);
});

test("hostile role values never grant staff navigation", () => {
  for (const role of ["Moderator", "MODERATOR", " moderator", "", 0, {}, []]) {
    assert.equal(canSeeStaffNavigation(role), false);
  }
});

test("staff routes suppress the public bottom nav", () => {
  for (const path of [
    "/moderation",
    "/moderation/abc",
    "/published-management",
    "/published-management/abc",
    "/campaigns",
    "/campaigns/abc",
  ]) {
    assert.equal(isStaffRoute(path), true, path);
  }
});

test("public routes keep the public bottom nav", () => {
  for (const path of ["/", "/for-you", "/saved", "/profile", "/activity"]) {
    assert.equal(isStaffRoute(path), false, path);
  }
});

test("nullish pathname renders public chrome instead of throwing", () => {
  assert.equal(isStaffRoute(null), false);
  assert.equal(isStaffRoute(undefined), false);
  assert.equal(isStaffRoute(""), false);
});

test("lookalike paths do not match staff routes", () => {
  assert.equal(isStaffRoute("/moderationists"), false);
  assert.equal(isStaffRoute("/campaigns-archive"), false);
});

test("site header gates staff entries behind the moderator-only helper", () => {
  assert.match(header, /canSeeStaffNavigation\(user\?\.role\)/);
  const gates = header.match(/isModerator \?/g) ?? [];
  assert.equal(gates.length, 2, "desktop and mobile menus share one gate");
  assert.match(header, /Staff moderation/);
  assert.match(header, /Campaign pilot/);
  assert.doesNotMatch(header, /role === "moderator" \|\|/);
});

test("bottom navigation delegates to the null-safe helper", () => {
  assert.match(bottomNav, /isStaffRoute\(pathname\)/);
  assert.doesNotMatch(bottomNav, /pathname\.startsWith/);
});

test("navigation link never throws on a null pathname", () => {
  assert.match(navLink, /pathname === null/);
});

test("server authorization contract is unchanged (moderator+admin)", () => {
  assert.match(
    moderation,
    /user\.role !== "moderator" && user\.role !== "admin"/
  );
});
