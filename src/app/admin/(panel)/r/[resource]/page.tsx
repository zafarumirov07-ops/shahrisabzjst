import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DeleteButton } from '@/components/admin/SmallClient';
import Icon from '@/components/Icon';
import { allowedSites, requireStaff } from '@/lib/admin/auth';
import { RESOURCES, type Column } from '@/lib/admin/resources';
import { tr } from '@/lib/i18n/config';
import { formatDate, formatDateTime } from '@/lib/utils';

type Row = Record<string, unknown>;

const SITE_LABEL: Record<string, string> = { main: 'Asosiy', talimsifati: "Ta'lim sifati" };
const BADGE_LABEL: Record<string, string> = {
  news: 'Yangilik',
  announcement: "E'lon",
  leadership: 'Rahbariyat',
  responsible: "Mas'ul",
  teacher: "O'qituvchi",
  staff: 'Xodim',
};

function Cell({ col, row }: { col: Column; row: Row }) {
  const v = row[col.field];
  switch (col.kind) {
    case 'i18n':
      return <span className="font-medium">{tr(v as never, 'uz') || '—'}</span>;
    case 'site':
      return <span className="chip">{SITE_LABEL[String(v)] ?? String(v)}</span>;
    case 'badge':
      return <span className="chip">{BADGE_LABEL[String(v)] ?? String(v)}</span>;
    case 'bool':
      return v ? <Icon name="check" className="h-[18px] w-[18px] text-emerald-600" strokeWidth={2.4} /> : <span className="text-muted">—</span>;
    case 'date':
      return <span className="whitespace-nowrap text-muted">{v ? formatDate(String(v), 'uz') : '—'}</span>;
    case 'number':
      return <span>{v == null ? '—' : String(v)}</span>;
    case 'poststatus': {
      if (row.status === 'draft') return <span className="chip !bg-amber-500/15 !text-amber-700">Qoralama</span>;
      const at = row.published_at ? new Date(String(row.published_at)) : null;
      if (at && at.getTime() > Date.now()) {
        return (
          <span className="chip !bg-sky-500/15 !text-sky-700" title={formatDateTime(at, 'uz')}>
            Rejalashtirilgan
          </span>
        );
      }
      return <span className="chip">E&apos;lon qilingan</span>;
    }
    default:
      return <span>{v == null || v === '' ? '—' : String(v)}</span>;
  }
}

export default async function ResourceList({ params }: { params: Promise<{ resource: string }> }) {
  const { resource: key } = await params;
  const res = RESOURCES[key];
  if (!res) notFound();

  const { supabase, profile } = await requireStaff();
  const sites = allowedSites(profile.role);
  if (res.mainOnly && !sites.includes('main')) redirect('/admin');

  let q = supabase.from(res.table).select('*').order(res.orderBy.column, { ascending: res.orderBy.ascending }).limit(200);
  if (res.hasSite) q = q.in('site', sites);
  const { data, error } = await q;
  const rows = (data ?? []) as Row[];
  const primary = res.columns[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{res.plural}</h1>
        <Link href={`/admin/r/${res.key}/new`} className="btn">
          <Icon name="plus" className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Yangi qo‘shish
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-muted">Hozircha hech narsa yo‘q. “Yangi qo‘shish” tugmasini bosing.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                {res.columns.map((c) => (
                  <th key={c.field} className="px-4 py-3 font-semibold">{c.label}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const label = String(
                  primary.kind === 'i18n' ? tr(row[primary.field] as never, 'uz') : row[primary.field] ?? '',
                );
                return (
                  <tr key={String(row.id)} className="border-b border-line last:border-0 hover:bg-page/60">
                    {res.columns.map((c) => (
                      <td key={c.field} className="px-4 py-3 align-middle">
                        <Cell col={c} row={row} />
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/admin/r/${res.key}/${row.id}`} className="link mr-2 text-sm font-semibold">
                        Tahrirlash
                      </Link>
                      <DeleteButton resourceKey={res.key} id={String(row.id)} label={label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
