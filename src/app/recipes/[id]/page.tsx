import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RecipeScaler } from "@/components/RecipeScaler";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";
import { PrintButton } from "@/components/PrintButton";
import { requireUser } from "@/lib/guard";
import { getOwnedRecipe } from "@/lib/recipes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser(`/recipes/${id}`);
  const recipe = await getOwnedRecipe(user.id, id);
  return { title: recipe?.name ?? "Recipe" };
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/recipes/${id}`);
  const recipe = await getOwnedRecipe(user.id, id);
  if (!recipe) notFound();

  return (
    <div className="shell py-12 md:py-16">
      <Link href="/recipes" className="link-quiet text-[13.5px] no-print">
        ← All recipes
      </Link>

      <header className="mb-10 mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[620px]">
          <p className="eyebrow mb-3">
            <span className="numeral">№</span> Written for {recipe.servings} {recipe.servingLabel}
          </p>
          <h1 className="font-display text-[38px] leading-[1.08] md:text-[50px]">{recipe.name}</h1>
          {recipe.description && (
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{recipe.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <PrintButton />
          <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-outline btn-sm">
            Edit
          </Link>
          <DeleteRecipeButton id={recipe.id} name={recipe.name} redirectTo="/recipes" />
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <RecipeScaler recipe={recipe} />

        <aside>
          <p className="eyebrow mb-4">
            <span className="numeral">№</span> Adding procedure
          </p>

          {recipe.steps.length === 0 ? (
            <div className="panel-quiet card-pad">
              <p className="text-[14px] leading-relaxed text-muted">
                No method saved for this recipe yet.
              </p>
              <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-outline btn-sm mt-4 no-print">
                Add the steps
              </Link>
            </div>
          ) : (
            <ol className="flex flex-col gap-5">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="numeral shrink-0 tnum pt-0.5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14.5px] leading-[1.65] text-ink-2">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
