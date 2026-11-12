import Link from "next/link";
import type { Metadata } from "next";
import { RecipeUpload } from "@/components/RecipeUpload";
import { requireUser } from "@/lib/guard";
import { isAiConfigured } from "@/lib/recipe-extract";

export const metadata: Metadata = { title: "Upload a recipe" };
export const dynamic = "force-dynamic";

export default async function UploadRecipePage() {
  await requireUser("/recipes/upload");

  return (
    <div className="shell max-w-[860px] py-12 md:py-16">
      <Link href="/recipes" className="link-quiet text-[13.5px]">
        ← Back to recipes
      </Link>

      <div className="mb-10 mt-4">
        <p className="eyebrow mb-3">
          <span className="numeral">№</span> Upload
        </p>
        <h1 className="font-display text-[36px] leading-tight md:text-[44px]">Upload a recipe</h1>
        <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-muted">
          Give it a PDF or Word document in any layout: a table, a list, a scanned page, or several
          recipes in one file. The ingredients, quantities, servings and method are read out and saved
          as recipes you can scale. Check each one afterwards and tidy anything with{" "}
          <em>Edit</em>.
        </p>
      </div>

      {isAiConfigured() ? (
        <RecipeUpload />
      ) : (
        <p className="notice">
          <strong>Not set up yet.</strong> Add a free <code>GEMINI_API_KEY</code> from Google AI Studio
          to the environment variables to turn on recipe upload.
        </p>
      )}

      <p className="mt-8 text-[13px] leading-relaxed text-muted">
        The file is read once and then discarded. Only the recipe is saved, never the file.
        Prefer typing it?{" "}
        <Link href="/recipes/new" className="link">
          Add a recipe by hand
        </Link>
        .
      </p>
    </div>
  );
}
