import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RecipeForm } from "@/components/RecipeForm";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";
import { requireUser } from "@/lib/guard";
import { getOwnedRecipe } from "@/lib/recipes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser(`/recipes/${id}/edit`);
  const recipe = await getOwnedRecipe(user.id, id);
  return { title: recipe ? `Edit ${recipe.name}` : "Edit recipe" };
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/recipes/${id}/edit`);
  const recipe = await getOwnedRecipe(user.id, id);
  if (!recipe) notFound();

  return (
    <div className="shell max-w-[860px] py-12 md:py-16">
      <Link href={`/recipes/${recipe.id}`} className="link-quiet text-[13.5px]">
        ← Back to {recipe.name}
      </Link>

      <div className="mb-10 mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">
            <span className="numeral">№</span> Modify
          </p>
          <h1 className="font-display text-[36px] leading-tight md:text-[44px]">{recipe.name}</h1>
        </div>
        <DeleteRecipeButton
          id={recipe.id}
          name={recipe.name}
          className="btn btn-danger"
          label="Delete recipe"
          redirectTo="/recipes"
        />
      </div>

      <RecipeForm recipe={recipe} />
    </div>
  );
}
