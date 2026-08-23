import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createRecipe, listRecipes, recipeInputSchema } from "@/lib/recipes";
import seedData from "@/data/seed-recipes.json";

export const runtime = "nodejs";

/**
 * Load the recipes imported from MyRecipes1.xlsx into the signed-in account.
 * Safe to run twice — recipes whose name is already saved are skipped.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const existing = new Set((await listRecipes(user.id)).map((r) => r.name.trim().toLowerCase()));

  let added = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const source of seedData) {
    if (existing.has(source.name.trim().toLowerCase())) {
      skipped++;
      continue;
    }

    const parsed = recipeInputSchema.safeParse(source);
    if (!parsed.success) {
      failed.push(source.name);
      continue;
    }

    await createRecipe(user.id, parsed.data);
    added++;
  }

  return NextResponse.json({ added, skipped, failed });
}
