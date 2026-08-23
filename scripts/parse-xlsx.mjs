/**
 * Turn MyRecipes1.xlsx into data/seed-recipes.json.
 *
 *   node scripts/parse-xlsx.mjs [path/to/workbook.xlsx]
 *
 * The sheet lays recipes out as blocks, several per row band:
 *
 *   <title>
 *   Notes | Ingredients | Recommended %ages | My scale/factor | Populate in gms | Units
 *   Base ingredient--> | Flour | 100% | 1 | 250 | gms
 *   (or)  Serving |     |     | 3 | 2 |
 *   ...
 *   Sum
 *
 * Blocks are found by looking for the literal "Ingredients" header cell, so the
 * column offsets of each block are derived rather than hard-coded.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readSheet } from "./xlsx.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const source = resolve(root, process.argv[2] ?? "MyRecipes1.xlsx");
const target = resolve(root, "src/data/seed-recipes.json");

const TO_TASTE = /^(as per taste|as needed|as required|to taste|optional)$/i;
const STOP_WORDS = /^(sum|total)$/i;

/** Ingredients that are counted rather than weighed when the unit cell is blank. */
const COUNTABLE =
  /\b(bay lea|peppercorn|egg|clove|sprig|leaf|leaves|chilli|chilies|chillies|cardamom|star anise|curry lea)/i;

const UNIT_ALIASES = {
  gms: "g",
  gm: "g",
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  ltr: "l",
  tsp: "tsp",
  tbsp: "tbsp",
  cup: "cup",
  cups: "cup",
  oz: "oz",
  lb: "lb",
  pinch: "pinch",
  piece: "piece",
  pieces: "piece",
};

function cell(grid, r, c) {
  return String(grid[r]?.[c] ?? "").trim();
}

function num(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

function normalizeUnit(raw, name, quantity) {
  const key = String(raw ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (key && UNIT_ALIASES[key]) return UNIT_ALIASES[key];
  if (key) return "";
  // Blank unit: the sheet is gram-based, so assume grams unless the line is
  // plainly a count of things.
  if (COUNTABLE.test(name) && quantity !== null && quantity <= 12) return "";
  return "g";
}

function titleCase(text) {
  return text.replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
}

// ── find the blocks ─────────────────────────────────────────────────────────
const grid = readSheet(source);

const blocks = [];
for (let r = 0; r < grid.length; r++) {
  for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
    if (cell(grid, r, c).toLowerCase() === "ingredients") {
      blocks.push({ headerRow: r, col: c });
    }
  }
}

// ── read each block ─────────────────────────────────────────────────────────
const recipes = [];
const skipped = [];

for (const { headerRow, col } of blocks) {
  const COL = {
    note: col - 1,
    name: col,
    recommended: col + 1,
    factor: col + 2,
    populated: col + 3,
    unit: col + 4,
  };

  const title = cell(grid, headerRow - 1, COL.note) || cell(grid, headerRow - 1, COL.name);
  if (!title) {
    skipped.push(`block at row ${headerRow + 1}, column ${col + 1} — no title above the header`);
    continue;
  }

  // The row under the header is either the first ingredient (base-anchored) or a
  // serving/yield declaration.
  let firstIngredientRow = headerRow + 1;
  let servings = 1;
  let servingLabel = "batch";

  const marker = cell(grid, headerRow + 1, COL.note).toLowerCase();
  if (marker.startsWith("serving") || marker.startsWith("yield")) {
    const declared = num(cell(grid, headerRow + 1, COL.factor));
    if (declared && declared > 0) servings = declared;
    servingLabel = marker.startsWith("yield") ? "pieces" : "servings";
    firstIngredientRow = headerRow + 2;
  }

  // Collect the rows.
  const rows = [];
  let blanks = 0;
  for (let r = firstIngredientRow; r < grid.length; r++) {
    const name = cell(grid, r, COL.name);

    if (!name) {
      if (++blanks >= 2) break;
      continue;
    }
    if (STOP_WORDS.test(name)) break;
    // A new block starting in this column band.
    if (name.toLowerCase() === "ingredients") break;

    blanks = 0;
    rows.push({
      row: r,
      name,
      note: cell(grid, r, COL.note),
      recommended: cell(grid, r, COL.recommended),
      populated: cell(grid, r, COL.populated),
      unit: cell(grid, r, COL.unit),
    });
  }

  if (rows.length === 0) {
    skipped.push(`${title} — no ingredient rows`);
    continue;
  }

  // "Recommended %ages" holds the recipe as originally written, and matches the
  // declared serving count. Some sheets leave it as prose ("1% - 1,5%"), in which
  // case the populated-grams column is the only real number available.
  const numericRecommended = rows.filter((r) => num(r.recommended) !== null).length;
  const useRecommended = numericRecommended >= Math.ceil(rows.length / 2);

  const ingredients = rows.map((r) => {
    const primary = (useRecommended ? r.recommended : r.populated).trim();
    const fallback = (useRecommended ? r.populated : r.recommended).trim();

    // "as per taste" beats any number sitting in the other column.
    const toTaste = TO_TASTE.test(primary) || (num(primary) === null && TO_TASTE.test(fallback));
    const quantity = toTaste ? null : (num(primary) ?? num(fallback));

    // Keep the human note, plus any range text the number column could not hold.
    const notes = [];
    const marker = r.note.toLowerCase();
    if (r.note && !marker.startsWith("base ingredient") && !marker.startsWith("serving") && !marker.startsWith("yield")) {
      notes.push(r.note);
    }
    // Keep the sheet's own wording — "as needed" and "as per taste" differ.
    if (toTaste) notes.push((TO_TASTE.test(primary) ? primary : fallback).toLowerCase());
    else if (!useRecommended && r.recommended && num(r.recommended) === null) {
      notes.push(r.recommended.trim());
    }

    const unit = normalizeUnit(r.unit, r.name, quantity);
    const note = notes
      .map((n) => n.trim())
      .filter((n, i, all) => n && n.toLowerCase() !== unit && all.indexOf(n) === i)
      .join(" · ");

    return {
      name: titleCase(r.name),
      quantity: quantity === null ? null : Math.round(quantity * 10000) / 10000,
      unit: toTaste ? "" : unit,
      note,
      isBase: r.note.toLowerCase().startsWith("base ingredient"),
    };
  });

  if (!ingredients.some((i) => i.isBase)) {
    const first = ingredients.find((i) => i.quantity !== null && i.quantity > 0);
    if (first) first.isBase = true;
  }

  recipes.push({
    name: titleCase(title),
    description: "",
    servings,
    servingLabel,
    ingredients,
    steps: [],
  });
}

// ── write ───────────────────────────────────────────────────────────────────
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(recipes, null, 2) + "\n", "utf8");

console.log(`Read ${blocks.length} block(s) from ${source}`);
console.log(`Wrote ${recipes.length} recipe(s) to ${target}\n`);

for (const recipe of recipes) {
  const base = recipe.ingredients.find((i) => i.isBase);
  console.log(
    `  ${recipe.name.padEnd(24)} ${String(recipe.servings).padStart(3)} ${recipe.servingLabel.padEnd(9)} ` +
      `${String(recipe.ingredients.length).padStart(2)} ingredients` +
      (base ? `  base: ${base.name}` : "  (no base)"),
  );
}

if (skipped.length) {
  console.log("\nSkipped:");
  for (const reason of skipped) console.log(`  - ${reason}`);
}
