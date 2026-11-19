import Link from "next/link";

export function Pagination({ page, total, perPage, href }: { page: number; total: number; perPage: number; href: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px] text-muted">
      <span>{(page - 1) * perPage + 1}–{Math.min(total, page * perPage)} sur {total}</span>
      <div className="flex gap-2">
        {page > 1 && <Link className="rounded-lg border border-line bg-white px-3 py-1.5 font-medium text-ink hover:bg-slate-50" href={href(page - 1)}>Précédent</Link>}
        {page < pages && <Link className="rounded-lg border border-line bg-white px-3 py-1.5 font-medium text-ink hover:bg-slate-50" href={href(page + 1)}>Suivant</Link>}
      </div>
    </div>
  );
}
