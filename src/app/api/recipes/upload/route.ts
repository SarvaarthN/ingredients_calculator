import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createRecipe } from "@/lib/recipes";
import { ExtractError, MAX_UPLOAD_BYTES, extractRecipes } from "@/lib/recipe-extract";

export const runtime = "nodejs";
// Reading a long PDF can take Gemini a while.
export const maxDuration = 60;

/**
 * Read an uploaded PDF / Word file and save the recipes in it.
 * The file is only held in memory for this request; it is never stored.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    return NextResponse.json({ error: "The upload did not come through. Try again." }, { status: 400 });
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That file is larger than 4 MB. Try a smaller copy." }, { status: 413 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const inputs = await extractRecipes(bytes, file.name);

    const saved = [];
    for (const input of inputs) {
      const recipe = await createRecipe(user.id, input);
      saved.push({ id: recipe.id, name: recipe.name, ingredients: recipe.ingredients.length });
    }
    return NextResponse.json({ recipes: saved }, { status: 201 });
  } catch (err) {
    if (err instanceof ExtractError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[upload] failed", err);
    return NextResponse.json({ error: "Something went wrong reading that file." }, { status: 500 });
  }
}
