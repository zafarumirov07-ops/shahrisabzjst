import type { Metadata } from 'next';
import { RoleSelect } from '@/components/admin/SmallClient';
import { requireSuperAdmin, type AppRole } from '@/lib/admin/auth';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Foydalanuvchilar' };

export default async function UsersPage() {
  const { supabase, user } = await requireSuperAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
      <div className="card space-y-2 p-4 text-sm text-muted">
        <p>
          Yangi xodim qo‘shish: Supabase panelida <b>Authentication, Users, Add user</b> bo‘limi orqali email va parol bilan hisob yarating.
          Hisob bu yerda “Kutilmoqda” holatida paydo bo‘ladi, so‘ng unga rol bering.
        </p>
        <p>
          <b>Muharrir</b> — faqat asosiy sayt; <b>Ta’lim sifati muharriri</b> — faqat talimsifati subdomeni; <b>Bosh admin</b> — hammasi va shu bo‘lim.
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Foydalanuvchi</th>
              <th className="px-4 py-3">Qo‘shilgan</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id as string} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{(p.full_name as string) || '—'}</p>
                  <p className="text-xs text-muted">{p.email as string}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(p.created_at as string, 'uz')}</td>
                <td className="px-4 py-3">
                  <RoleSelect userId={p.id as string} role={p.role as AppRole} isSelf={p.id === user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
