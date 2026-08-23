import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, keys } from "./db";
import type { Recipe } from "./types";
import { normalizeUnit } from "./units";

export const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Ingredient needs a name").max(120),
  quantity: z
    .union([z.number(), z.null()])
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Quantity must be zero or more"),
  unit: z.string().max(20).default(""),
  note: z.string().trim().max(200).optional().default(""),
  isBase: z.boolean().optional().default(false),
});

export const recipeInputSchema = z.object({
  name: z.string().trim().min(1, "Give the recipe a name").max(140),
  description: z.string().trim().max(500).optional().default(""),
  servings: z
    .number()
    .refine((v) => Number.isFinite(v) && v > 0, "Tell us how many this recipe is written for"),
  servingLabel: z.string().trim().min(1).max(30).default("people"),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
  steps: z.array(z.string().trim().max(2000)).default([]),
});

export type RecipeInput = z.input<typeof recipeInputSchema>;

type ParsedInput = z.output<typeof recipeInputSchema>;

/**
 * Normalise units, give every ingredient a stable id, and make sure exactly one
 * ingredient is flagged as the base.
 */
function buildIngredients(input: ParsedInput): Recipe["ingredients"] {
  const ingredients = input.ingredients.map((ing) => ({
    id: ing.id || randomUUID(),
    name: ing.name,
    quantity: ing.quantity,
    unit: normalizeUnit(ing.unit),
    note: ing.note || undefined,
    isBase: false,
  }));

  const requested = input.ingredients.findIndex((i) => i.isBase);
  const fallback = ingredients.findIndex((i) => i.quantity !== null && i.quantity > 0);
  const baseIndex = requested >= 0 ? requested : fallback;
  if (baseIndex >= 0) ingredients[baseIndex].isBase = true;

  return ingredients;
}

export async function listRecipes(userId: string): Promise<Recipe[]> {
  const ids = await db().zrangeDesc(keys.userRecipes(userId));
  if (ids.length === 0) return [];
  const rows = await db().mget<Recipe>(ids.map(keys.recipe));
  return rows.filter((r): r is Recipe => r !== null);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  return db().get<Recipe>(keys.recipe(id));
}

/** Fetch a recipe only if it belongs to `userId`. */
export async function getOwnedRecipe(userId: string, id: string): Promise<Recipe | null> {
  const recipe = await getRecipe(id);
  return recipe && recipe.userId === userId ? recipe : null;
}

export async function createRecipe(userId: string, input: ParsedInput): Promise<Recipe> {
  const now = Date.now();
  const recipe: Recipe = {
    id: randomUUID(),
    userId,
    name: input.name,
    description: input.description || undefined,
    servings: input.servings,
    servingLabel: input.servingLabel,
    ingredients: buildIngredients(input),
    steps: input.steps.map((s) => s.trim()).filter(Boolean),
    createdAt: now,
    updatedAt: now,
  };

  await db().set(keys.recipe(recipe.id), recipe);
  await db().zadd(keys.userRecipes(userId), now, recipe.id);
  return recipe;
}

export async function updateRecipe(
  userId: string,
  id: string,
  input: ParsedInput,
): Promise<Recipe | null> {
  const existing = await getOwnedRecipe(userId, id);
  if (!existing) return null;

  const updated: Recipe = {
    ...existing,
    name: input.name,
    description: input.description || undefined,
    servings: input.servings,
    servingLabel: input.servingLabel,
    ingredients: buildIngredients(input),
    steps: input.steps.map((s) => s.trim()).filter(Boolean),
    updatedAt: Date.now(),
  };

  await db().set(keys.recipe(id), updated);
  await db().zadd(keys.userRecipes(userId), updated.updatedAt, id);
  return updated;
}

export async function deleteRecipe(userId: string, id: string): Promise<boolean> {
  const existing = await getOwnedRecipe(userId, id);
  if (!existing) return false;
  await db().del(keys.recipe(id));
  await db().zrem(keys.userRecipes(userId), id);
  return true;
}
