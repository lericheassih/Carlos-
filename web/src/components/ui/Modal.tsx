"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export function Modal({ open, onClose, title, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40" onClick={onClose} />
      <div ref={ref} className={cn("relative flex max-h-[92dvh] w-full animate-slide-up flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl", w)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-slate-100" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", danger, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: React.ReactNode; confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading} data-autofocus>{confirmLabel}</Button>
      </>}>
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  );
}
