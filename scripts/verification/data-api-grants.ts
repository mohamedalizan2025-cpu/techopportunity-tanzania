import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDirectory = path.join(root, "supabase", "migrations");
const baselineName = "0021_explicit_data_api_grants.sql";
const futureSequenceCorrectionName = "0022_close_future_sequence_update_grants.sql";
const migrationNames = readdirSync(migrationsDirectory)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

const readMigration = (name: string) =>
  readFileSync(path.join(migrationsDirectory, name), "utf8").toLowerCase();

const allMigrations = migrationNames.map(readMigration).join("\n");
const contract = readMigration(baselineName);
const futureSequenceCorrection = readMigration(futureSequenceCorrectionName);

function uniqueMatches(source: string, expression: RegExp): string[] {
  return [...new Set([...source.matchAll(expression)].map((match) => match[1]))].sort();
}

const tables = uniqueMatches(
  allMigrations,
  /create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-z0-9_]+)/g
);
const functions = uniqueMatches(
  allMigrations,
  /create(?:\s+or\s+replace)?\s+function\s+public\.([a-z0-9_]+)/g
);

assert.ok(migrationNames.includes(baselineName), `${baselineName} is required`);
assert.ok(
  migrationNames.includes(futureSequenceCorrectionName),
  `${futureSequenceCorrectionName} is required`
);
assert.doesNotMatch(contract, /grant\s+all\b/);
assert.doesNotMatch(contract, /grant[\s\S]{0,80}\bon\s+all\s+(?:tables|sequences|functions)/);
assert.doesNotMatch(
  contract,
  /alter\s+default\s+privileges[\s\S]{0,160}\bgrant\b/,
  "future public objects must remain deny-by-default"
);

for (const objectDefault of ["select, insert, update, delete on tables", "execute on functions"]) {
  const escaped = objectDefault.replaceAll(", ", ",\\s+").replaceAll(" ", "\\s+");
  assert.match(
    contract,
    new RegExp(
      `alter\\s+default\\s+privileges\\s+for\\s+role\\s+postgres\\s+in\\s+schema\\s+public\\s+revoke\\s+${escaped}\\s+from\\s+anon,\\s+authenticated,\\s+service_role`
    ),
    `missing restrictive future default for ${objectDefault}`
  );
}
assert.match(
  futureSequenceCorrection,
  /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+usage,\s+select,\s+update\s+on\s+sequences\s+from\s+anon,\s+authenticated,\s+service_role/,
  "future public sequences must revoke USAGE, SELECT, and UPDATE"
);
assert.doesNotMatch(futureSequenceCorrection, /\bgrant\b/);
assert.match(
  contract,
  /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+revoke\s+execute\s+on\s+functions\s+from\s+public/
);

for (const table of tables) {
  assert.match(
    contract,
    new RegExp(
      `revoke\\s+all\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+public,\\s+anon,\\s+authenticated,\\s+service_role`
    ),
    `missing closed-first table contract for public.${table}`
  );
}

for (const fn of functions) {
  assert.match(
    contract,
    new RegExp(
      `revoke\\s+all\\s+on\\s+function\\s+public\\.${fn}\\s*\\([^;]*?\\)\\s+from\\s+public,\\s+anon,\\s+authenticated,\\s+service_role`
    ),
    `missing closed-first function contract for public.${fn}`
  );
}

assert.match(
  contract,
  /revoke\s+all\s+on\s+sequence\s+public\.categories_id_seq\s+from\s+public,\s+anon,\s+authenticated,\s+service_role/
);

// A future migration must be safe on a project where Supabase's restrictive
// defaults are already active. New public objects declare their own exposure
// in the same migration instead of relying on this one-time baseline.
const futureMigrations = migrationNames.filter((name) => name > baselineName);
for (const name of futureMigrations) {
  const source = readMigration(name);
  const newTables = uniqueMatches(
    source,
    /create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-z0-9_]+)/g
  );
  const newFunctions = uniqueMatches(
    source,
    /create(?:\s+or\s+replace)?\s+function\s+public\.([a-z0-9_]+)/g
  );

  for (const table of newTables) {
    assert.match(
      source,
      new RegExp(`revoke\\s+all\\s+on\\s+table\\s+public\\.${table}\\b`),
      `${name} must close public.${table} before any explicit grants`
    );
  }
  for (const fn of newFunctions) {
    assert.match(
      source,
      new RegExp(`revoke\\s+all\\s+on\\s+function\\s+public\\.${fn}\\s*\\(`),
      `${name} must close public.${fn}(...) before any explicit EXECUTE grant`
    );
  }
  if (/generated[\s\S]{0,40}\bas\s+identity\b|\b(?:small|big)?serial\b/.test(source)) {
    assert.match(
      source,
      /revoke\s+all\s+on\s+sequence\s+public\./,
      `${name} creates a sequence-backed column and must declare its sequence privileges`
    );
  }
  assert.doesNotMatch(source, /grant\s+all\b/, `${name} must use operation-specific grants`);
}

console.log(
  `PASS explicit Data API grant contract covers ${tables.length} tables, ${functions.length} functions, and restrictive future-object defaults.`
);
