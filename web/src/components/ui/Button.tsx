import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "plain";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_1px_2px_rgba(0,0,0,0.2)] hover:bg-black",
  secondary: "border border-line bg-white text-ink shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-slate-50",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "text-ink hover:bg-slate-100",
  plain: "text-brand-600 hover:text-brand-700 hover:underline",
};
const sizes: Record<Size, string> = { sm: "h-8 px-2.5 text-[13px]", md: "h-9 px-3.5 text-sm", lg: "h-11 px-5 text-[15px]" };

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant = "secondary", size = "md", loading, className, children, disabled, ...rest }: Props) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href, variant = "secondary", size = "md", className, children, ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
