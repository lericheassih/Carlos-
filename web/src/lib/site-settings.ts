export type SiteSettings = {
  company_name: string;
  tagline: string;
  logo_url: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  primary_color: string;
  accent_color: string;
  hero_title: string;
  hero_subtitle: string;
  hero_images: string[];
  about_title: string;
  about_text: string;
  services: { title: string; text: string }[];
  advantages: string[];
  booking_conditions: string;
  cancellation_policy: string;
  contact_text: string;
  social: { facebook: string; instagram: string; tiktok: string };
  seo_title: string;
  seo_description: string;
  consent_mode: "notice" | "opt_in";
};

export const DEFAULT_SETTINGS: SiteSettings = {
  company_name: "Mon entreprise",
  tagline: "Appartements meublés",
  logo_url: null,
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  primary_color: "#1f4f99",
  accent_color: "#9bc1f9",
  hero_title: "Votre appartement meublé",
  hero_subtitle: "",
  hero_images: [],
  about_title: "Pourquoi nous choisir",
  about_text: "",
  services: [],
  advantages: [],
  booking_conditions: "",
  cancellation_policy: "",
  contact_text: "",
  social: { facebook: "", instagram: "", tiktok: "" },
  seo_title: "",
  seo_description: "",
  consent_mode: "notice",
};

export function normalizeSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...r,
    hero_images: Array.isArray(r.hero_images) ? r.hero_images.filter((x) => typeof x === "string") : [],
    services: Array.isArray(r.services) ? r.services : [],
    advantages: Array.isArray(r.advantages) ? r.advantages : [],
    social: { ...DEFAULT_SETTINGS.social, ...(r.social ?? {}) },
  };
}
