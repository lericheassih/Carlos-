import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { normalizeSettings } from "@/lib/site-settings";
import { SiteEditor } from "./SiteEditor";

export default async function SitePage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("website_settings").select("draft, published, published_at").eq("id", 1).single();
  const draft = normalizeSettings(data?.draft), published = normalizeSettings(data?.published);
  return (
    <>
      <PageHeader title="Personnalisation du site" description="Modifiez l'apparence et les textes de votre site sans toucher au code." />
      <SiteEditor initial={draft} differs={JSON.stringify(draft) !== JSON.stringify(published)} publishedAt={data?.published_at ?? null} canEdit={admin.role !== "staff"} />
    </>
  );
}
