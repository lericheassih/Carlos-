export type ApartmentStatus = "draft" | "published" | "hidden" | "archived";
export type ExtraFee = { label: string; amount: number; per: "stay" | "night" | "guest" };

export type Pricing = {
  night: number;
  week: number | null;
  month: number | null;
  promo_night: number | null;
  promo_label: string | null;
  promo_start: string | null;
  promo_end: string | null;
  extra_fees: ExtraFee[];
  min_nights: number;
  conditions: string;
};

export type PublicMedia = {
  id: string;
  kind: "image" | "video";
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  is_cover: boolean;
};

export type PublicAmenity = { id: string; name: string; icon: string; category: string };

/** Instantané publié d'un appartement : c'est ce que voit le site public. */
export type ApartmentSnapshot = {
  id: string;
  slug: string;
  reference: string;
  name: string;
  short_description: string;
  description: string;
  city: string;
  neighborhood: string;
  property_type: string;
  bedrooms: number;
  living_rooms: number;
  bathrooms: number;
  max_guests: number;
  latitude: number | null;
  longitude: number | null;
  pricing: Pricing;
  booking_conditions: string;
  house_rules: string;
  check_in_time: string;
  check_out_time: string;
  amenities: PublicAmenity[];
  media: PublicMedia[];
  cover_url: string | null;
};

export type ApartmentRow = {
  id: string;
  reference: string;
  slug: string;
  status: ApartmentStatus;
  name: string;
  short_description: string;
  description: string;
  city: string;
  neighborhood: string;
  address: string;
  property_type: string;
  bedrooms: number;
  living_rooms: number;
  bathrooms: number;
  max_guests: number;
  latitude: number | null;
  longitude: number | null;
  price_night: number;
  price_week: number | null;
  price_month: number | null;
  promo_price_night: number | null;
  promo_label: string | null;
  promo_start: string | null;
  promo_end: string | null;
  extra_fees: ExtraFee[];
  min_nights: number;
  pricing_conditions: string;
  booking_conditions: string;
  house_rules: string;
  check_in_time: string;
  check_out_time: string;
  featured: boolean;
  sort_order: number;
  published: ApartmentSnapshot | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";
export type PaymentMethod = "cash" | "tmoney" | "flooz" | "bank_transfer" | "card" | "other";

export const STATUS_LABELS: Record<ApartmentStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  hidden: "Masqué",
  archived: "Archivé",
};
export const RES_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};
export const PAY_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Non payé",
  partial: "Acompte versé",
  paid: "Payé",
  refunded: "Remboursé",
};
export const PAY_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  tmoney: "T-Money",
  flooz: "Flooz (Moov Money)",
  bank_transfer: "Virement bancaire",
  card: "Carte bancaire",
  other: "Autre",
};
export const SOURCE_LABELS: Record<string, string> = {
  admin: "Saisie manuelle",
  website: "Site web",
  whatsapp: "WhatsApp",
  phone: "Téléphone",
  other: "Autre",
};
export const PROPERTY_TYPES = ["appartement", "studio", "villa", "maison", "chambre", "duplex", "penthouse"] as const;
