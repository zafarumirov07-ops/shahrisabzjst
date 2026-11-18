// Yo'nalishlar (programs) uchun QORALAMA ma'lumot: qisqa tavsif, batafsil matn (uz/ru/en) va kvotalar.
// Faqat umumiy, tekshiriladigan ma'lumotlar yozilgan: narx, litsenziya, o'tish bali kabi raqamlar yo'q.
// Kvotalar kasbedu.uz dagi qabul kvotalaridan olingan. Hammasi admin panelda ("Yo'nalishlar") tahrirlanadi.
//
// Mavjud qiymatlar: faqat bo'sh maydonlar to'ldiriladi (qo'lda yozganingiz ustidan yozilmaydi), --overwrite bilan hammasi yangilanadi.
//
// Ishlatish:  node scripts/seed-programs.mjs            (ko'rish)
//             node scripts/seed-programs.mjs --apply    (yozish)
import { APPLY, flag, fetchAll, getDb } from './_lib.mjs';

const FORM = { uz: 'Kunduzgi', ru: 'Очная', en: 'Full-time' };

const DATA = {
  'hamshiralik-ishi': {
    quota: 270,
    study_form: FORM,
    description: {
      uz: 'Bemorlarni parvarish qilish, shifokorga davolash jarayonida yordam berish va kasalliklar profilaktikasi bo‘yicha o‘rta tibbiyot xodimi tayyorlanadi.',
      ru: 'Подготовка среднего медицинского персонала: уход за пациентами, помощь врачу в лечении и профилактика заболеваний.',
      en: 'Training of mid-level medical staff: patient care, assisting doctors in treatment and disease prevention.',
    },
    body: {
      uz: `## Yo‘nalish haqida
Hamshiralik ishi sog‘liqni saqlash tizimining asosiy bo‘g‘inlaridan biri hisoblanadi. Talabalar bemorlarni parvarish qilish, tibbiy muolajalarni bajarish, kasalliklarning oldini olish va aholiga sog‘lom turmush tarzi bo‘yicha maslahat berish asoslarini o‘rganadi.

## Bitiruvchi nimalarga qodir
- bemorlarni parvarish qilish va holatini kuzatish;
- shifokor tayinlagan muolajalarni bajarish;
- birinchi tibbiy yordam ko‘rsatish;
- tibbiy hujjatlarni yuritish va sanitariya-epidemiologik qoidalarga rioya qilish.

## Qayerda ishlaydi
Shifoxonalar, poliklinikalar, oilaviy poliklinikalar va boshqa davolash-profilaktika muassasalarida o‘rta tibbiyot xodimi sifatida.`,
      ru: `## О направлении
Сестринское дело — одно из основных звеньев системы здравоохранения. Студенты изучают основы ухода за пациентами, выполнения медицинских процедур, профилактики заболеваний и консультирования населения по здоровому образу жизни.

## Что умеет выпускник
- ухаживать за пациентами и наблюдать за их состоянием;
- выполнять назначения врача;
- оказывать первую медицинскую помощь;
- вести медицинскую документацию и соблюдать санитарно-эпидемиологические правила.

## Где работает
В больницах, поликлиниках, семейных поликлиниках и других лечебно-профилактических учреждениях в качестве среднего медицинского работника.`,
      en: `## About the program
Nursing is one of the core parts of the healthcare system. Students learn the basics of patient care, performing medical procedures, disease prevention and advising the public on a healthy lifestyle.

## What graduates can do
- care for patients and monitor their condition;
- carry out procedures prescribed by a doctor;
- provide first aid;
- keep medical records and follow sanitary and epidemiological rules.

## Where graduates work
In hospitals, polyclinics, family clinics and other treatment and prevention facilities as mid-level medical staff.`,
    },
  },
  'davolash-ishi': {
    quota: 60,
    study_form: FORM,
    description: {
      uz: 'Kasalliklarni erta aniqlash, davolash jarayonida shifokorga yordam berish va aholiga birlamchi tibbiy yordam ko‘rsatish bo‘yicha mutaxassis tayyorlanadi.',
      ru: 'Подготовка специалистов по раннему выявлению заболеваний, помощи врачу в лечении и оказанию первичной медицинской помощи населению.',
      en: 'Training of specialists in early detection of diseases, assisting doctors in treatment and providing primary medical care.',
    },
    body: {
      uz: `## Yo‘nalish haqida
Davolash ishi yo‘nalishida talabalar odam organizmi, kasalliklarning belgilari, tekshiruv va davolash asoslarini o‘rganadi hamda amaliyot davomida bemorlar bilan ishlash ko‘nikmalarini egallaydi.

## Bitiruvchi nimalarga qodir
- bemorni dastlabki ko‘rikdan o‘tkazish va holatini baholash;
- birlamchi tibbiy yordam ko‘rsatish;
- shifokor ko‘rsatmalari asosida davolash jarayonida ishtirok etish;
- profilaktika va sog‘lom turmush tarzi bo‘yicha aholini ma’lumotlandirish.

## Qayerda ishlaydi
Poliklinikalar, shifoxonalar, qishloq vrachlik punktlari va boshqa davolash-profilaktika muassasalarida.`,
      ru: `## О направлении
Студенты направления «Лечебное дело» изучают строение организма человека, признаки заболеваний, основы обследования и лечения, а в ходе практики осваивают навыки работы с пациентами.

## Что умеет выпускник
- проводить первичный осмотр и оценивать состояние пациента;
- оказывать первичную медицинскую помощь;
- участвовать в лечебном процессе по указаниям врача;
- информировать население о профилактике и здоровом образе жизни.

## Где работает
В поликлиниках, больницах, сельских врачебных пунктах и других лечебно-профилактических учреждениях.`,
      en: `## About the program
Students of the General Medicine program study the human body, signs of diseases and the basics of examination and treatment, and gain patient-care skills during practical training.

## What graduates can do
- perform an initial examination and assess a patient's condition;
- provide primary medical care;
- take part in treatment under a doctor's instructions;
- inform the public about prevention and a healthy lifestyle.

## Where graduates work
In polyclinics, hospitals, rural medical posts and other treatment and prevention facilities.`,
    },
  },
  farmatsiya: {
    quota: 30,
    study_form: FORM,
    description: {
      uz: 'Dori vositalarini qabul qilish, saqlash va tarqatish hamda dorixonada aholiga maslahat berish bo‘yicha mutaxassis tayyorlanadi.',
      ru: 'Подготовка специалистов по приёму, хранению и отпуску лекарственных средств и консультированию населения в аптеке.',
      en: 'Training of specialists in receiving, storing and dispensing medicines and advising customers in pharmacies.',
    },
    body: {
      uz: `## Yo‘nalish haqida
Farmatsiya yo‘nalishida talabalar dori vositalarining turlari, ularning ta’siri, saqlash qoidalari va dorixona faoliyatini tashkil etish asoslarini o‘rganadi.

## Bitiruvchi nimalarga qodir
- dori vositalarini qabul qilish, saqlash va hisobini yuritish;
- retsept bo‘yicha va retseptsiz dori vositalarini tarqatish;
- fuqarolarga dori vositalarini qo‘llash bo‘yicha umumiy tavsiyalar berish;
- sanitariya va saqlash talablariga rioya qilish.

## Qayerda ishlaydi
Dorixonalar, dori vositalari omborlari va farmatsevtika sohasidagi boshqa tashkilotlarda.`,
      ru: `## О направлении
Студенты направления «Фармация» изучают виды лекарственных средств, их действие, правила хранения и основы организации работы аптеки.

## Что умеет выпускник
- принимать, хранить и вести учёт лекарственных средств;
- отпускать лекарства по рецепту и без рецепта;
- давать покупателям общие рекомендации по применению лекарств;
- соблюдать санитарные требования и условия хранения.

## Где работает
В аптеках, на складах лекарственных средств и в других организациях фармацевтической отрасли.`,
      en: `## About the program
Pharmacy students study types of medicines, how they work, storage rules and the basics of running a pharmacy.

## What graduates can do
- receive, store and keep records of medicines;
- dispense prescription and over-the-counter medicines;
- give customers general advice on using medicines;
- follow sanitary and storage requirements.

## Where graduates work
In pharmacies, medicine warehouses and other organizations in the pharmaceutical sector.`,
    },
  },
  'tibbiy-profilaktika-ishi': {
    quota: 30,
    study_form: FORM,
    description: {
      uz: 'Kasalliklarning oldini olish, sanitariya-epidemiologik nazorat va aholi o‘rtasida sog‘lom turmush tarzini targ‘ib qilish bo‘yicha mutaxassis tayyorlanadi.',
      ru: 'Подготовка специалистов по профилактике заболеваний, санитарно-эпидемиологическому надзору и пропаганде здорового образа жизни.',
      en: 'Training of specialists in disease prevention, sanitary and epidemiological supervision and promoting a healthy lifestyle.',
    },
    body: {
      uz: `## Yo‘nalish haqida
Tibbiy profilaktika ishi yo‘nalishida talabalar yuqumli va yuqumsiz kasalliklarning oldini olish, sanitariya-gigiena talablari va aholi salomatligini muhofaza qilish asoslarini o‘rganadi.

## Bitiruvchi nimalarga qodir
- sanitariya-gigiena va epidemiyaga qarshi qoidalar bajarilishini kuzatish;
- kasalliklar profilaktikasi bo‘yicha tadbirlarda ishtirok etish;
- aholi o‘rtasida sog‘lom turmush tarzini targ‘ib qilish;
- tegishli hujjatlarni yuritish.

## Qayerda ishlaydi
Jamoat salomatligi va sanitariya-epidemiologiya xizmatlari, poliklinikalar hamda boshqa sog‘liqni saqlash muassasalarida.`,
      ru: `## О направлении
Студенты направления «Медицинская профилактика» изучают профилактику инфекционных и неинфекционных заболеваний, санитарно-гигиенические требования и основы охраны здоровья населения.

## Что умеет выпускник
- контролировать соблюдение санитарно-гигиенических и противоэпидемических правил;
- участвовать в профилактических мероприятиях;
- пропагандировать здоровый образ жизни среди населения;
- вести необходимую документацию.

## Где работает
В службах общественного здоровья и санитарно-эпидемиологического надзора, поликлиниках и других учреждениях здравоохранения.`,
      en: `## About the program
Students of Preventive Medicine study the prevention of infectious and non-communicable diseases, sanitary and hygiene requirements and the basics of protecting public health.

## What graduates can do
- monitor compliance with sanitary, hygiene and anti-epidemic rules;
- take part in disease prevention activities;
- promote a healthy lifestyle among the public;
- keep the required records.

## Where graduates work
In public health and sanitary-epidemiological services, polyclinics and other healthcare facilities.`,
    },
  },
  'funksional-diagnostika-ishi': {
    quota: 30,
    study_form: FORM,
    description: {
      uz: 'Poliklinika, shifoxona va diagnostika markazlarida EKG, ultratovush va boshqa funksional tekshiruvlarni o‘tkazuvchi o‘rta tibbiyot xodimi tayyorlanadi.',
      ru: 'Подготовка среднего медицинского персонала для проведения ЭКГ, ультразвуковых и других функциональных обследований в поликлиниках, больницах и диагностических центрах.',
      en: 'Training of mid-level medical staff to perform ECG, ultrasound and other functional tests in polyclinics, hospitals and diagnostic centres.',
    },
    body: {
      uz: `## Yo‘nalish haqida
Funksional diagnostika ishi yo‘nalishida talabalar organizm a’zolari faoliyatini tekshiruvchi asboblar bilan ishlash, tekshiruv natijalarini rasmiylashtirish va bemorlarni tekshiruvga tayyorlash asoslarini o‘rganadi.

## Bitiruvchi nimalarga qodir
- EKG, ultratovush va boshqa funksional tekshiruvlarni o‘tkazish;
- bemorni tekshiruvga tayyorlash;
- tekshiruv natijalarini rasmiylashtirish va shifokorga taqdim etish;
- tibbiy asboblardan xavfsiz foydalanish qoidalariga rioya qilish.

## Qayerda ishlaydi
Poliklinikalar, shifoxonalar va diagnostika markazlarida.`,
      ru: `## О направлении
Студенты направления «Функциональная диагностика» изучают работу с аппаратами для оценки функций органов, оформление результатов обследований и подготовку пациентов к исследованиям.

## Что умеет выпускник
- проводить ЭКГ, ультразвуковые и другие функциональные исследования;
- готовить пациента к обследованию;
- оформлять результаты и передавать их врачу;
- соблюдать правила безопасной работы с медицинской аппаратурой.

## Где работает
В поликлиниках, больницах и диагностических центрах.`,
      en: `## About the program
Students of Functional Diagnostics learn to work with equipment that assesses how organs function, to record test results and to prepare patients for examinations.

## What graduates can do
- perform ECG, ultrasound and other functional tests;
- prepare patients for examinations;
- record results and pass them to the doctor;
- follow safety rules for working with medical equipment.

## Where graduates work
In polyclinics, hospitals and diagnostic centres.`,
    },
  },
};

