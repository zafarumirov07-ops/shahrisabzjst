/**
 * Admin paneldagi barcha CRUD bo'limlari shu konfiguratsiya orqali quriladi.
 * Faqat serializatsiya qilinadigan ma'lumotlar (funksiyalarsiz), chunki client komponentlarga uzatiladi.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'datetime'
  | 'image'
  | 'i18n'
  | 'i18n-textarea'
  | 'i18n-markdown'
  | 'slug'
  | 'site'
  | 'socials';

export type Option = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: Option[];
  /** Variantlar boshqa jadvaldan yuklanadi */
  optionsFrom?: { table: string; labelField: string; i18n?: boolean };
  /** slug maydoni uchun: qaysi i18n maydondan (o'zbekcha matn) hosil qilinadi */
  from?: string;
};

export type ColumnKind = 'i18n' | 'text' | 'date' | 'bool' | 'site' | 'badge' | 'number' | 'poststatus';
export type Column = { label: string; field: string; kind: ColumnKind };

export type AttachmentKind = 'image' | 'video' | 'file' | 'embed';

export type AttachmentsConfig = {
  table: 'post_media' | 'album_items';
  fk: 'post_id' | 'album_id';
  kinds: AttachmentKind[];
  textField: 'title' | 'caption';
  label: string;
};

export type ListFilter = { field: string; label: string; options: Option[] };

export type Resource = {
  key: string;
  table: string;
  plural: string;
  singular: string;
  hasSite: boolean;
  /** Faqat asosiy sayt (talimsifati muharrirlariga ko'rinmaydi) */
  mainOnly?: boolean;
  setCreatedBy?: boolean;
  fields: Field[];
  defaults: Record<string, unknown>;
  columns: Column[];
  orderBy: { column: string; ascending: boolean };
  attachments?: AttachmentsConfig;
  /** Ro'yxat ustidagi filtrlar (qiymat bo'yicha aniq moslik) */
  filters?: ListFilter[];
  /** Bir jadvalni bir necha bo'limga bo'lish: bo'lim faqat shu qiymatli yozuvlarni ko'rsatadi/tahrirlaydi (masalan posts.kind) */
  scope?: { field: string; values: string[] };
  /** Saqlashda doim shu qiymatlar yoziladi (maydon formada ko'rinmaydi) */
  fixed?: Record<string, unknown>;
};

const SITE_FIELD: Field = { name: 'site', label: 'Qaysi saytda', type: 'site', required: true };

/** "Elektron kutubxona" va "Elektron raqamli resurslar": posts jadvalidagi alohida turdagi postlar */
function libraryLikeResource(o: {
  key: string;
  plural: string;
  singular: string;
  kind: 'library' | 'resource';
  titleLabel: string;
  authorLabel: string;
  authorRequired?: boolean;
  bodyLabel: string;
  excerptHelp: string;
  externalHelp: string;
  attachmentsLabel: string;
}): Resource {
  return {
    key: o.key,
    table: 'posts',
    plural: o.plural,
    singular: o.singular,
    hasSite: true,
    setCreatedBy: true,
    scope: { field: 'kind', values: [o.kind] },
    fixed: { kind: o.kind },
    fields: [
      SITE_FIELD,
      { name: 'title', label: o.titleLabel, type: 'i18n', required: true },
      { name: 'author', label: o.authorLabel, type: 'text', required: o.authorRequired },
      { name: 'slug', label: 'Havola (slug)', type: 'slug', from: 'title', help: 'Bo‘sh qoldirsangiz nomidan avtomatik yaratiladi' },
      { name: 'excerpt', label: 'Qisqacha mazmun', type: 'i18n-textarea', help: o.excerptHelp },
      { name: 'body', label: o.bodyLabel, type: 'i18n-markdown' },
      { name: 'external_url', label: 'Tashqi havola', type: 'url', placeholder: 'https://', help: o.externalHelp },
      { name: 'cover_url', label: o.kind === 'resource' ? "Rasm (o'qituvchi surati yoki fan muqovasi)" : 'Muqova rasmi', type: 'image' },
      { name: 'pinned', label: 'Muhim (ro‘yxat boshida turadi)', type: 'checkbox' },
      {
        name: 'status',
        label: 'Holati',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Qoralama (saytda ko‘rinmaydi)' },
          { value: 'published', label: "E'lon qilish" },
        ],
      },
      {
        name: 'published_at',
        label: "E'lon qilish vaqti",
        type: 'datetime',
        help: "Kelajakdagi vaqt qo'ysangiz, o'sha vaqtda saytda avtomatik paydo bo'ladi. Bo'sh bo'lsa — hozir.",
      },
    ],
    defaults: { status: 'draft', pinned: false },
    columns: [
      { label: 'Nomi', field: 'title', kind: 'i18n' },
      { label: o.authorLabel, field: 'author', kind: 'text' },
      { label: 'Sayt', field: 'site', kind: 'site' },
      { label: 'Holati', field: 'status', kind: 'poststatus' },
      { label: 'Sana', field: 'published_at', kind: 'date' },
      { label: "Ko'rilgan", field: 'view_count', kind: 'number' },
    ],
    orderBy: { column: 'created_at', ascending: false },
    filters: [
      { field: 'status', label: 'Holati', options: [{ value: 'published', label: "E'lon qilingan" }, { value: 'draft', label: 'Qoralama' }] },
    ],
    attachments: {
      table: 'post_media',
      fk: 'post_id',
      kinds: ['file', 'image', 'video', 'embed'],
      textField: 'title',
      label: o.attachmentsLabel,
    },
  };
}

