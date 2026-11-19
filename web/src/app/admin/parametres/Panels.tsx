"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ShieldCheck, UserPlus } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toaster";
import { dateFr } from "@/lib/format";
import type { SiteSettings } from "@/lib/site-settings";
import { addMember, changePassword, removeMember, saveAppSettings, setMemberRole, updateProfile } from "./actions";

type R = { ok: boolean; error?: string; message?: string };
function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<R>, after?: () => void) => start(async () => { const r = await fn(); if (!r.ok) toast.error(r.error!); else { toast(r.message!); after?.(); router.refresh(); } });
  return { pending, run };
}

export function CompanyPanel({ s, currency, timezone }: { s: SiteSettings; currency: string; timezone: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Informations de l'entreprise" description="Ces informations sont affichées sur votre site." actions={<ButtonLink size="sm" href="/admin/site">Modifier</ButtonLink>} />
        <CardBody>
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Nom</dt><dd>{s.company_name}</dd>
            <dt className="text-muted">Téléphone</dt><dd>{s.phone || "—"}</dd>
            <dt className="text-muted">WhatsApp</dt><dd>{s.whatsapp ? `+${s.whatsapp}` : "—"}</dd>
            <dt className="text-muted">E-mail</dt><dd>{s.email || "—"}</dd>
            <dt className="text-muted">Adresse</dt><dd>{s.address || "—"}</dd>
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Région" />
        <CardBody>
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Devise</dt><dd>Franc CFA (FCFA · {currency})</dd>
            <dt className="text-muted">Fuseau horaire</dt><dd>{timezone} (GMT+0)</dd>
            <dt className="text-muted">Langue</dt><dd>Français</dd>
          </dl>
          <p className="mt-3 text-xs text-muted">Tous les montants sont enregistrés en FCFA entiers, et toutes les dates (statistiques, statuts automatiques) suivent l&apos;heure de Lomé.</p>
        </CardBody>
      </Card>
    </div>
  );
}

