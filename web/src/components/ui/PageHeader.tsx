import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, description, back, actions, badge }: {
  title: React.ReactNode; description?: React.ReactNode; back?: string; actions?: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        {back && (
          <Link href={back} aria-label="Retour" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-slate-200/60 hover:text-ink">
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
