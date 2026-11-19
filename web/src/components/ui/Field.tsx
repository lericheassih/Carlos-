import { cn } from "@/lib/cn";

export function Field({ label, htmlFor, help, error, className, children, required }: {
  label?: React.ReactNode; htmlFor?: string; help?: React.ReactNode; error?: string | null; className?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className={className}>
      {label && <label htmlFor={htmlFor} className="label">{label}{required && <span className="text-red-600"> *</span>}</label>}
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-24 resize-y leading-relaxed", className)} {...props} />;
}
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("input pr-8", className)} {...props}>{children}</select>;
}

export function MoneyInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input type="number" inputMode="numeric" min={0} step="any" className={cn("input pr-16 tabular-nums", className)} {...props} />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted">FCFA</span>
    </div>
  );
}
