# Ingredient Calculator

A recipe book that does the cooking maths. Save a recipe once — ingredients with
quantities, plus the adding procedure — then scale it three ways, convert between
units, and keep a standing conversion reference to hand.

Next.js (App Router) · Upstash Redis · deploys to Vercel.

---

## The three ways to scale

Every recipe page carries all three, as tabs:

| §   | Mode                | You enter                          | It works out                                    |
| --- | ------------------- | ---------------------------------- | ----------------------------------------------- |
| 01  | **By servings**     | How many people you are cooking for | `target ÷ the count the recipe was written for` |
| 02  | **By base ingredient** | How much of the base you have    | `what you have ÷ what the recipe asks for`      |
| 03  | **By output**       | How much finished food you need     | `target weight ÷ the recipe's total weight`     |

The **base ingredient** is chosen when the recipe is added (the radio button on
each ingredient row). It is the baker's-percentage anchor: mark flour as the base
and everything else follows from however much flour you actually have.

Ingredients left without a quantity are treated as *as per taste* and are never
scaled. Counted things (bay leaves, cloves) are excluded from weight totals rather
than being given a made-up weight.

## Unit conversions

Weights (mg/g/kg/oz/lb), volumes (ml/L/tsp/tbsp/cup/fl oz/pint/quart/gallon, in US
customary **and** metric spoon sizes), and counts. Any ingredient row on a recipe
can be flipped to a different unit on the spot.

Going between weight and volume needs a density, so `src/lib/units.ts` carries a
table for the usual suspects (flour 0.53, sugar 0.845, butter 0.911, honey 1.42 …)
matched on the longest substring of the ingredient name, falling back to water.
Pairs that cannot be related — grams to cloves — return `null` rather than a
plausible-looking wrong number.

`/info` holds the standing tables: spoons and cups, regional cup sizes, weights,
what a cup of each ingredient weighs, oven temperatures, and baker's percentages.
`/convert` is a one-off converter.

## Uploading a recipe

`/recipes/upload` takes a PDF, DOCX or DOC (up to 4 MB) and saves the recipes in it
automatically. Any layout works: tables, lists, prose, scanned pages, or several
recipes in one file. PDFs go to Gemini as they are, so scans are read too. Word files
are turned into text first (`mammoth` for .docx, `word-extractor` for .doc). Gemini
returns structured JSON that is checked against the same schema as the recipe form.

The file is held in memory for the length of the request and then dropped. It is
never written to disk or to Redis; only the resulting recipes are saved. This uses
Gemini's free tier, so heavy use can hit its rate limit; the page then asks you to
retry shortly. Note that Google may use free-tier inputs to improve its products.

Code: `src/lib/recipe-extract.ts`, `src/app/api/recipes/upload/route.ts`.

---

## Running it

```bash
npm install
cp .env.example .env.local     # then fill it in
npm run dev
```

Without Upstash credentials the app falls back to an **in-process store** so `npm
run dev` works immediately — recipes vanish on restart, and the recipe list says so.

### Environment variables

