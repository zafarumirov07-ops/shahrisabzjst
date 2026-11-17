import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

/**
 * Admin panel uchun MAXFIY kalitli klient. Faqat serverda ishlaydi (brauzerga chiqmaydi) va RLS ni chetlab o'tadi,
 * shuning uchun huquqlar (qaysi sayt, qaysi rol) kod ichida (lib/admin/auth.ts, app/admin/actions.ts) tekshiriladi.
 */
export function adminDbConfigured(): boolean {
  return Boolean(SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error('SUPABASE_SECRET_KEY o‘rnatilmagan (Vercel, Environment Variables).');
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
