import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function StatCard({ label, value, hint, delta, icon, href, tone }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; delta?: number | null; icon?: React.ReactNode; href?: string; tone?: "warning";
}) {
  const body = (
    <div className={cn("card h-full p-4 transition", href && "hover:shadow-md hover:ring-1 hover:ring-line")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && <span className={cn("grid size-7 place-items-center rounded-lg", tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>{icon}</span>}
      </div>
      <div className="mt-2 text-[26px] font-semibold leading-tight tracking-tight tabular-nums text-ink">{value}</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
        {typeof delta === "number" && Number.isFinite(delta) && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-emerald-700" : "text-red-600")}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(0)} %
          </span>
        )}
        {hint}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function deltaPct(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}
