import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createRecipe, listRecipes, recipeInputSchema } from "@/lib/recipes";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const recipes = await listRecipes(user.id);
  return NextResponse.json({ recipes });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = recipeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid recipe" }, { status: 400 });
  }

  const recipe = await createRecipe(user.id, parsed.data);
  return NextResponse.json({ recipe }, { status: 201 });
}
