import type { Resource } from '@/lib/admin/resources';
import { cyrToLat } from '@/lib/i18n/translit';
import { TranslateQuotaError, translateMarkdown, translationEnabled, type MtLang } from '@/lib/translate';

type I18nObj = Record<string, string>;

export type AutoTranslateResult = {
  /** "maydon.til" ko'rinishidagi belgilar (masalan "title.ru"): shu qiymatlar avtomatik tarjima */
  autoLangs: string[];
  warning?: 'quota' | 'error';
};

const MT_LANGS: MtLang[] = ['uz', 'ru', 'en'];

/**
 * Saqlashdan oldin bo'sh tillarni to'ldiradi.
 *  - Manba: uz, bo'lmasa ru, bo'lmasa en (faqat kirill kiritilgan bo'lsa oz -> uz transliteratsiya).
 *  - Qo'lda yozilgan til hech qachon ustidan yozilmaydi.
 *  - Avto-tarjima qilingan va tahrirlanmagan til manba o'zgarsa qayta tarjima qilinadi (eskirib qolmaydi).
 *  - oz (kirill) saqlanmaydi: u saytda uz dan har safar yangidan o'giriladi (config.ts tr()).
 *
 * payload ni o'zgartiradi.
 */
export async function applyAutoTranslate(
  res: Resource,
  payload: Record<string, unknown>,
  existing: Record<string, unknown> | null,
  enabled: boolean,
): Promise<AutoTranslateResult> {
  const fields = res.fields.filter((f) => f.type.startsWith('i18n') && f.name in payload);
  const prevAuto = new Set<string>(Array.isArray(existing?.auto_langs) ? (existing!.auto_langs as string[]) : []);
  const nextAuto = new Set<string>([...prevAuto].filter((k) => !fields.some((f) => k.startsWith(`${f.name}.`))));
  let warning: AutoTranslateResult['warning'];
  const canTranslate = enabled && translationEnabled();

  for (const f of fields) {
    const cur = payload[f.name] as I18nObj;
    const old = (existing?.[f.name] ?? {}) as I18nObj;

    // faqat kirill (oz) kiritilgan bo'lsa, lotin matn transliteratsiya bilan hosil bo'ladi
    if (!cur.uz && cur.oz) cur.uz = cyrToLat(cur.oz);
    const baseChanged = (cur.uz ?? '') !== (old.uz ?? '');

    const wanted: MtLang[] = [];
    for (const L of MT_LANGS) {
      const key = `${f.name}.${L}`;
      const stored = cur[L];
      const untouchedAuto = prevAuto.has(key) && !!stored && stored === old[L];
      if (stored && !untouchedAuto) continue; // qo'lda yozilgan
      if (stored && untouchedAuto) {
        if (!canTranslate || !baseChanged) {
          nextAuto.add(key); // o'zgarishsiz qoladi
          continue;
        }
        delete cur[L]; // manba o'zgargan: qayta tarjima qilinadi
      }
      wanted.push(L);
    }

    const src: MtLang | null = cur.uz ? 'uz' : cur.ru ? 'ru' : cur.en ? 'en' : null;
    if (!canTranslate || !src) continue;

    const targets = wanted.filter((L) => L !== src && !cur[L]);
    const outcomes = await Promise.all(
      targets.map(async (L) => {
        try {
          return { L, text: await translateMarkdown(cur[src], src, L) };
        } catch (e) {
          return { L, error: e };
        }
      }),
    );
    for (const o of outcomes) {
      if ('text' in o && o.text?.trim()) {
        cur[o.L] = o.text.trim();
        nextAuto.add(`${f.name}.${o.L}`);
      } else if ('error' in o) {
        warning = o.error instanceof TranslateQuotaError ? 'quota' : (warning ?? 'error');
      }
    }
  }

  return { autoLangs: [...nextAuto].sort(), warning };
}
