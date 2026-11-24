import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion — Administration", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-ink text-lg font-bold text-white">A</div>
          <h1 className="text-xl font-semibold">Administration</h1>
          <p className="mt-1 text-sm text-muted">Connectez-vous pour gérer vos appartements.</p>
        </div>
        <div className="card p-5">
          {sp.erreur === "acces" && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Ce compte n&apos;a pas accès à l&apos;administration.</p>
          )}
          <LoginForm next={sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/admin"} />
        </div>
        <p className="mt-4 text-center text-xs text-muted"><Link href="/" className="hover:underline">← Retour au site</Link></p>
      </div>
    </div>
  );
}
