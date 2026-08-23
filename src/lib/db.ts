import { Redis } from "@upstash/redis";

/**
 * Thin key/value + sorted-set surface, so the app never talks to Upstash directly.
 *
 * When the Upstash env vars are missing we fall back to an in-process map so that
 * `npm run dev` works before a database exists. That fallback is per-process and
 * disappears on restart — it is never used on Vercel, where the vars are set.
 */
export interface Store {
  get<T>(key: string): Promise<T | null>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  set<T>(key: string, value: T): Promise<void>;
  setIfAbsent<T>(key: string, value: T): Promise<boolean>;
  del(key: string): Promise<void>;
  zadd(key: string, score: number, member: string): Promise<void>;
  zrem(key: string, member: string): Promise<void>;
  /** Members ordered by score, highest first. */
  zrangeDesc(key: string): Promise<string[]>;
}

class UpstashStore implements Store {
  constructor(private redis: Redis) {}

  async get<T>(key: string) {
    return this.redis.get<T>(key);
  }
  async mget<T>(keys: string[]) {
    if (keys.length === 0) return [];
    return this.redis.mget<(T | null)[]>(...keys);
  }
  async set<T>(key: string, value: T) {
    await this.redis.set(key, value as never);
  }
  async setIfAbsent<T>(key: string, value: T) {
    const res = await this.redis.set(key, value as never, { nx: true });
    return res === "OK";
  }
  async del(key: string) {
    await this.redis.del(key);
  }
  async zadd(key: string, score: number, member: string) {
    await this.redis.zadd(key, { score, member });
  }
  async zrem(key: string, member: string) {
    await this.redis.zrem(key, member);
  }
  async zrangeDesc(key: string) {
    return (await this.redis.zrange<string[]>(key, 0, -1, { rev: true })) ?? [];
  }
}

type MemoryGlobal = {
  kv: Map<string, unknown>;
  z: Map<string, Map<string, number>>;
};

const memoryGlobal = globalThis as unknown as { __recipeMemoryStore?: MemoryGlobal };

class MemoryStore implements Store {
  private data: MemoryGlobal;

  constructor() {
    this.data = memoryGlobal.__recipeMemoryStore ??= { kv: new Map(), z: new Map() };
  }

  async get<T>(key: string) {
    return (this.data.kv.get(key) as T) ?? null;
  }
  async mget<T>(keys: string[]) {
    return keys.map((k) => (this.data.kv.get(k) as T) ?? null);
  }
  async set<T>(key: string, value: T) {
    this.data.kv.set(key, value);
  }
  async setIfAbsent<T>(key: string, value: T) {
    if (this.data.kv.has(key)) return false;
    this.data.kv.set(key, value);
    return true;
  }
  async del(key: string) {
    this.data.kv.delete(key);
  }
  async zadd(key: string, score: number, member: string) {
    const set = this.data.z.get(key) ?? new Map<string, number>();
    set.set(member, score);
    this.data.z.set(key, set);
  }
  async zrem(key: string, member: string) {
    this.data.z.get(key)?.delete(member);
  }
  async zrangeDesc(key: string) {
    const set = this.data.z.get(key);
    if (!set) return [];
    return [...set.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
  }
}

let store: Store | undefined;
let warned = false;

export function db(): Store {
  if (store) return store;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    store = new UpstashStore(new Redis({ url, token }));
  } else {
    if (!warned) {
      warned = true;
      console.warn(
        "[db] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — using an in-memory store. " +
          "Data will not persist. Set them in .env.local (see .env.example).",
      );
    }
    store = new MemoryStore();
  }
  return store;
}

export const isPersistent = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// ── key layout ──────────────────────────────────────────────────────────────
export const keys = {
  userByEmail: (email: string) => `u:email:${email.trim().toLowerCase()}`,
  user: (id: string) => `u:${id}`,
  userRecipes: (id: string) => `u:${id}:recipes`,
  recipe: (id: string) => `r:${id}`,
};
