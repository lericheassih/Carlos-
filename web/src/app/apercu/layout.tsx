import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
