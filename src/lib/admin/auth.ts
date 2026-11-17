import { redirect } from 'next/navigation';
import { adminLoginConfigured, readSession } from '@/lib/admin/session';
import type { AppRole } from '@/lib/admin/roles';
import { adminDbConfigured, createAdminClient } from '@/lib/supabase/admin';
import type { Site } from '@/lib/site';

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
  if (!adminLoginConfigured() || !adminDbConfigured()) redirect('/admin/login');
  const session = await readSession();
  if (!session) redirect('/admin/login');

  return {
    supabase: createAdminClient(),
    user: { id: session.login },
    profile: { id: session.login, email: session.login, full_name: session.login, role: session.role } as Profile,
  };
}

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
