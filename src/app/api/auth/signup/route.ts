import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const result = await createUser(email, password, name);
  if (!result.ok) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  await createSession(result.user.id);
  return NextResponse.json({ ok: true });
}