export const RESOURCES: Record<string, Resource> = {
  posts: {
    key: 'posts',
    table: 'posts',
    plural: 'Postlar',
    singular: 'Post',
    hasSite: true,
    setCreatedBy: true,
    fields: [
      SITE_FIELD,
      {
        name: 'kind',
        label: 'Turi',
        type: 'select',
        required: true,
        options: [
          { value: 'news', label: 'Yangilik' },
          { value: 'announcement', label: "E'lon" },
        ],
      },
      { name: 'title', label: 'Sarlavha', type: 'i18n', required: true },
      { name: 'slug', label: 'Havola (slug)', type: 'slug', from: 'title', help: 'Bo‘sh qoldirsangiz sarlavhadan avtomatik yaratiladi' },
      { name: 'excerpt', label: 'Qisqacha mazmun', type: 'i18n-textarea', help: "Ro'yxatlarda va ijtimoiy tarmoqlarda ko'rinadi" },
      { name: 'body', label: 'Asosiy matn (Markdown)', type: 'i18n-markdown' },
      { name: 'cover_url', label: 'Muqova rasmi', type: 'image' },
      { name: 'pinned', label: 'Muhim (ro‘yxat boshida turadi)', type: 'checkbox' },
      {
        name: 'status',
        label: 'Holati',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Qoralama (saytda ko‘rinmaydi)' },
          { value: 'published', label: "E'lon qilish" },
        ],
      },
      {
        name: 'published_at',
        label: "E'lon qilish vaqti",
        type: 'datetime',
        help: "Kelajakdagi vaqt qo'ysangiz, post o'sha vaqtda saytda avtomatik paydo bo'ladi. Bo'sh bo'lsa — hozir.",
      },
    ],
    defaults: { kind: 'news', status: 'draft', pinned: false },
    scope: { field: 'kind', values: ['news', 'announcement'] },
    columns: [
      { label: 'Sarlavha', field: 'title', kind: 'i18n' },
      { label: 'Turi', field: 'kind', kind: 'badge' },
      { label: 'Sayt', field: 'site', kind: 'site' },
      { label: 'Holati', field: 'status', kind: 'poststatus' },
      { label: 'Sana', field: 'published_at', kind: 'date' },
      { label: "Ko'rilgan", field: 'view_count', kind: 'number' },
    ],
    orderBy: { column: 'created_at', ascending: false },
    filters: [
      { field: 'kind', label: 'Turi', options: [{ value: 'news', label: 'Yangilik' }, { value: 'announcement', label: "E'lon" }] },
      { field: 'status', label: 'Holati', options: [{ value: 'published', label: "E'lon qilingan" }, { value: 'draft', label: 'Qoralama' }] },
    ],
    attachments: {
      table: 'post_media',
      fk: 'post_id',
      kinds: ['image', 'video', 'file', 'embed'],
      textField: 'title',
      label: 'Rasmlar, videolar va fayllar',
    },
  },

  library: libraryLikeResource({
    key: 'library',
    plural: 'Elektron kutubxona',
    singular: 'Kutubxona materiali',
    kind: 'library',
    titleLabel: 'Kitob / material nomi',
    authorLabel: 'Muallif',
    bodyLabel: 'Tavsif (Markdown)',
    excerptHelp: "Ro'yxatda ko'rinadi: muallif, yil, qisqacha mazmun",
    externalHelp: "Kitob onlayn o'qiladigan sayt manzili (ixtiyoriy). Faylni pastdagi bo'limdan to'g'ridan-to'g'ri yuklash ham mumkin.",
    attachmentsLabel: 'Kitob fayllari (PDF, Word, ...), muqova rasmlari va videolar',
  }),

  digital: libraryLikeResource({
    key: 'digital',
    plural: "Raqamli ta'lim resurslari (RTR)",
    singular: 'RTR',
    kind: 'resource',
    titleLabel: 'Fan / resurs nomi',
    authorLabel: "O'qituvchi (F.I.Sh.)",
    authorRequired: true,
    bodyLabel: 'Tavsif (Markdown)',
    excerptHelp: "Kartochkada ko'rinadi: yo'nalish, semestr, soatlar, mavzular soni",
    externalHelp: "O'qituvchining RTR sayti, masalan https://komilova-huquq.vercel.app (kartochkada \"Resursga o'tish\" tugmasi chiqadi)",
    attachmentsLabel: "Qo'llanma fayllari, rasmlar, videolar",
  }),

  events: {
    key: 'events',
    table: 'events',
    plural: 'Tadbirlar',
    singular: 'Tadbir',
    hasSite: true,
    fields: [
      SITE_FIELD,
      { name: 'title', label: 'Nomi', type: 'i18n', required: true },
      { name: 'slug', label: 'Havola (slug)', type: 'slug', from: 'title', help: 'Bo‘sh qoldirsangiz nomidan avtomatik yaratiladi' },
      { name: 'description', label: 'Tavsif (Markdown)', type: 'i18n-markdown' },
      { name: 'location', label: 'Manzil / joy', type: 'i18n' },
      { name: 'starts_at', label: 'Boshlanish vaqti', type: 'datetime', required: true },
      { name: 'ends_at', label: 'Tugash vaqti', type: 'datetime' },
      { name: 'cover_url', label: 'Rasm', type: 'image' },
      { name: 'published', label: "Saytda ko'rsatilsin", type: 'checkbox' },
    ],
    defaults: { published: true },
    columns: [
      { label: 'Nomi', field: 'title', kind: 'i18n' },
      { label: 'Sayt', field: 'site', kind: 'site' },
      { label: 'Sana', field: 'starts_at', kind: 'date' },
      { label: "Ko'rinadi", field: 'published', kind: 'bool' },
    ],
    orderBy: { column: 'starts_at', ascending: false },
  },

  albums: {
    key: 'albums',
    table: 'albums',
    plural: 'Galereya (albomlar)',
    singular: 'Albom',
    hasSite: true,
    fields: [
      SITE_FIELD,
      { name: 'title', label: 'Albom nomi', type: 'i18n', required: true },
      { name: 'slug', label: 'Havola (slug)', type: 'slug', from: 'title' },
      { name: 'description', label: 'Tavsif', type: 'i18n-textarea' },
      { name: 'cover_url', label: 'Muqova rasmi', type: 'image' },
      { name: 'published', label: "Saytda ko'rsatilsin", type: 'checkbox' },
      { name: 'published_at', label: 'Sana', type: 'datetime' },
    ],
    defaults: { published: true },
    columns: [
      { label: 'Nomi', field: 'title', kind: 'i18n' },
      { label: 'Sayt', field: 'site', kind: 'site' },
      { label: 'Sana', field: 'published_at', kind: 'date' },
      { label: "Ko'rinadi", field: 'published', kind: 'bool' },
    ],
    orderBy: { column: 'published_at', ascending: false },
    attachments: {
      table: 'album_items',
      fk: 'album_id',
      kinds: ['image', 'video', 'embed'],
      textField: 'caption',
      label: 'Albom rasmlari va videolari',
    },
  },

  staff: {
    key: 'staff',
    table: 'staff',
    plural: 'Jamoa',
    singular: 'Xodim',
    hasSite: true,
    fields: [
      SITE_FIELD,
      { name: 'full_name', label: 'F.I.Sh.', type: 'text', required: true },
      {
        name: 'group_key',
        label: 'Guruh',
        type: 'select',
        required: true,
        options: [
          { value: 'leadership', label: 'Rahbariyat' },
          { value: 'responsible', label: "Mas'ullar" },
          { value: 'teacher', label: "O'qituvchilar" },
          { value: 'staff', label: 'Xodimlar' },
        ],
      },
      {
        name: 'department_id',
        label: "Bo'lim / kafedra",
        type: 'select',
        optionsFrom: { table: 'departments', labelField: 'name', i18n: true },
      },
      { name: 'position', label: 'Lavozimi', type: 'i18n' },
      { name: 'bio', label: "Qisqacha ma'lumot", type: 'i18n-textarea' },
      { name: 'photo_url', label: 'Rasmi', type: 'image' },
      { name: 'phone', label: 'Telefon', type: 'text' },
      { name: 'email', label: 'Elektron pochta', type: 'text' },
      { name: 'socials', label: 'Ijtimoiy tarmoqlar', type: 'socials' },
      { name: 'sort_order', label: 'Tartib raqami (kichigi birinchi)', type: 'number' },
      { name: 'published', label: "Saytda ko'rsatilsin", type: 'checkbox' },
    ],
    defaults: { group_key: 'teacher', published: true, sort_order: 0, socials: {} },
    columns: [
      { label: 'F.I.Sh.', field: 'full_name', kind: 'text' },
      { label: 'Guruh', field: 'group_key', kind: 'badge' },
      { label: 'Sayt', field: 'site', kind: 'site' },
      { label: 'Tartib', field: 'sort_order', kind: 'number' },
      { label: "Ko'rinadi", field: 'published', kind: 'bool' },
    ],
    orderBy: { column: 'sort_order', ascending: true },
    filters: [
      {
        field: 'group_key',
        label: 'Guruh',
        options: [
          { value: 'leadership', label: 'Rahbariyat' },
          { value: 'responsible', label: "Mas'ullar" },
          { value: 'teacher', label: "O'qituvchilar" },
          { value: 'staff', label: 'Xodimlar' },
        ],
      },
    ],
  },

  programs: {
    key: 'programs',
    table: 'programs',
    plural: "Yo'nalishlar",
    singular: "Yo'nalish",
    hasSite: false,
    mainOnly: true,
    fields: [
      { name: 'name', label: 'Yo‘nalish nomi', type: 'i18n', required: true },
      { name: 'slug', label: 'Havola (slug)', type: 'slug', from: 'name' },
      { name: 'description', label: 'Qisqa tavsif', type: 'i18n-textarea', help: "Kartochkada ko'rinadi" },
      { name: 'body', label: 'Batafsil (Markdown)', type: 'i18n-markdown', help: "Yo'nalish sahifasida: kasb, o'quv rejasi, qabul talablari" },
      { name: 'cover_url', label: 'Rasm', type: 'image' },
      { name: 'duration', label: "Ta'lim muddati", type: 'i18n', help: 'Masalan: 2 yil 10 oy' },
      { name: 'study_form', label: "Ta'lim shakli", type: 'i18n', help: 'Masalan: Kunduzgi' },
      { name: 'language', label: "Ta'lim tili", type: 'i18n', help: "Masalan: O'zbek, rus" },
      { name: 'quota', label: 'Qabul kvotasi', type: 'number' },
      { name: 'sort_order', label: 'Tartib raqami', type: 'number' },
      { name: 'published', label: "Saytda ko'rsatilsin", type: 'checkbox' },
    ],
    defaults: { published: true, sort_order: 0 },
    columns: [
      { label: 'Nomi', field: 'name', kind: 'i18n' },
      { label: 'Kvota', field: 'quota', kind: 'number' },
      { label: 'Tartib', field: 'sort_order', kind: 'number' },
      { label: "Ko'rinadi", field: 'published', kind: 'bool' },
    ],
    orderBy: { column: 'sort_order', ascending: true },
  },

  departments: {
    key: 'departments',
    table: 'departments',
    plural: "Bo'limlar va kafedralar",
    singular: "Bo'lim",
    hasSite: false,
    mainOnly: true,
    fields: [
      { name: 'name', label: 'Nomi', type: 'i18n', required: true },
      { name: 'slug', label: 'Havola (slug)', type: 'slug', from: 'name' },
      { name: 'description', label: 'Tavsif', type: 'i18n-textarea' },
      { name: 'sort_order', label: 'Tartib raqami', type: 'number' },
    ],
    defaults: { sort_order: 0 },
    columns: [
      { label: 'Nomi', field: 'name', kind: 'i18n' },
      { label: 'Tartib', field: 'sort_order', kind: 'number' },
    ],
    orderBy: { column: 'sort_order', ascending: true },
  },

  pages: {
    key: 'pages',
    table: 'pages',
    plural: 'Sahifalar',
    singular: 'Sahifa',
    hasSite: true,
    fields: [
      SITE_FIELD,
      { name: 'title', label: 'Sarlavha', type: 'i18n', required: true },
      {
        name: 'slug',
        label: 'Havola (slug)',
        type: 'slug',
        from: 'title',
        help: "Maxsus: about (Texnikum haqida), contact (Aloqa), admission (Qabul qoidalari matni). Sahifa manzili: /p/<slug>",
      },
      { name: 'body', label: 'Matn (Markdown)', type: 'i18n-markdown' },
      { name: 'sort_order', label: 'Tartib raqami', type: 'number' },
      { name: 'published', label: "Saytda ko'rsatilsin", type: 'checkbox' },
    ],
    defaults: { published: true, sort_order: 0 },
    columns: [
      { label: 'Sarlavha', field: 'title', kind: 'i18n' },
      { label: 'Slug', field: 'slug', kind: 'text' },
      { label: 'Sayt', field: 'site', kind: 'site' },
      { label: "Ko'rinadi", field: 'published', kind: 'bool' },
    ],
    orderBy: { column: 'sort_order', ascending: true },
  },
};

export const SOCIAL_KEYS = ['telegram', 'instagram', 'facebook', 'youtube'] as const;
