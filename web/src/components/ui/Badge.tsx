import { cn } from "@/lib/cn";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "attention" | "brand";
const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  attention: "bg-orange-50 text-orange-800 ring-orange-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/15",
  info: "bg-sky-50 text-sky-700 ring-sky-600/15",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
};

export function Badge({ tone = "neutral", dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
