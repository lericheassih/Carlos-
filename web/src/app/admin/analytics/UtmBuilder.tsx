"use client";
import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";

const PRESETS = {
  facebook: { source: "facebook", medium: "paid_social" },
  instagram: { source: "instagram", medium: "paid_social" },
  tiktok: { source: "tiktok", medium: "paid_social" },
  google: { source: "google", medium: "cpc" },
  whatsapp: { source: "whatsapp", medium: "social" },
};

/** Générateur de liens trackés pour vos publicités. */
export function UtmBuilder({ siteUrl, apartments }: { siteUrl: string; apartments: { slug: string; name: string }[]; hasSite: boolean }) {
  const [v, setV] = useState({ page: "", source: "facebook", medium: "paid_social", campaign: "", content: "", term: "" });
  const url = useMemo(() => {
    const base = (siteUrl || (typeof window !== "undefined" ? location.origin : "")).replace(/\/$/, "") + (v.page ? `/appartements/${v.page}` : "/");
    const p = new URLSearchParams();
    if (v.source) p.set("utm_source", v.source);
    if (v.medium) p.set("utm_medium", v.medium);
    if (v.campaign) p.set("utm_campaign", v.campaign);
    if (v.content) p.set("utm_content", v.content);
    if (v.term) p.set("utm_term", v.term);
    return `${base}?${p}`;
  }, [v, siteUrl]);
  return (
    <Card className="mt-4">
      <CardHeader title="Générateur de liens pour vos publicités" description="Collez ce lien dans votre publicité Facebook, Instagram, TikTok ou Google : les visites seront attribuées à la campagne." />
      <CardBody className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Page de destination" htmlFor="up">
            <Select id="up" value={v.page} onChange={(e) => setV({ ...v, page: e.target.value })}>
              <option value="">Page d&apos;accueil</option>
              {apartments.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Plateforme" htmlFor="ups">
            <Select id="ups" value={v.source} onChange={(e) => { const k = e.target.value as keyof typeof PRESETS; setV({ ...v, ...(PRESETS[k] ?? { source: e.target.value }) }); }}>
              {Object.keys(PRESETS).map((k) => <option key={k} value={k}>{k[0]!.toUpperCase() + k.slice(1)}</option>)}
            </Select>
          </Field>
          <Field label="Nom de la campagne" htmlFor="upc"><Input id="upc" value={v.campaign} onChange={(e) => setV({ ...v, campaign: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="ex. sejour_pro_decembre" /></Field>
          <Field label="utm_medium" htmlFor="upm"><Input id="upm" value={v.medium} onChange={(e) => setV({ ...v, medium: e.target.value })} /></Field>
          <Field label="utm_content (variante)" htmlFor="upx"><Input id="upx" value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} placeholder="ex. video_a" /></Field>
          <Field label="utm_term" htmlFor="upt"><Input id="upt" value={v.term} onChange={(e) => setV({ ...v, term: e.target.value })} /></Field>
        </div>
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
          <Button onClick={() => { navigator.clipboard.writeText(url); toast("Lien copié."); }}><Copy className="size-4" /> Copier</Button>
        </div>
      </CardBody>
    </Card>
  );
}
