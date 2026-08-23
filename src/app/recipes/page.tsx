import Link from "next/link";
import type { Metadata } from "next";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";
import { ImportStarterButton } from "@/components/ImportStarterButton";
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
              : `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}, most recently edited first.`}
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
            <Link href="/recipes/new" className="btn btn-accent inline-flex">
              Add your first recipe
            </Link>
            <span className="text-[12px] uppercase tracking-[0.14em] text-muted">or</span>
            <ImportStarterButton count={seedData.length} />
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const base = baseIngredient(recipe);
            const { grams } = recipeTotalGrams(recipe);
            const counted = recipe.ingredients.length;

            return (
              <li key={recipe.id} className="card card-link flex flex-col">
                <Link href={`/recipes/${recipe.id}`} className="card-pad flex-1">
                  <h2 className="font-display text-[24px] leading-tight">{recipe.name}</h2>
                  {recipe.description && (
                    <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">
                      {recipe.description}
                    </p>
                  )}

                  <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
                    <div className="flex gap-1.5">
                      <dt className="sr-only">Written for</dt>
                      <dd className="tnum">
                        {recipe.servings} {recipe.servingLabel}
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="sr-only">Ingredients</dt>
                      <dd className="tnum">
                        {counted} ingredient{counted === 1 ? "" : "s"}
                      </dd>
                    </div>
                    {grams !== null && (
                      <div className="flex gap-1.5">
                        <dt className="sr-only">Total weight</dt>
                        <dd className="tnum">{formatGrams(grams)} total</dd>
                      </div>
                    )}
                  </dl>

                  {base && (
                    <p className="mt-4">
                      <span className="chip chip-accent">Base · {base.name}</span>
                    </p>
                  )}
                </Link>

                <div className="flex items-center gap-2 border-t border-line px-5 py-3">
                  <Link href={`/recipes/${recipe.id}`} className="btn btn-ghost btn-sm">
                    Scale
                  </Link>
                  <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-ghost btn-sm">
                    Edit
                  </Link>
                  <span className="flex-1" />
                  <DeleteRecipeButton id={recipe.id} name={recipe.name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
