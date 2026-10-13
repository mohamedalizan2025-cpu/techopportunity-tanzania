/** Branded auth-email copy regression (SMTP activation prep, no sending). */
import assert from "node:assert/strict";
import {
  AUTH_EMAIL_SENDER,
  confirmationEmail,
  passwordResetEmail,
  resendConfirmationEmail,
} from "../lib/auth-email";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

test("future sender targets the auth subdomain", () => {
  assert.equal(AUTH_EMAIL_SENDER, "no-reply@auth.techopportunity.tech");
});

test("confirmation copy is branded and carries the supplied link", () => {
  const url =
    "https://techopportunity.tech/auth/callback?next=%2Fsaved#access_token=x";
  const message = confirmationEmail(url);
  assert.match(message.subject, /Tech Opportunity/);
  assert.match(message.subject, /Confirm/);
  assert.ok(message.text.includes(url));
  assert.ok(message.html.includes(url));
  assert.match(message.text, /ignore this email/);
  assert.doesNotMatch(message.text + message.html, /password/i);
});

test("reset copy never claims an account exists", () => {
  const url = "https://techopportunity.tech/auth/callback?next=%2Freset-password";
  const message = passwordResetEmail(url);
  assert.match(message.subject, /Reset/);
  assert.ok(message.text.includes(url));
  assert.match(message.text, /stays unchanged/);
  assert.doesNotMatch(message.text + message.html, /you have an account/i);
});

test("resend copy reuses the confirmation channel", () => {
  const url = "https://techopportunity.tech/auth/callback?next=%2Fsaved";
  const message = resendConfirmationEmail(url);
  assert.ok(message.text.includes(url));
  assert.match(message.text, /fresh confirmation link/);
});

test("templates point at contact, never at a personal inbox", () => {
  for (const message of [
    confirmationEmail("https://example.org/a"),
    passwordResetEmail("https://example.org/b"),
    resendConfirmationEmail("https://example.org/c"),
  ]) {
    assert.match(message.text, /\/contact/);
    assert.match(message.html, /\/contact/);
    assert.doesNotMatch(message.text + message.html, /SMTP|RESEND_|API_KEY|service_role/i);
  }
});

test("action URLs are HTML-escaped", () => {
  const message = confirmationEmail('https://example.org/?q="><x>');
  assert.ok(!message.html.includes('"><x>'));
  assert.ok(message.html.includes("&quot;&gt;&lt;"));
});

console.log(`\n${passed} auth-email copy tests passed.`);
