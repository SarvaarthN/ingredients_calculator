/**
 * Load data/seed-recipes.json into Upstash, owned by the SEED_EMAIL account.
 *
 *   npm run seed
 *
 * Creates the account if it does not exist. Re-running is safe: recipes whose
 * name already exists for that user are skipped rather than duplicated.
 *
 * Reads UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, SEED_EMAIL and
 * SEED_PASSWORD from .env.local, then .env, then the real environment.
 */
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── env ─────────────────────────────────────────────────────────────────────
for (const file of [".env.local", ".env"]) {
  try {
    const text = readFileSync(resolve(root, file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const value = match[2].trim().replace(/^["'](.*)["']$/s, "$1");
      process.env[match[1]] ??= value;
    }
  } catch {
    // File is optional.
  }
}

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const EMAIL = (process.env.SEED_EMAIL ?? "").trim().toLowerCase();
const PASSWORD = process.env.SEED_PASSWORD ?? "";

function die(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!URL_ || !TOKEN) die("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (see .env.example).");
if (!EMAIL) die("Set SEED_EMAIL to the account that should own the imported recipes.");
if (PASSWORD.length < 8) die("Set SEED_PASSWORD to at least 8 characters.");

// ── Upstash REST ────────────────────────────────────────────────────────────
async function command(...args) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.map(String)),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error ?? `Upstash returned ${res.status}`);
  return body.result;
}

/** Upstash stores JSON as a string; the client parses it back on read. */
const setJson = (key, value) => command("SET", key, JSON.stringify(value));

async function getJson(key) {
  const raw = await command("GET", key);
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// ── password hashing (must match src/lib/auth.ts) ───────────────────────────
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

// ── run ─────────────────────────────────────────────────────────────────────
const keys = {
  userByEmail: (email) => `u:email:${email}`,
  user: (id) => `u:${id}`,
  userRecipes: (id) => `u:${id}:recipes`,
  recipe: (id) => `r:${id}`,
};

const recipes = JSON.parse(readFileSync(resolve(root, "src/data/seed-recipes.json"), "utf8"));

console.log(`\n  Upstash: ${new URL(URL_).host}`);
console.log(`  Account: ${EMAIL}`);

let userId = await command("GET", keys.userByEmail(EMAIL));

if (userId) {
  console.log("  Account already exists — adding any missing recipes.\n");
} else {
  userId = randomUUID();
  const claimed = await command("SET", keys.userByEmail(EMAIL), userId, "NX");
  if (claimed !== "OK") die("Could not claim that email — try again.");

  await setJson(keys.user(userId), {
    id: userId,
    email: EMAIL,
    name: EMAIL.split("@")[0],
    passwordHash: await hashPassword(PASSWORD),
    createdAt: Date.now(),
  });
  console.log("  Account created.\n");
}

// What is already there?
const existingIds = (await command("ZRANGE", keys.userRecipes(userId), 0, -1)) ?? [];
const existingNames = new Set();
for (const id of existingIds) {
  const recipe = await getJson(keys.recipe(id));
  if (recipe?.name) existingNames.add(recipe.name.toLowerCase());
}

let added = 0;
let skipped = 0;

for (const source of recipes) {
  if (existingNames.has(source.name.toLowerCase())) {
    console.log(`  · skipped  ${source.name} (already saved)`);
    skipped++;
    continue;
  }

  const now = Date.now();
  const recipe = {
    id: randomUUID(),
    userId,
    name: source.name,
    description: source.description || undefined,
    servings: source.servings,
    servingLabel: source.servingLabel,
    ingredients: source.ingredients.map((ing) => ({
      id: randomUUID(),
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit ?? "",
      note: ing.note || undefined,
      isBase: Boolean(ing.isBase),
    })),
    steps: source.steps ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await setJson(keys.recipe(recipe.id), recipe);
  await command("ZADD", keys.userRecipes(userId), now, recipe.id);
  console.log(`  + added    ${recipe.name} (${recipe.ingredients.length} ingredients)`);
  added++;
}

console.log(`\n  Done — ${added} added, ${skipped} skipped.`);
console.log(`  Sign in at /login as ${EMAIL}.\n`);
