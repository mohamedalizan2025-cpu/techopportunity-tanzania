/**
 * Public UI regression checks against a running local server (no account writes).
 * Run: node tests/ui-smoke.mjs
 * UI_BASE_URL defaults to http://localhost:3000. Supply PLAYWRIGHT_MODULE with
 * an external Playwright installation path if it is not available on NODE_PATH.
 * Playwright is QA tooling only; it is not an application dependency.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const loadPlaywright = createRequire(import.meta.url);
const { chromium } = loadPlaywright(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const base = process.env.UI_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const noOverflow = async () =>
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Horizontal overflow at ${page.viewportSize().width}px on ${page.url()}`,
      );
    await page.goto(base);
    await page.getByRole("heading", { level: 1 }).waitFor();
    for (const width of [360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow();
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator(".mobile-menu summary").click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".mobile-menu").getAttribute("open"), null);
    assert.equal(
      await page
        .locator(".mobile-menu summary")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.locator(".mobile-menu summary").click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Explore opportunities" })
      .click();
    assert.equal(await page.locator(".mobile-menu").getAttribute("open"), null);

    await page
      .getByLabel("Search opportunities", { exact: true })
      .fill("zzzz-ui-no-results");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForURL(/q=zzzz-ui-no-results/);
    await page
      .getByText("No matching opportunities", { exact: true })
      .waitFor();
    assert.equal(new URL(page.url()).hash, "#opportunities");
    await page.locator(".filter-disclosure summary").click();
    await page.locator('select[name="deadline"]').selectOption("rolling");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await page.waitForURL(/deadline=rolling/);
    assert.equal(
      new URL(page.url()).searchParams.get("q"),
      "zzzz-ui-no-results",
    );
    await page.getByRole("link", { name: "Newest", exact: true }).click();
    await page.waitForURL(/sort=newest/);
    await page.getByRole("link", { name: "Clear all", exact: true }).click();
    await page.waitForURL(`${base}/#opportunities`);
    assert.equal(new URL(page.url()).search, "");
    await page
      .getByRole("heading", { name: "Explore opportunities", exact: true })
      .waitFor();

    const card = page.locator(".opportunity-card h3 a").first();
    if (await card.count()) {
      await card.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL("**/opportunities/**");
      await page.locator("#about-opportunity").waitFor();
      assert.equal(
        await page
          .getByRole("link", { name: "Open source and application details" })
          .getAttribute("rel"),
        "noopener noreferrer",
      );
      for (const width of [360, 390, 430, 768, 950, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await noOverflow();
      }
      await page.getByRole("link", { name: "Back to results" }).click();
      await page.waitForURL(`${base}/#opportunities`);
      console.log(
        "PASS detail keyboard navigation, source action, return URL and responsive layout",
      );
    } else
      console.log(
        "SKIP live detail checks: no published cards in this environment",
      );

    await page.goto(`${base}/saved`);
    await page.waitForURL("**/login?next=%2Fsaved");
    const form = page.locator("main form");
    await form
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    assert.equal(
      await form.locator('input[name="mode"]').inputValue(),
      "sign-up",
    );
    assert.equal(
      await page.locator("#password").getAttribute("autocomplete"),
      "new-password",
    );
    await page.getByRole("button", { name: "Show password" }).click();
    assert.equal(await page.locator("#password").getAttribute("type"), "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    assert.equal(
      await page.locator("#password").getAttribute("type"),
      "password",
    );
    await form.getByRole("button", { name: "Sign in", exact: true }).click();
    assert.equal(
      await page.locator("#password").getAttribute("autocomplete"),
      "current-password",
    );
    // Empty fields return validation before the auth service is contacted.
    await form.locator('button[type="submit"]').click();
    const feedback = form.locator('p[role="alert"]');
    await feedback.waitFor();
    assert.match(await feedback.innerText(), /Enter your email and password/);
    await feedback
      .evaluate(
        (el) =>
          new Promise((resolve) =>
            requestAnimationFrame(() => resolve(el === document.activeElement)),
          ),
      )
      .then((focused) => assert.equal(focused, true));
    for (const width of [360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow();
    }
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    await page.goto(`${base}/ui-smoke-missing-page`);
    await page.locator("main").waitFor();
    await noOverflow();
    assert.deepEqual(errors, [], "No browser runtime errors");
    console.log(
      "PASS responsive home/auth/404, search/filter/sort/reset URL state, mobile menu, auth mode/password/validation and reduced motion",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
