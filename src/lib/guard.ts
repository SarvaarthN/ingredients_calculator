import { redirect } from "next/navigation";
import { getSessionUser } from "./session";
import type { SessionUser } from "./types";

/** Server-component guard: returns the user or sends them to sign in and back. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
