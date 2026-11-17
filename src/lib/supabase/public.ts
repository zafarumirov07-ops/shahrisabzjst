import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Ommaviy sahifalar uchun cookie ishlatmaydigan (anon) klient.
 * Cookie o'qilmagani uchun sahifalar ISR bilan keshlanadi.
 * Supabase sozlanmagan bo'lsa null qaytaradi, sayt bo'sh holatda ham ochiladi.
 */
let cached: SupabaseClient | null | undefined;

export const PUBLIC_REVALIDATE_SECONDS = 60;

export function createPublicClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    cached = null;
    return cached;
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }),
    },
  });
  return cached;
}
