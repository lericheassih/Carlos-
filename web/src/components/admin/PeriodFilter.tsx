import { LinkTabs } from "@/components/ui/Tabs";

export function PeriodFilter({ base, active, items, extra = "" }: { base: string; active: string; items: { key: string; label: string }[]; extra?: string }) {
  return <LinkTabs active={active} items={items.map((p) => ({ key: p.key, label: p.label, href: `${base}?periode=${p.key}${extra}` }))} />;
}
