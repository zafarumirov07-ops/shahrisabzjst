'use client';

/** Panel sahifasida kutilmagan xato bo'lsa (masalan, baza javob bermasa) qayta urinish imkonini beradi. */
export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card space-y-3 p-8 text-center" role="alert">
      <h1 className="text-xl font-bold">Sahifani yuklab bo‘lmadi</h1>
      <p className="mx-auto max-w-md text-sm text-muted">
        Server yoki baza bilan aloqada muammo bo‘ldi. Bir ozdan keyin qayta urinib ko‘ring.
        {error.digest ? ` (kod: ${error.digest})` : ''}
      </p>
      <button type="button" className="btn" onClick={() => reset()}>
        Qayta urinish
      </button>
    </div>
  );
}
