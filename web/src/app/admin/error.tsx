"use client";
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-6 text-center">
      <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
      <p className="mt-2 text-sm text-muted">{error.message || "Impossible de charger cette page."}</p>
      <p className="mt-1 text-xs text-muted">Vérifiez votre connexion internet puis réessayez.</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Réessayer</button>
    </div>
  );
}
