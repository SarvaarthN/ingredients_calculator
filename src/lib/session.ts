import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { findUserById } from "./auth";
import type { SessionUser } from "./types";

const COOKIE = "rc_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (value && value.length >= 16) return new TextEncoder().encode(value);

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set (needs at least 16 characters).");
  }
  console.warn("[session] AUTH_SECRET not set — using an insecure development secret.");
  return new TextEncoder().encode("dev-only-insecure-secret-do-not-ship");
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or `null`. Safe to call from any server component. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub;
    if (!userId) return null;
    const user = await findUserById(userId);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}
