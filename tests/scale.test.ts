import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import {
  applyFactor,
  baseIngredient,
  bulkDisplayUnits,
  factorByBaseIngredient,
  factorByServings,
  factorByYield,
  recipeTotalGrams,
} from "../src/lib/scale";
import type { Recipe } from "../src/lib/types";

const close = (actual: number | null, expected: number, tolerance = 0.001) => {
  assert.notEqual(actual, null, "expected a number, got null");
  assert.ok(
    Math.abs((actual as number) - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

/** Laadi Paav from MyRecipes1.xlsx, anchored on flour. */
const paav: Recipe = {
  id: "r1",
  userId: "u1",
  name: "Laadi Paav",
  servings: 1,
  servingLabel: "batch",
  createdAt: 0,
  updatedAt: 0,
  steps: [],
  ingredients: [
    { id: "i1", name: "Flour", quantity: 250, unit: "g", isBase: true },
    { id: "i2", name: "Yeast", quantity: 3.125, unit: "g" },
    { id: "i3", name: "Milk+water", quantity: 175, unit: "g" },
    { id: "i4", name: "Butter", quantity: 20, unit: "g" },
    { id: "i5", name: "Salt", quantity: 4.375, unit: "g" },
    { id: "i6", name: "Sugar", quantity: 17.5, unit: "g" },
  ],
};

/** A recipe mixing units and a to-taste line. */
const stock: Recipe = {
  id: "r2",
  userId: "u1",
  name: "Chicken Stock",
  servings: 4,
  servingLabel: "servings",
  createdAt: 0,
  updatedAt: 0,
  steps: [],
  ingredients: [
    { id: "j1", name: "Chicken bones", quantity: 1000, unit: "g", isBase: true },
    { id: "j2", name: "Olive oil", quantity: 30, unit: "ml" },
    { id: "j3", name: "Bay leaves", quantity: 2, unit: "" },
    { id: "j4", name: "Salt", quantity: null, unit: "" },
  ],
};

describe("baseIngredient", () => {
  test("prefers the flagged ingredient", () => {
    assert.equal(baseIngredient(paav)?.name, "Flour");
  });

  test("falls back to the first with a quantity", () => {
    const unflagged: Recipe = {
      ...paav,
      ingredients: paav.ingredients.map((i) => ({ ...i, isBase: false })),
    };
    assert.equal(baseIngredient(unflagged)?.name, "Flour");
  });
});

describe("§01 — by servings", () => {
  test("doubling doubles", () => {
    close(factorByServings(stock, 8), 2);
  });

  test("halving halves", () => {
    close(factorByServings(stock, 2), 0.5);
  });

  test("fractional headcounts work", () => {
    close(factorByServings(stock, 3), 0.75);
  });

  test("rejects nonsense", () => {
    assert.equal(factorByServings(stock, 0), null);
    assert.equal(factorByServings(stock, -2), null);
    assert.equal(factorByServings({ ...stock, servings: 0 }, 4), null);
  });
});

describe("§02 — by base ingredient", () => {
  test("same unit", () => {
    close(factorByBaseIngredient(paav, "i1", 500, "g").factor, 2);
    close(factorByBaseIngredient(paav, "i1", 125, "g").factor, 0.5);
  });

  test("converts the entered unit into the recipe's own", () => {
    // 1 kg of flour against a 250 g recipe.
    close(factorByBaseIngredient(paav, "i1", 1, "kg").factor, 4);
    // 2 cups of flour ≈ 250.8 g.
    close(factorByBaseIngredient(paav, "i1", 2, "cup").factor, 1.003, 0.005);
  });

  test("can anchor on a non-base ingredient", () => {
    close(factorByBaseIngredient(paav, "i4", 40, "g").factor, 2);
  });

  test("refuses an as-per-taste ingredient", () => {
    const result = factorByBaseIngredient(stock, "j4", 5, "g");
    assert.equal(result.factor, null);
    assert.match(result.error ?? "", /no fixed quantity/);
  });

  test("refuses impossible unit pairs", () => {
    const result = factorByBaseIngredient(stock, "j3", 100, "g");
    assert.equal(result.factor, null);
    assert.match(result.error ?? "", /Cannot convert/);
  });

  test("refuses an unknown ingredient", () => {
    assert.equal(factorByBaseIngredient(paav, "nope", 1, "g").factor, null);
  });
});

describe("§03 — by output", () => {
  test("the recipe totals its weighable ingredients", () => {
    close(recipeTotalGrams(paav).grams, 470);
  });

  test("counted ingredients are left out of the total and reported", () => {
    const { grams, unweighable } = recipeTotalGrams(stock);
    close(grams, 1000 + 30 * 0.918, 0.01); // bones + olive oil by density
    assert.deepEqual(unweighable, ["Bay leaves"]);
  });

  test("scales to a requested weight", () => {
    close(factorByYield(paav, 940, "g").factor, 2);
    close(factorByYield(paav, 0.94, "kg").factor, 2);
  });

  test("rejects a count unit for the output", () => {
    const result = factorByYield(paav, 5, "piece");
    assert.equal(result.factor, null);
    assert.match(result.error ?? "", /weight or volume/);
  });

  test("rejects a recipe with nothing weighable", () => {
    const countOnly: Recipe = {
      ...paav,
      ingredients: [{ id: "x", name: "Bay leaves", quantity: 3, unit: "" }],
    };
    const result = factorByYield(countOnly, 100, "g");
    assert.equal(result.factor, null);
    assert.match(result.error ?? "", /no weighable ingredients/);
  });
});

describe("bulkDisplayUnits — changing the whole column at once", () => {
  test("puts every convertible ingredient into the target unit", () => {
    const { units } = bulkDisplayUnits(paav, "cup");
    assert.deepEqual(units, { i1: "cup", i2: "cup", i3: "cup", i4: "cup", i5: "cup", i6: "cup" });
  });

  test("mixed source units all reach a common weight unit", () => {
    const { units, keptOriginal } = bulkDisplayUnits(stock, "oz");
    // Grams and millilitres both convert to ounces…
    assert.equal(units.j1, "oz");
    assert.equal(units.j2, "oz");
    // …bay leaves cannot, so they are left out and reported.
    assert.equal(units.j3, undefined);
    assert.deepEqual(keptOriginal, ["Bay leaves"]);
  });

  test("as-per-taste rows are never given a display unit", () => {
    const { units, keptOriginal } = bulkDisplayUnits(stock, "g");
    assert.equal(units.j4, undefined);
    assert.ok(!keptOriginal.includes("Salt"));
  });

  test("the empty target clears every override", () => {
    const { units, keptOriginal } = bulkDisplayUnits(paav, "");
    assert.deepEqual(units, {});
    assert.deepEqual(keptOriginal, []);
  });

  test("feeding the map to applyFactor converts the whole list", () => {
    const { units } = bulkDisplayUnits(paav, "oz");
    const result = applyFactor(paav, 1, units);

    for (const ing of result.ingredients) {
      assert.equal(ing.displayUnit, "oz");
    }
    // 250 g of flour is 8.82 oz.
    close(result.ingredients[0].displayValue, 250 / 28.349523125, 0.001);
  });

  test("rows that keep their unit still show a real number, not n/a", () => {
    const { units } = bulkDisplayUnits(stock, "oz");
    const result = applyFactor(stock, 1, units);
    const bay = result.ingredients.find((i) => i.id === "j3")!;

    assert.equal(bay.displayUnit, "");
    close(bay.displayValue, 2);
  });

  test("a per-row override survives on top of a bulk choice", () => {
    const { units } = bulkDisplayUnits(paav, "cup");
    const result = applyFactor(paav, 1, { ...units, i2: "tsp" });

    assert.equal(result.ingredients.find((i) => i.id === "i1")!.displayUnit, "cup");
    assert.equal(result.ingredients.find((i) => i.id === "i2")!.displayUnit, "tsp");
  });
});

describe("applyFactor", () => {
  test("scales every fixed quantity and leaves to-taste alone", () => {
    const result = applyFactor(stock, 2);
    const byName = Object.fromEntries(result.ingredients.map((i) => [i.name, i]));

    close(byName["Chicken bones"].scaled, 2000);
    close(byName["Olive oil"].scaled, 60);
    close(byName["Bay leaves"].scaled, 4);
    assert.equal(byName["Salt"].scaled, null);
  });

  test("the flour ratios of the source spreadsheet survive scaling", () => {
    const result = applyFactor(paav, 4); // 1 kg of flour
    const byName = Object.fromEntries(result.ingredients.map((i) => [i.name, i]));

    close(byName["Flour"].scaled, 1000);
    close(byName["Yeast"].scaled, 12.5); // 1.25% of flour
    close(byName["Milk+water"].scaled, 700); // 70%
    close(byName["Salt"].scaled, 17.5); // 1.75%
  });

  test("per-row display units convert without changing the underlying amount", () => {
    const result = applyFactor(paav, 1, { i1: "cup", i2: "tsp" });
    const flour = result.ingredients.find((i) => i.id === "i1")!;
    const yeast = result.ingredients.find((i) => i.id === "i2")!;

    close(flour.scaled, 250);
    close(flour.displayValue, 250 / (0.53 * 236.5882365), 0.001);
    assert.equal(flour.displayUnit, "cup");
    close(yeast.displayValue, 3.125 / 0.65 / 4.92892159375, 0.001);
  });

  test("a display unit that cannot be reached yields null rather than a wrong number", () => {
    const result = applyFactor(stock, 1, { j3: "g" });
    assert.equal(result.ingredients.find((i) => i.id === "j3")!.displayValue, null);
  });

  test("the scaled total tracks the factor", () => {
    const single = recipeTotalGrams(paav).grams!;
    close(applyFactor(paav, 3).totalGrams, single * 3, 0.01);
  });
});
