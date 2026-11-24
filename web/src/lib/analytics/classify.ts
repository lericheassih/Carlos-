/** Classement des sources de trafic, appareil et détection de robots (côté serveur). */

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegrambot|twitterbot|linkedinbot|embedly|quora link|pinterest|vkshare|w3c_validator|lighthouse|pagespeed|headlesschrome|phantomjs|puppeteer|playwright|selenium|python-requests|curl|wget|axios|node-fetch|go-http-client|java\/|okhttp|scrapy|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baiduspider|gptbot|chatgpt|claudebot|anthropic|perplexity|bytespider|amazonbot|applebot|duckduckbot|uptime|monitor|statuscake|pingdom/i;

export function isBot(ua: string | null | undefined): boolean {
  if (!ua || ua.length < 20) return true;
  return BOT_RE.test(ua);
}

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))|kindle|silk/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

export function browserOf(ua: string): string {
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook (in-app)";
  if (/Instagram/i.test(ua)) return "Instagram (in-app)";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "TikTok (in-app)";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Autre";
}

export function osOf(ua: string): string {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Autre";
}

export type Channel = "facebook" | "instagram" | "tiktok" | "google" | "direct" | "referral" | "whatsapp" | "email" | "other";

const PAID_MEDIUMS = /^(cpc|ppc|paid|paidsocial|paid_social|paid-social|ads?|cpm|display|sponsored|social_paid|meta_ads|facebook_ads)$/i;

function channelFromName(s: string): Channel | null {
  const v = s.toLowerCase();
  if (/(^|\.)(facebook|fb)\b|^fb$|^facebook|^meta$|messenger/.test(v)) return "facebook";
  if (/instagram|^ig$/.test(v)) return "instagram";
  if (/tiktok/.test(v)) return "tiktok";
  if (/google|gclid|^adwords$/.test(v)) return "google";
  if (/whatsapp|^wa$/.test(v)) return "whatsapp";
  if (/mail|newsletter/.test(v)) return "email";
  return null;
}

export function classifySource(input: {
  referrer?: string | null;
  host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  click_ids?: { fbclid?: boolean; gclid?: boolean; ttclid?: boolean };
}): { channel: Channel; is_paid: boolean; referrer_domain: string | null } {
  let refDomain: string | null = null;
  if (input.referrer) {
    try {
      refDomain = new URL(input.referrer).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      refDomain = null;
    }
  }
  if (refDomain && input.host && refDomain === input.host.replace(/^www\./, "").toLowerCase()) refDomain = null; // navigation interne

  const medium = input.utm_medium ?? "";
  let isPaid = PAID_MEDIUMS.test(medium) || !!input.click_ids?.gclid;

  let channel: Channel | null = null;
  if (input.utm_source) channel = channelFromName(input.utm_source) ?? (medium && /mail/i.test(medium) ? "email" : "other");
  if (!channel && input.click_ids?.gclid) channel = "google";
  if (!channel && input.click_ids?.ttclid) { channel = "tiktok"; }
  if (!channel && input.click_ids?.fbclid) channel = "facebook";
  if (!channel && refDomain) {
    if (/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$|messenger\.com$/.test(refDomain)) channel = "facebook";
    else if (/instagram\.com$/.test(refDomain)) channel = "instagram";
    else if (/tiktok\.com$/.test(refDomain)) channel = "tiktok";
    else if (/(^|\.)google\.[a-z.]+$/.test(refDomain)) channel = "google";
    else if (/whatsapp\.com$|wa\.me$/.test(refDomain)) channel = "whatsapp";
    else if (/mail\./.test(refDomain)) channel = "email";
    else channel = "referral";
  }
  if (!channel) channel = "direct";
  if (channel === "direct") isPaid = false;
  return { channel, is_paid: isPaid, referrer_domain: refDomain };
}

export const CHANNEL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google",
  direct: "Accès direct",
  referral: "Sites référents",
  whatsapp: "WhatsApp",
  email: "E-mail",
  paid: "Campagnes publicitaires",
  other: "Autres sources",
};
