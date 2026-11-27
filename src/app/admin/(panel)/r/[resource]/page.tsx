import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ListToolbar from '@/components/admin/ListToolbar';
import SavedToast from '@/components/admin/SavedToast';
import { DeleteButton } from '@/components/admin/SmallClient';
import Icon from '@/components/Icon';
import { allowedSites, requireStaff } from '@/lib/admin/auth';
import { RESOURCES, type Column } from '@/lib/admin/resources';
import { LOCALES, tr } from '@/lib/i18n/config';
import { formatDate, formatDateTime } from '@/lib/utils';

type Row = Record<string, unknown>;

const PAGE_SIZE = 25;
const SITE_OPTIONS = [
  { value: 'main', label: 'Asosiy sayt' },
  { value: 'talimsifati', label: "Ta'lim sifati" },
];

const SITE_LABEL: Record<string, string> = { main: 'Asosiy', talimsifati: "Ta'lim sifati" };
const BADGE_LABEL: Record<string, string> = {
  news: 'Yangilik',
  announcement: "E'lon",
  leadership: 'Rahbariyat',
  responsible: "Mas'ul",
  teacher: "O'qituvchi",
  staff: 'Xodim',
  library: 'Kutubxona',
  resource: 'Resurs',
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

export default async function ResourceList({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { resource: key } = await params;
  const sp = await searchParams;
  const res = RESOURCES[key];
  if (!res) notFound();

  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const { supabase, profile } = await requireStaff();
  const sites = allowedSites(profile.role);
  if (res.mainOnly && !sites.includes('main')) redirect('/admin');

  const primary = res.columns[0];
  const q = one('q').trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(one('page'), 10) || 1);
  const filterDefs = res.filters ?? [];
  const values: Record<string, string> = {};
  for (const f of [...filterDefs, { field: 'site' }]) if (one(f.field)) values[f.field] = one(f.field);

  // Faqat ro'yxatda kerak ustunlar olinadi (uzun matnlar - body/excerpt - yuklanmaydi)
  const cols = new Set<string>(['id', ...res.columns.map((c) => c.field)]);
  if (res.columns.some((c) => c.kind === 'poststatus')) {
    cols.add('status');
    cols.add('published_at');
  }

  let query = supabase
    .from(res.table)
    .select([...cols].join(','), { count: 'exact' })
    .order(res.orderBy.column, { ascending: res.orderBy.ascending });
  if (res.scope) query = query.in(res.scope.field, res.scope.values);
  if (res.hasSite) {
    const chosen = values.site && sites.includes(values.site as 'main' | 'talimsifati') ? [values.site] : sites;
    query = query.in('site', chosen);
  }
  for (const f of filterDefs) {
    if (values[f.field] && f.options.some((o) => o.value === values[f.field])) query = query.eq(f.field, values[f.field]);
  }
  if (q) {
    // Apostrof variantlari (o' o‘ oʻ) bir xil topilishi uchun ularni "bitta belgi" bilan almashtiramiz
    const pattern = `%${q.replace(/[%,()*\]/g, ' ').replace(/[ʻʼ‘’`´']/g, '_')}%`;
    query =
      primary.kind === 'i18n'
        ? query.or(LOCALES.map((l) => `${primary.field}->>${l}.ilike.${pattern}`).join(','))
        : query.ilike(primary.field, pattern);
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    for (const [k, v] of Object.entries(values)) u.set(k, v);
    if (p > 1) u.set('page', String(p));
    const qs = u.toString();
    return `/admin/r/${res.key}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-5">
      <SavedToast />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {res.plural} <span className="text-base font-medium text-muted">({total})</span>
        </h1>
        <Link href={`/admin/r/${res.key}/new`} className="btn">
          <Icon name="plus" className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Yangi qo‘shish
        </Link>
      </div>

      <ListToolbar
        q={q}
        values={values}
        filters={filterDefs}
        siteOptions={res.hasSite ? SITE_OPTIONS.filter((o) => sites.includes(o.value as 'main' | 'talimsifati')) : []}
      />

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          {q || Object.keys(values).length ? 'Hech narsa topilmadi.' : 'Hozircha hech narsa yo‘q. “Yangi qo‘shish” tugmasini bosing.'}
        </div>
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

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Sahifalar">
          {page > 1 ? (
            <Link href={href(page - 1)} className="btn-outline !px-4 !py-2">Oldingi</Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} className="btn-outline !px-4 !py-2">Keyingi</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
