import Link from 'next/link';
import Icon from '@/components/Icon';
import { allowedSites, requireStaff } from '@/lib/admin/auth';
import { tr } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';

const SITE_LABEL = { main: 'Asosiy sayt', talimsifati: "Ta'lim sifati" } as const;

export default async function Dashboard() {
  const { supabase, profile } = await requireStaff();
  const sites = allowedSites(profile.role);

  const since = new Date();
  since.setDate(since.getDate() - 29);
  const sinceDay = since.toISOString().slice(0, 10);

  const [published, drafts, scheduled, viewsRes, topRes, recentRes] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).in('site', sites).eq('status', 'published').lte('published_at', new Date().toISOString()),
    supabase.from('posts').select('*', { count: 'exact', head: true }).in('site', sites).eq('status', 'draft'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).in('site', sites).eq('status', 'published').gt('published_at', new Date().toISOString()),
    supabase.from('page_views_daily').select('site, day, views').in('site', sites).gte('day', sinceDay).order('day', { ascending: true }),
    supabase.from('posts').select('id, site, title, view_count, published_at').in('site', sites).eq('status', 'published').order('view_count', { ascending: false }).limit(8),
    supabase.from('posts').select('id, site, title, status, published_at, created_at').in('site', sites).order('created_at', { ascending: false }).limit(6),
  ]);

  // Kunlar bo'yicha tashrif (barcha ruxsat etilgan saytlar yig'indisi)
  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  const perSite: Record<string, number> = {};
  for (const row of viewsRes.data ?? []) {
    byDay.set(row.day as string, (byDay.get(row.day as string) ?? 0) + (row.views as number));
    perSite[row.site as string] = (perSite[row.site as string] ?? 0) + (row.views as number);
  }
  const days = Array.from(byDay.entries());
  const max = Math.max(1, ...days.map(([, v]) => v));
  const total = days.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Xush kelibsiz{profile.full_name ? `, ${profile.full_name}` : ''}!</h1>
          <p className="text-sm text-muted">Saytning umumiy ko‘rsatkichlari</p>
        </div>
        <Link href="/admin/r/posts/new" className="btn">
          <Icon name="plus" className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Yangi post
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "E'lon qilingan postlar", value: published.count ?? 0 },
          { label: 'Qoralamalar', value: drafts.count ?? 0 },
          { label: 'Rejalashtirilgan', value: scheduled.count ?? 0 },
          { label: 'Tashriflar (30 kun)', value: total },
        ].map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Tashriflar, so‘nggi 30 kun</h2>
          <p className="text-xs text-muted">
            {sites.map((s) => `${SITE_LABEL[s]}: ${perSite[s] ?? 0}`).join(' · ')}
          </p>
        </div>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Kunlik tashriflar diagrammasi">
          {days.map(([day, v]) => (
            <div key={day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-accent opacity-80 transition group-hover:opacity-100"
                style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-0.5 text-xs text-white group-hover:block">
                {day.slice(5)}: {v}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Eng ko‘p o‘qilgan postlar</h2>
          {(topRes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Hozircha ma&apos;lumot yo‘q</p>
          ) : (
            <ol className="space-y-2">
              {(topRes.data ?? []).map((p, i) => (
                <li key={p.id as string} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/r/posts/${p.id}`} className="min-w-0 truncate hover:underline">
                    <span className="mr-2 text-muted">{i + 1}.</span>
                    {tr(p.title, 'uz')}
                  </Link>
                  <span className="shrink-0 font-semibold">{p.view_count as number}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">So‘nggi postlar</h2>
          {(recentRes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Hozircha post yo‘q</p>
          ) : (
            <ul className="space-y-2">
              {(recentRes.data ?? []).map((p) => (
                <li key={p.id as string} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/r/posts/${p.id}`} className="min-w-0 truncate hover:underline">
                    {tr(p.title, 'uz')}
                  </Link>
                  <span className="chip shrink-0">{p.status === 'draft' ? 'Qoralama' : formatDate(p.published_at as string, 'uz')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