const db = getDb();
const programs = await fetchAll(db, 'programs', '*');
const bodyColumn = programs.length > 0 && 'body' in programs[0];
if (!bodyColumn) console.log('Eslatma: programs.body ustuni yo‘q (migratsiya ishga tushirilmagan), batafsil matn yozilmaydi.');

const filled = (v) => v && typeof v === 'object' && Object.values(v).some(Boolean);
let changed = 0;
for (const p of programs) {
  const d = DATA[p.slug];
  if (!d) {
    console.log(`- ${p.slug}: qoralama yo‘q, tegilmadi`);
    continue;
  }
  const patch = {};
  for (const f of ['description', 'study_form', 'body']) {
    if (f === 'body' && !bodyColumn) continue;
    if (flag('overwrite') || !filled(p[f]) || (f === 'description' && p.description?.uz?.startsWith('Bitiruvchilar'))) patch[f] = d[f];
  }
  if (p.quota == null || flag('overwrite')) patch.quota = d.quota;
  const keys = Object.keys(patch);
  console.log(`- ${p.slug}: ${keys.length ? keys.join(', ') : 'o‘zgarish yo‘q'}`);
  if (!keys.length) continue;
  if (APPLY) {
    const { error } = await db.from('programs').update(patch).eq('id', p.id);
    if (error) console.log(`  XATO: ${error.message}`);
    else changed++;
  }
}
console.log(APPLY ? `Yangilandi: ${changed} ta yo‘nalish.` : 'Dry-run: --apply bilan yoziladi.');
