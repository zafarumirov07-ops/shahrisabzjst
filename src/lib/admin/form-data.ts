import { notFound, redirect } from 'next/navigation';
import type { AttachmentItem } from '@/components/admin/AttachmentsEditor';
import { allowedSites, requireStaff } from '@/lib/admin/auth';
import { RESOURCES, type Option } from '@/lib/admin/resources';
import { tr } from '@/lib/i18n/config';

const SITE_LABEL = { main: 'Asosiy sayt', talimsifati: "Ta'lim sifati sayti" } as const;

/** Yangi yozuv (id = null) yoki mavjudini tahrirlash formasi uchun ma'lumotlarni yig'adi. */
export async function buildFormProps(resourceKey: string, id: string | null) {
  const res = RESOURCES[resourceKey];
  if (!res) notFound();

  const { supabase, profile } = await requireStaff();
  const sites = allowedSites(profile.role);
  if (res.mainOnly && !sites.includes('main')) redirect('/admin');

  const siteOptions: Option[] = sites.map((s) => ({ value: s, label: SITE_LABEL[s] }));

  // Hamma so'rovlar bir vaqtda ketadi (ketma-ket kutilmaydi)
  const optionJobs = res.fields
    .filter((f) => f.optionsFrom)
    .map(async (f) => {
      const { table, labelField, i18n } = f.optionsFrom!;
      const { data } = await supabase.from(table).select(`id, ${labelField}`).order('sort_order', { ascending: true });
      const options: Option[] = (data ?? []).map((r) => {
        const row = r as unknown as Record<string, unknown>;
        return {
          value: String(row.id),
          label: i18n ? tr(row[labelField] as never, 'uz') || String(row.id) : String(row[labelField]),
        };
      });
      return [f.name, options] as const;
    });

  const recordJob = id
    ? Promise.all([
        supabase.from(res.table).select('*').eq('id', id).maybeSingle(),
        res.attachments
          ? supabase.from(res.attachments.table).select('*').eq(res.attachments.fk, id).order('sort_order', { ascending: true })
          : Promise.resolve({ data: null }),
      ])
    : null;

  const [optionEntries, recordResult] = await Promise.all([Promise.all(optionJobs), recordJob]);
  const dynamicOptions: Record<string, Option[]> = Object.fromEntries(optionEntries);

  let initial: Record<string, unknown> = {};
  let initialAttachments: AttachmentItem[] = [];

  if (id && recordResult) {
    const [{ data }, { data: items }] = recordResult;
    if (!data) notFound();
    initial = data as Record<string, unknown>;
    if (res.hasSite && !sites.includes(initial.site as 'main' | 'talimsifati')) notFound();

    if (res.attachments) {
      const cfg = res.attachments;
      initialAttachments = (items ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: String(row.id),
          kind: row.kind as AttachmentItem['kind'],
          url: String(row.url),
          text: String(row[cfg.textField] ?? ''),
        };
      });
    }
  }

  return { resource: res, id, initial, initialAttachments, siteOptions, dynamicOptions };
}