export function BookingPanel({ booking, notifications, canEdit }: { booking: { default_min_nights?: number; deposit_percent?: number; accept_website_requests?: boolean } | null; notifications: { new_request?: boolean; notify_email?: string } | null; canEdit: boolean }) {
  const { pending, run } = useAct();
  const [b, setB] = useState({ default_min_nights: booking?.default_min_nights ?? 1, deposit_percent: booking?.deposit_percent ?? 50, accept_website_requests: booking?.accept_website_requests ?? true });
  const [n, setN] = useState({ new_request: notifications?.new_request ?? true, notify_email: notifications?.notify_email ?? "" });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Paramètres de réservation" />
        <CardBody className="space-y-3">
          <Field label="Durée minimale par défaut (nouveaux appartements)" htmlFor="dmn"><Input id="dmn" type="number" min={1} value={b.default_min_nights} onChange={(e) => setB({ ...b, default_min_nights: Number(e.target.value) })} /></Field>
          <Field label="Acompte demandé (%)" htmlFor="dp" help="Indicatif, pour vos échanges avec les clients."><Input id="dp" type="number" min={0} max={100} value={b.deposit_percent} onChange={(e) => setB({ ...b, deposit_percent: Number(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={b.accept_website_requests} onChange={(e) => setB({ ...b, accept_website_requests: e.target.checked })} /> Accepter les demandes de réservation depuis le site</label>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Notifications" />
        <CardBody className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={n.new_request} onChange={(e) => setN({ ...n, new_request: e.target.checked })} /> Notification dans l&apos;administration à chaque nouvelle demande</label>
          <Field label="E-mail de notification (optionnel)" htmlFor="ne" help="L'envoi d'e-mails nécessite un service d'envoi (ex. Resend) : non activé pour l'instant. Les notifications internes fonctionnent.">
            <Input id="ne" type="email" value={n.notify_email} onChange={(e) => setN({ ...n, notify_email: e.target.value })} />
          </Field>
        </CardBody>
      </Card>
      <div className="lg:col-span-2 flex justify-end"><Button variant="primary" disabled={!canEdit} loading={pending} onClick={() => run(() => saveAppSettings({ booking: b, notifications: n }))}>Enregistrer</Button></div>
    </div>
  );
}

export function AccountPanel({ email, fullName, role }: { email: string; fullName: string; role: string }) {
  const { pending, run } = useAct();
  const [name, setName] = useState(fullName);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Profil" />
        <CardBody className="space-y-3">
          <Field label="E-mail de connexion" htmlFor="me"><Input id="me" value={email} disabled /></Field>
          <Field label="Nom" htmlFor="mn"><Input id="mn" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <p className="text-xs text-muted">Rôle : {role === "owner" ? "Propriétaire" : role === "admin" ? "Administrateur" : "Équipe"}</p>
          <Button loading={pending} onClick={() => run(() => updateProfile(name))}>Enregistrer</Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Changer de mot de passe" />
        <CardBody>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (pw.next !== pw.confirm) return toast.error("Les deux mots de passe ne correspondent pas."); run(() => changePassword(pw.current, pw.next), () => setPw({ current: "", next: "", confirm: "" })); }}>
            <Field label="Mot de passe actuel" htmlFor="pc"><Input id="pc" type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
            <Field label="Nouveau mot de passe" htmlFor="pn" help="10 caractères minimum, avec lettres et chiffres."><Input id="pn" type="password" autoComplete="new-password" required minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
            <Field label="Confirmer" htmlFor="pf"><Input id="pf" type="password" autoComplete="new-password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <Button type="submit" variant="primary" loading={pending}>Modifier le mot de passe</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

type Member = { user_id: string; email: string; full_name: string | null; role: string; created_at: string };
export function TeamPanel({ team, me, isOwner }: { team: Member[]; me: string; isOwner: boolean }) {
  const { pending, run } = useAct();
  const [f, setF] = useState({ email: "", password: "", name: "", role: "staff" as "admin" | "staff" });
  const [del, setDel] = useState<Member | null>(null);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader title="Membres de l'équipe" description="Propriétaire : tous les droits · Administrateur : tout sauf l'équipe · Équipe : gestion courante, sans suppression ni paramètres." />
        <ul className="mt-3 divide-y divide-line">
          {team.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1"><div className="font-medium">{m.full_name || m.email}{m.user_id === me && " (vous)"}</div><div className="text-xs text-muted">{m.email} · depuis le {dateFr(m.created_at)}</div></div>
              {m.role === "owner" || !isOwner || m.user_id === me ? <Badge tone={m.role === "owner" ? "brand" : "neutral"}>{m.role === "owner" ? "Propriétaire" : m.role === "admin" ? "Administrateur" : "Équipe"}</Badge> : (
                <>
                  <select className="input h-8 w-auto py-1" value={m.role} onChange={(e) => run(() => setMemberRole(m.user_id, e.target.value as "admin" | "staff"))}>
                    <option value="admin">Administrateur</option><option value="staff">Équipe</option>
                  </select>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDel(m)}>Retirer</Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>
      {isOwner && (
        <Card>
          <CardHeader title="Ajouter un membre" />
          <CardBody>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => addMember(f.email, f.password, f.name, f.role), () => setF({ email: "", password: "", name: "", role: "staff" })); }}>
              <Field label="Nom" htmlFor="tn"><Input id="tn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="E-mail" htmlFor="te"><Input id="te" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              <Field label="Mot de passe provisoire" htmlFor="tp" help="À changer par le membre dans « Mon compte »."><Input id="tp" type="text" required minLength={10} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
              <Field label="Rôle" htmlFor="tr"><Select id="tr" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "staff" })}><option value="staff">Équipe</option><option value="admin">Administrateur</option></Select></Field>
              <Button type="submit" variant="primary" loading={pending}><UserPlus className="size-4" /> Ajouter</Button>
            </form>
          </CardBody>
        </Card>
      )}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger loading={pending} title="Retirer l'accès ?" message={`${del?.email} ne pourra plus se connecter à l'administration.`} confirmLabel="Retirer"
        onConfirm={() => run(() => removeMember(del!.user_id), () => setDel(null))} />
    </div>
  );
}

export function DataPanel({ canExport }: { canExport: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Exporter mes données" description="Fichiers CSV compatibles Excel / Google Sheets : à conserver comme sauvegarde personnelle." />
        <CardBody className="flex flex-wrap gap-2">
          {["reservations", "clients", "paiements", "appartements"].map((t) => (
            canExport ? <a key={t} href={`/admin/export/${t}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-sm font-medium hover:bg-slate-50"><Download className="size-4" /> {t[0]!.toUpperCase() + t.slice(1)}</a>
              : null
          ))}
          {!canExport && <p className="text-sm text-muted">Réservé aux gérants.</p>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Sécurité" />
        <CardBody className="space-y-2 text-[13px] text-slate-600">
          <p className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /> Accès protégé par authentification Supabase ; chaque page et action vérifie votre rôle côté serveur.</p>
          <p className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /> Base de données protégée par des règles RLS : le site public ne lit que les données publiées.</p>
          <p className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /> Clés secrètes uniquement côté serveur (jamais envoyées au navigateur).</p>
          <p className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /> Sauvegardes : avec le plan Supabase Pro, la base est sauvegardée automatiquement chaque jour (7 jours conservés). Avec le plan gratuit, utilisez les exports CSV régulièrement. Voir <Link className="text-brand-600 underline" href="https://supabase.com/dashboard" target="_blank">votre tableau de bord Supabase</Link>.</p>
        </CardBody>
      </Card>
    </div>
  );
}
