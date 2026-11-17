import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_KEY, SUPABASE_URL } from './env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Admin so'rovlarida Supabase sessiyasini (cookie) yangilab turadi. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Muhim: createServerClient va getUser orasida boshqa kod yozilmasin.
  await supabase.auth.getUser();
  return response;
}
