import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { deleteRecipe, getOwnedRecipe, recipeInputSchema, updateRecipe } from "@/lib/recipes";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const recipe = await getOwnedRecipe(user.id, id);
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  return NextResponse.json({ recipe });
}

export async function PUT(req: Request, { params }: Ctx) {
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

  const { id } = await params;
  const recipe = await updateRecipe(user.id, id, parsed.data);
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  return NextResponse.json({ recipe });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const removed = await deleteRecipe(user.id, id);
  if (!removed) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
