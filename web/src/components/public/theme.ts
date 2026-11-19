import type { SiteSettings } from "@/lib/site-settings";

const HEX = /^#[0-9a-f]{6}$/i;
export function siteStyle(s: SiteSettings): React.CSSProperties {
  return {
    ["--site-primary" as string]: HEX.test(s.primary_color) ? s.primary_color : "#1f4f99",
    ["--site-accent" as string]: HEX.test(s.accent_color) ? s.accent_color : "#9bc1f9",
  };
}