| Variable                   | Needed for            | Notes                                                       |
| -------------------------- | --------------------- | ----------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | persistence           | Upstash console → your database → REST API                  |
| `UPSTASH_REDIS_REST_TOKEN` | persistence           | Same place                                                   |
| `AUTH_SECRET`              | sessions (required in production) | 32+ random characters                            |
| `GEMINI_API_KEY`           | recipe upload         | Free key from [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL`             | recipe upload (optional) | Defaults to `gemini-flash-latest`                        |
| `SEED_EMAIL`               | `npm run seed` only   | Account that receives the imported recipes                   |
| `SEED_PASSWORD`            | `npm run seed` only   | At least 8 characters                                        |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Scripts

| Script               | Does                                                          |
| -------------------- | ------------------------------------------------------------- |
| `npm run dev`        | Development server                                            |
| `npm run build`      | Production build                                              |
| `npm test`           | Unit tests for conversion, scaling and formatting (55 of them) |
| `npm run parse:xlsx` | Re-read `MyRecipes1.xlsx` → `src/data/seed-recipes.json`       |
| `npm run seed`       | Push that JSON straight into Upstash for `SEED_EMAIL`          |

---

## Your spreadsheet

`MyRecipes1.xlsx` has been parsed into `src/data/seed-recipes.json` — 13 recipes:

> Laadi Paav · Paav bhaji · Chocolate Cake · Malai Kofta · Chicken Stock ·
> Vegetable Stock · Ministrone · Japanese Cheesecake · English Muffins ·
> Hollandaise Sauce · Chocobrownie · Churros · Butter Eclairs

Two ways to load them:

1. **In the app** — sign in and press *Import … from spreadsheet* on the recipes
   page. Works against whatever store is configured, and skips recipes whose name
   you already have, so it is safe to press twice.
2. **From the command line** — `npm run seed`, which writes straight to Upstash and
   creates the `SEED_EMAIL` account if it does not exist.

`scripts/parse-xlsx.mjs` finds each recipe block by looking for the literal
`Ingredients` header cell, so the column offsets are derived rather than hard-coded
— re-run it after editing the workbook. Blocks marked `Base ingredient-->` become
base-anchored recipes (1 batch); blocks with a `Serving`/`Yield` row keep that count.

Two things the spreadsheet does not contain, and which were therefore **not**
invented:

- **No method steps.** Every imported recipe has an empty adding procedure; the
  recipe page links straight to the editor to fill it in.
- **The "Chocolate Tempering" block was skipped** — it is a temperature note rather
  than an ingredients table, and has no `Ingredients` header for the parser to find.

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project** and import it. The framework is detected; no
   build settings to change.
3. **Storage → Create Database → Upstash Redis**, and connect it to the project.
   That injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   automatically. (Creating the database in the Upstash console and pasting the two
   values in by hand works just as well.)
4. Add `AUTH_SECRET` under **Settings → Environment Variables**, for all
   environments. The app refuses to start a session in production without it.
5. Deploy, then either sign up and press *Import*, or run `npm run seed` locally
   with the production Upstash credentials in `.env.local`.

---

## How it is put together

```
src/
  app/
    page.tsx                    landing
    login/ signup/              authentication
    recipes/                    list · new · [id] (the scaler) · [id]/edit
    convert/                    one-off unit converter
    info/                       conversion tables
    api/auth/                   signup · login · logout
    api/recipes/                CRUD + import
  components/
    RecipeForm.tsx              add / modify — ingredient rows and method steps
    RecipeScaler.tsx            the three scaling sections
    UnitConverter.tsx  UnitSelect.tsx  …
  lib/
    units.ts                    unit table, densities, convert()
    scale.ts                    the three factor calculations
    format.ts                   fraction parsing and cook-friendly rounding
    recipes.ts                  validation (zod) + persistence
    auth.ts  session.ts         scrypt hashing, JWT cookie sessions
    db.ts                       Upstash, with the in-memory dev fallback
scripts/
  xlsx.mjs                      minimal xlsx reader (no dependencies)
  parse-xlsx.mjs                workbook → seed JSON
  seed.mjs                      seed JSON → Upstash
tests/                          units · scale · format
```

### Authentication

Email and password. Passwords are hashed with `scrypt` (random 16-byte salt, 64-byte
key, compared with `timingSafeEqual`); sessions are HS256 JWTs in an `httpOnly`,
`sameSite=lax`, `secure`-in-production cookie lasting 30 days. Sign-in failures for
an unknown email still run a hash so the response time does not reveal which
accounts exist. Every recipe read, write and delete re-checks ownership server-side.

### Data layout in Redis

```
u:email:{email}    → userId                        (SET NX — the uniqueness guard)
u:{userId}         → { id, email, name, passwordHash, createdAt }
u:{userId}:recipes → sorted set of recipeId, scored by updatedAt
r:{recipeId}       → the recipe
```
