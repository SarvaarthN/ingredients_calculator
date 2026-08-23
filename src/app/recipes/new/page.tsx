import Link from "next/link";
import type { Metadata } from "next";
import { RecipeForm } from "@/components/RecipeForm";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Add a recipe" };
export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
  await requireUser("/recipes/new");

  return (
    <div className="shell max-w-[860px] py-12 md:py-16">
      <Link href="/recipes" className="link-quiet text-[13.5px]">
        ← Back to recipes
      </Link>

      <div className="mb-10 mt-4">
        <p className="eyebrow mb-3">
          <span className="numeral">№</span> New
        </p>
        <h1 className="font-display text-[36px] leading-tight md:text-[44px]">Add a recipe</h1>
        <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-muted">
          Write it out once, at whatever size you normally cook it. The three scaling modes work off
          what you enter here.
        </p>
      </div>

      <RecipeForm />
    </div>
  );
}
