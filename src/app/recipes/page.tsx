import Link from "next/link";
import type { Metadata } from "next";
import { ImportStarterButton } from "@/components/ImportStarterButton";
import { RecipeList, type RecipeSummary } from "@/components/RecipeList";
import seedData from "@/data/seed-recipes.json";
import { requireUser } from "@/lib/guard";
import { listRecipes } from "@/lib/recipes";
import { baseIngredient, recipeTotalGrams } from "@/lib/scale";
import { formatGrams } from "@/lib/format";
import { isPersistent } from "@/lib/db";

export const metadata: Metadata = { title: "Your recipes" };
export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const user = await requireUser("/recipes");
  const recipes = await listRecipes(user.id);

  const summaries: RecipeSummary[] = recipes.map((recipe) => {
    const { grams } = recipeTotalGrams(recipe);
    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      servings: recipe.servings,
      servingLabel: recipe.servingLabel,
      ingredientCount: recipe.ingredients.length,
      totalWeight: grams === null ? null : formatGrams(grams),
      baseName: baseIngredient(recipe)?.name,
      ingredientNames: recipe.ingredients.map((i) => i.name.toLowerCase()),
      // Recipes saved before createdAt existed fall back to their edit time.
      createdAt: recipe.createdAt ?? recipe.updatedAt,
      updatedAt: recipe.updatedAt,
    };
  });

  const saved = new Set(recipes.map((r) => r.name.trim().toLowerCase()));
  const missingFromSheet = seedData.filter((r) => !saved.has(r.name.trim().toLowerCase())).length;

  return (
    <div className="shell py-12 md:py-16">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">
            <span className="numeral">№</span> Your book
          </p>
          <h1 className="font-display text-[36px] leading-tight md:text-[44px]">Recipes</h1>
          <p className="mt-2 text-[15px] text-muted">
            {recipes.length === 0
              ? "Nothing saved yet."
              : `${recipes.length} recipe${recipes.length === 1 ? "" : "s"} saved.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {missingFromSheet > 0 && recipes.length > 0 && (
            <ImportStarterButton
              count={missingFromSheet}
              className="btn btn-outline"
              label={`Import ${missingFromSheet} from spreadsheet`}
            />
          )}
          <Link href="/recipes/upload" className="btn btn-outline">
            Upload a file
          </Link>
          <Link href="/recipes/new" className="btn btn-accent">
            Add a recipe
          </Link>
        </div>
      </div>

      {!isPersistent() && (
        <p className="notice mb-8">
          <strong>Development storage.</strong> No Upstash credentials are configured, so recipes are
          held in memory and will vanish when the server restarts. Add{" "}
          <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> to{" "}
          <code>.env.local</code> to persist them.
        </p>
      )}

      {recipes.length === 0 ? (
        <div className="card card-pad text-center py-16">
          <h2 className="font-display text-[26px]">Start with one recipe</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted">
            Add the ingredients with their quantities, say how many people it feeds, and mark the base
            ingredient. Scaling comes free after that.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/recipes/new" className="btn btn-accent inline-flex">
                Add your first recipe
              </Link>
              <Link href="/recipes/upload" className="btn btn-outline inline-flex">
                Upload a PDF or Word file
              </Link>
            </div>
            <span className="text-[12px] uppercase tracking-[0.14em] text-muted">or</span>
            <ImportStarterButton count={seedData.length} />
          </div>
        </div>
      ) : (
        <RecipeList recipes={summaries} />
      )}
    </div>
  );
}
