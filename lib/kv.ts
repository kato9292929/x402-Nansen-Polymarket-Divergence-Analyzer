import { kv } from "@vercel/kv";

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds });
  } catch (e) {
    console.error("KV cache error:", e);
  }
}
