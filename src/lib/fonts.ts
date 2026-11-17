import { Manrope } from 'next/font/google';

/** Lotin (o'zbek belgilari bilan), kirill va ingliz tillarini qo'llaydigan zamonaviy shrift */
export const sans = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});
