"use client";
import { track } from "@/lib/analytics/client";
import { waLink } from "@/lib/format";

/** Lien WhatsApp suivi (chaque clic est compté, par appartement le cas échéant). */
export function WhatsAppLink({ number, message, apartmentId, placement, className, children, onClick }: {
  number: string; message: string; apartmentId?: string; placement: string; className?: string; children: React.ReactNode; onClick?: () => void;
}) {
  if (!number) return null;
  return (
    <a href={waLink(number, message)} target="_blank" rel="noopener noreferrer" className={className}
      onClick={() => { track("whatsapp_click", { apartment_id: apartmentId, metadata: { placement } }); onClick?.(); }}>
      {children}
    </a>
  );
}

export function PhoneLink({ phone, apartmentId, placement, className, children }: { phone: string; apartmentId?: string; placement: string; className?: string; children: React.ReactNode }) {
  if (!phone) return null;
  return (
    <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className={className} onClick={() => track("phone_click", { apartment_id: apartmentId, metadata: { placement } })}>
      {children}
    </a>
  );
}
