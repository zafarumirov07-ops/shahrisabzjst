import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_KEY, SUPABASE_URL } from './env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Foydalanuvchi sessiyasi bilan ishlaydigan server klienti (admin panel uchun). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL!,
    SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component ichidan chaqirilganda cookie yozib bo'lmaydi; middleware yangilaydi.
          }
        },
      },
    },
  );
}
