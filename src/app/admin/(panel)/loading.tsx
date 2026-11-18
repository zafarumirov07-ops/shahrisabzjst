import { Spinner } from '@/components/admin/AdminNav';

/** Panelda sahifa almashganda darrov ko'rinadi (ma'lumot serverdan kelguncha). */
export default function PanelLoading() {
  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-label="Yuklanmoqda">
      <div className="flex items-center gap-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface2" />
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          <Spinner className="h-4 w-4 text-accent" />
          Yuklanmoqda…
        </span>
      </div>
      <div className="card overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-0">
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface2" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-surface2" />
          </div>
        ))}
      </div>
    </div>
  );
}
