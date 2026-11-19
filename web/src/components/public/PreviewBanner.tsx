import Link from "next/link";

export function PreviewBanner({ back, text }: { back: string; text: string }) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950">
      <span>👁 Aperçu — {text}</span>
      <Link href={back} className="rounded-lg bg-amber-950 px-3 py-1 text-white">Retour à l&apos;administration</Link>
    </div>
  );
}
