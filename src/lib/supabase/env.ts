/**
 * Supabase sozlamalari. Yangi "publishable" kalit ham, eski "anon" kalit ham qabul qilinadi.
 * Eslatma: NEXT_PUBLIC_* o'zgaruvchilar brauzerga chiqadi, shuning uchun bu yerga faqat
 * ochiq (publishable/anon) kalit qo'yiladi. "secret" / "service_role" kalit hech qachon bu yerda bo'lmasin.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY);
