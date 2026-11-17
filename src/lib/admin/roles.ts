// Client va server tomonidan bir xil ishlatiladigan rol tavsiflari (server-only importlarsiz)
export type AppRole = 'pending' | 'editor' | 'quality_editor' | 'super_admin';

export const ROLE_LABELS: Record<AppRole, string> = {
  pending: 'Kutilmoqda (huquqsiz)',
  editor: 'Muharrir (asosiy sayt)',
  quality_editor: "Ta'lim sifati muharriri",
  super_admin: 'Bosh admin',
};
