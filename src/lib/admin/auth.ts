import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Site } from '@/lib/site';

import type { AppRole } from '@/lib/admin/roles';

export { ROLE_LABELS, type AppRole } from '@/lib/admin/roles';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

export function allowedSites(role: AppRole): Site[] {
  if (role === 'super_admin') return ['main', 'talimsifati'];
  if (role === 'editor') return ['main'];
  if (role === 'quality_editor') return ['talimsifati'];
  return [];
}

export function isStaffRole(role: AppRole): boolean {
  return role === 'editor' || role === 'quality_editor' || role === 'super_admin';
}

/** Kirmagan foydalanuvchi /admin/login ga yo'naltiriladi. */
export async function getSessionProfile() {
  // Supabase hali ulanmagan bo'lsa, login sahifasi tushuntirish ko'rsatadi
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect('/admin/login');
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile ?? { id: user.id, email: user.email ?? null, full_name: null, role: 'pending' }) as Profile,
  };
}

/** Faqat xodimlar (pending emas) uchun. Huquqsiz foydalanuvchi bosh sahifaga qaytariladi. */
export async function requireStaff() {
  const ctx = await getSessionProfile();
  if (!isStaffRole(ctx.profile.role)) redirect('/admin');
  return ctx;
}

export async function requireSuperAdmin() {
  const ctx = await getSessionProfile();
  if (ctx.profile.role !== 'super_admin') redirect('/admin');
  return ctx;
}
