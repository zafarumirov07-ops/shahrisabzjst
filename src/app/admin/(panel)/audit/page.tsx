import type { Metadata } from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { requireSuperAdmin } from '@/lib/admin/auth';
import { formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Tahrir tarixi' };

const TABLES: Record<string, string> = {
  posts: 'Postlar',
  post_media: 'Post biriktirmalari',
  pages: 'Sahifalar',
  staff: 'Jamoa',
  departments: "Bo'limlar",
  programs: "Qabul yo'nalishlari",
  events: 'Tadbirlar',
  albums: 'Albomlar',
  album_items: 'Albom elementlari',
  site_settings: 'Sayt sozlamalari',
  profiles: 'Foydalanuvchilar',
  media: 'Media',
};

const ACTION: Record<string, { label: string; cls: string }> = {
  INSERT: { label: 'Yaratildi', cls: '!bg-emerald-500/15 !text-emerald-700' },
  UPDATE: { label: "O'zgartirildi", cls: '!bg-sky-500/15 !text-sky-700' },
  DELETE: { label: "O'chirildi", cls: '!bg-red-500/15 !text-red-700' },
};

type Json = Record<string, unknown> | null;

function short(v: unknown): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 160 ? `${s.slice(0, 160)}…` : s;
}

function changes(oldData: Json, newData: Json): Array<{ key: string; from: string; to: string }> {
  const out: Array<{ key: string; from: string; to: string }> = [];
  const keys = new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]);
  for (const key of keys) {
    if (key === 'updated_at') continue;
    const a = oldData?.[key];
    const b = newData?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ key, from: short(a ?? '—'), to: short(b ?? '—') });
  }
  return out;
}

function label(table: string, row: Json): string {
  if (!row) return '';
  const t = row.title ?? row.name ?? row.full_name ?? row.email;
  if (t && typeof t === 'object') return String((t as Record<string, string>).uz ?? '');
  return t ? String(t) : '';
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const { supabase } = await requireSuperAdmin();
  const { table } = await searchParams;

  let q = supabase.from('audit_log').select('*').order('at', { ascending: false }).limit(200);
  if (table && table in TABLES) q = q.eq('table_name', table);
  const { data, error } = await q;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Tahrir tarixi</h1>
      <p className="text-sm text-muted">Kim, qachon va nimani o‘zgartirgani (oxirgi 200 ta amal).</p>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/audit" className={!table ? 'btn !py-1' : 'btn-outline !py-1'}>
          Barchasi
        </Link>
        {Object.entries(TABLES).map(([k, v]) => (
          <Link key={k} href={`/admin/audit?table=${k}`} className={table === k ? 'btn !py-1' : 'btn-outline !py-1'}>
            {v}
          </Link>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      <ul className="space-y-2">
        {(data ?? []).length === 0 && <li className="card p-8 text-center text-muted">Yozuvlar yo‘q</li>}
        {(data ?? []).map((row) => {
          const a = ACTION[row.action as string];
          const diff = row.action === 'UPDATE' ? changes(row.old_data as Json, row.new_data as Json) : [];
          const subject = label(row.table_name as string, (row.new_data ?? row.old_data) as Json);
          return (
            <li key={row.id as number} className="card p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip ${a?.cls ?? ''}`}>{a?.label ?? row.action}</span>
                <span className="font-semibold">{TABLES[row.table_name as string] ?? row.table_name}</span>
                {subject && <span className="truncate text-muted">“{subject}”</span>}
                <span className="ml-auto whitespace-nowrap text-xs text-muted">
                  {formatDateTime(row.at as string, 'uz')} · {(row.user_email as string) || 'admin'}
                </span>
              </div>
              {diff.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-muted">
                    O‘zgargan maydonlar ({diff.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {diff.map((d) => (
                      <li key={d.key} className="break-words">
                        <b>{d.key}:</b> <span className="text-red-600 line-through">{d.from}</span>{' '}
                        <Icon name="arrow-right" className="inline h-3 w-3" />{' '}
                        <span className="text-emerald-700">{d.to}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
