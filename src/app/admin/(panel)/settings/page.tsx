import type { Metadata } from 'next';
import Link from 'next/link';
import SettingsForm, { type SettingsSection } from '@/components/admin/SettingsForm';
import { allowedSites, requireStaff } from '@/lib/admin/auth';
import { isSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Sayt sozlamalari' };

const SITE_LABEL = { main: 'Asosiy sayt', talimsifati: "Ta'lim sifati sayti" } as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { supabase, profile } = await requireStaff();
  const sites = allowedSites(profile.role);
  const { site: requested } = await searchParams;
  const site = requested && isSite(requested) && sites.includes(requested) ? requested : sites[0];

  const { data } = await supabase.from('site_settings').select('key, value').eq('site', site);
  const stored: Record<string, Record<string, unknown>> = {};
  for (const r of data ?? []) stored[r.key as string] = (r.value ?? {}) as Record<string, unknown>;

  const sections: SettingsSection[] = [
    {
      key: 'hero',
      title: 'Bosh sahifa sarlavhasi',
      description: "Bo'sh qoldirilsa, standart matn ko'rsatiladi.",
      initial: stored.hero ?? {},
      fields: [
        { name: 'title', label: 'Katta sarlavha', type: 'i18n' },
        { name: 'subtitle', label: 'Qisqa tavsif', type: 'i18n-textarea' },
        { name: 'image_url', label: 'Fon rasmi', type: 'image' },
      ],
    },
    ...(site === 'main'
      ? [
          {
            key: 'stats' as const,
            title: 'Ko‘rsatkichlar',
            description: 'Bosh sahifadagi raqamlar. Yo‘nalishlar soni avtomatik hisoblanadi.',
            initial: stored.stats ?? {},
            fields: [
              { name: 'students', label: 'Talabalar soni', type: 'text' as const },
              { name: 'teachers', label: 'O‘qituvchilar soni', type: 'text' as const },
              { name: 'founded', label: 'Tashkil etilgan yil', type: 'text' as const },
            ],
          },
        ]
      : []),
    {
      key: 'contact',
      title: 'Aloqa ma’lumotlari',
      description: 'Sayt pastki qismida (footer) ko‘rinadi.',
      initial: stored.contact ?? {},
      fields: [
        { name: 'address', label: 'Manzil', type: 'i18n' },
        { name: 'phone', label: 'Telefon', type: 'text', placeholder: '+998 ...' },
        { name: 'email', label: 'Elektron pochta', type: 'text' },
        { name: 'working_hours', label: 'Ish vaqti', type: 'i18n' },
        { name: 'map_url', label: 'Xarita havolasi (ixtiyoriy)', type: 'url' },
      ],
    },
    {
      key: 'socials',
      title: 'Ijtimoiy tarmoqlar',
      description: 'To‘liq havolani kiriting (https://...). Bo‘sh qolganlari ko‘rsatilmaydi.',
      initial: stored.socials ?? {},
      fields: [
        { name: 'telegram', label: 'Telegram', type: 'url' },
        { name: 'instagram', label: 'Instagram', type: 'url' },
        { name: 'facebook', label: 'Facebook', type: 'url' },
        { name: 'youtube', label: 'YouTube', type: 'url' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Sayt sozlamalari</h1>
      {sites.length > 1 && (
        <div className="flex gap-2">
          {sites.map((s) => (
            <Link key={s} href={`/admin/settings?site=${s}`} className={s === site ? 'btn !py-1.5' : 'btn-outline !py-1.5'}>
              {SITE_LABEL[s]}
            </Link>
          ))}
        </div>
      )}
      {sites.length === 1 && <p className="text-sm text-muted">{SITE_LABEL[site]}</p>}
      <SettingsForm key={site} site={site} sections={sections} />
    </div>
  );
}
