import { notFound } from 'next/navigation';

/** Mavjud bo'lmagan barcha yo'llar sayt dizaynidagi 404 sahifaga tushadi. */
export default function CatchAll() {
  notFound();
}
