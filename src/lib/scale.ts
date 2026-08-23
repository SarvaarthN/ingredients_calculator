import type { Ingredient, Recipe } from "./types";
import { convert, toGrams, unitKind } from "./units";

export interface ScaledIngredient extends Ingredient {
  /** Scaled quantity in the recipe's own unit. `null` for "as per taste". */
  scaled: number | null;
  /** Scaled quantity converted into `displayUnit`. */
  displayValue: number | null;
  displayUnit: string;
}

export interface ScaleResult {
  factor: number;
  ingredients: ScaledIngredient[];
  /** Total weight of the scaled recipe in grams, or `null` if nothing converts. */
  totalGrams: number | null;
  /** Ingredients that could not be weighed (counts with no density). */
  unweighable: string[];
  /** Human-readable reason the factor could not be worked out. */
  error?: string;
}

export function baseIngredient(recipe: Recipe): Ingredient | undefined {
  return recipe.ingredients.find((i) => i.isBase) ?? recipe.ingredients.find((i) => i.quantity !== null);
}

/** Total weight of the recipe as written, in grams. */
export function recipeTotalGrams(recipe: Recipe): { grams: number | null; unweighable: string[] } {
  let total = 0;
  let counted = 0;
  const unweighable: string[] = [];
  for (const ing of recipe.ingredients) {
    if (ing.quantity === null) continue;
    const g = toGrams(ing.quantity, ing.unit, ing.name);
    if (g === null) {
      unweighable.push(ing.name);
      continue;
    }
    total += g;
    counted += 1;
  }
  return { grams: counted > 0 ? total : null, unweighable };
}

/** Section 1 — scale to a number of people. */
export function factorByServings(recipe: Recipe, targetServings: number): number | null {
  if (!recipe.servings || recipe.servings <= 0) return null;
  if (!Number.isFinite(targetServings) || targetServings <= 0) return null;
  return targetServings / recipe.servings;
}

/** Section 2 — scale from however much of the base ingredient you actually have. */
export function factorByBaseIngredient(
  recipe: Recipe,
  ingredientId: string,
  targetQty: number,
  targetUnit: string,
): { factor: number | null; error?: string } {
  const ing = recipe.ingredients.find((i) => i.id === ingredientId);
  if (!ing) return { factor: null, error: "Pick a base ingredient." };
  if (ing.quantity === null || ing.quantity <= 0) {
    return { factor: null, error: `"${ing.name}" has no fixed quantity to scale from.` };
  }
  if (!Number.isFinite(targetQty) || targetQty <= 0) return { factor: null };

  const inRecipeUnit = convert(targetQty, targetUnit, ing.unit, { ingredient: ing.name });
  if (inRecipeUnit === null) {
    return {
      factor: null,
      error: `Cannot convert ${targetUnit || "that unit"} to the recipe's ${ing.unit || "count"} for ${ing.name}.`,
    };
  }
  return { factor: inRecipeUnit / ing.quantity };
}

/** Section 3 — scale to a target amount of finished output. */
export function factorByYield(
  recipe: Recipe,
  targetQty: number,
  targetUnit: string,
): { factor: number | null; error?: string; baseGrams: number | null } {
  const { grams: baseGrams } = recipeTotalGrams(recipe);
  if (baseGrams === null || baseGrams <= 0) {
    return { factor: null, baseGrams, error: "This recipe has no weighable ingredients to total up." };
  }
  if (!Number.isFinite(targetQty) || targetQty <= 0) return { factor: null, baseGrams };

  const targetGrams =
    unitKind(targetUnit) === "count" ? null : convert(targetQty, targetUnit, "g", { ingredient: recipe.name });
  if (targetGrams === null) {
    return { factor: null, baseGrams, error: "Choose a weight or volume unit for the output." };
  }
  return { factor: targetGrams / baseGrams, baseGrams };
}

/** Apply a factor to every ingredient, optionally showing each in a different unit. */
export function applyFactor(
  recipe: Recipe,
  factor: number,
  displayUnits: Record<string, string> = {},
): ScaleResult {
  const unweighable: string[] = [];
  let total = 0;
  let counted = 0;

  const ingredients: ScaledIngredient[] = recipe.ingredients.map((ing) => {
    const scaled = ing.quantity === null ? null : ing.quantity * factor;
    const displayUnit = displayUnits[ing.id] ?? ing.unit;
    const displayValue =
      scaled === null
        ? null
        : displayUnit === ing.unit
          ? scaled
          : convert(scaled, ing.unit, displayUnit, { ingredient: ing.name });

    if (scaled !== null) {
      const g = toGrams(scaled, ing.unit, ing.name);
      if (g === null) unweighable.push(ing.name);
      else {
        total += g;
        counted += 1;
      }
    }

    return { ...ing, scaled, displayValue, displayUnit };
  });

  return {
    factor,
    ingredients,
    totalGrams: counted > 0 ? total : null,
    unweighable,
  };
}
