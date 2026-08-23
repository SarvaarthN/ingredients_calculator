import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db, keys } from "./db";
import type { User } from "./types";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = (stored ?? "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LEN) return false;
  const derived = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LEN);
  return timingSafeEqual(derived, expected);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const id = await db().get<string>(keys.userByEmail(email));
  if (!id) return null;
  return db().get<User>(keys.user(id));
}

export async function findUserById(id: string): Promise<User | null> {
  return db().get<User>(keys.user(id));
}

export type CreateUserResult =
  | { ok: true; user: User }
  | { ok: false; error: "email_taken" };

export async function createUser(
  email: string,
  password: string,
  name: string,
): Promise<CreateUserResult> {
  const normalized = normalizeEmail(email);
  const id = randomUUID();

  // Claim the email first — this is the uniqueness guard.
  const claimed = await db().setIfAbsent(keys.userByEmail(normalized), id);
  if (!claimed) return { ok: false, error: "email_taken" };

  const user: User = {
    id,
    email: normalized,
    name: name.trim() || normalized.split("@")[0],
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };
  await db().set(keys.user(id), user);
  return { ok: true, user };
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    // Keep the timing of a missing user close to that of a wrong password.
    await hashPassword(password);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}
