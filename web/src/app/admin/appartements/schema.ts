import { z } from "zod";

const int = z.coerce.number().int().min(0).max(1_000_000_000);
const optInt = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.coerce.number().int().min(0).max(1_000_000_000).nullable());
const optDate = z.preprocess((v) => (v ? v : null), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());
const optCoord = (min: number, max: number) => z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.coerce.number().min(min).max(max).nullable());

export const ApartmentInput = z.object({
  name: z.string().trim().min(2, "Le nom est requis (2 caractères minimum).").max(160),
  slug: z.string().trim().max(90).optional().default(""),
  short_description: z.string().max(400).default(""),
  description: z.string().max(20000).default(""),
  city: z.string().trim().max(80).default(""),
  neighborhood: z.string().trim().max(120).default(""),
  address: z.string().trim().max(300).default(""),
  property_type: z.string().trim().max(40).default("appartement"),
  bedrooms: int.max(50),
  living_rooms: int.max(50),
  bathrooms: int.max(50),
  max_guests: z.coerce.number().int().min(1, "Capacité : au moins 1 personne.").max(100),
  latitude: optCoord(-90, 90),
  longitude: optCoord(-180, 180),
  price_night: int,
  price_week: optInt,
  price_month: optInt,
  promo_price_night: optInt,
  promo_label: z.string().max(80).nullable().default(null),
  promo_start: optDate,
  promo_end: optDate,
  extra_fees: z.array(z.object({ label: z.string().trim().min(1).max(80), amount: int, per: z.enum(["stay", "night", "guest"]) })).max(20).default([]),
  min_nights: z.coerce.number().int().min(1).max(365),
  pricing_conditions: z.string().max(4000).default(""),
  booking_conditions: z.string().max(8000).default(""),
  house_rules: z.string().max(8000).default(""),
  check_in_time: z.string().max(20).default("14:00"),
  check_out_time: z.string().max(20).default("12:00"),
  featured: z.boolean().default(false),
  amenity_ids: z.array(z.string().uuid()).max(200).default([]),
  media: z.array(z.object({ media_id: z.string().uuid(), is_cover: z.boolean(), caption: z.string().max(200).default("") })).max(200).default([]),
}).superRefine((v, ctx) => {
  if (v.promo_start && v.promo_end && v.promo_end < v.promo_start) ctx.addIssue({ code: "custom", message: "La fin de promotion doit suivre son début.", path: ["promo_end"] });
  if (v.promo_price_night !== null && v.promo_price_night >= v.price_night && v.price_night > 0) ctx.addIssue({ code: "custom", message: "Le tarif promotionnel doit être inférieur au prix par nuit.", path: ["promo_price_night"] });
});
export type ApartmentInput = z.infer<typeof ApartmentInput>;
