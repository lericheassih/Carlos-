#!/usr/bin/env node
// Crée (ou promeut) le compte administrateur principal.
// Usage : node --env-file=.env.local scripts/create-admin.mjs email@exemple.com "MotDePasseSolide" "Nom complet"
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName = null] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Usage : node --env-file=.env.local scripts/create-admin.mjs email "mot-de-passe (10 caractères min.)" "Nom"');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis."); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

let userId;
const created = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
if (created.error) {
  // Déjà existant : on le retrouve
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const u = list?.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  if (!u) { console.error("Erreur :", created.error.message); process.exit(1); }
  userId = u.id;
  await sb.auth.admin.updateUserById(userId, { password });
} else userId = created.data.user.id;

const { error } = await sb.from("admin_users").upsert({ user_id: userId, email, full_name: fullName, role: "owner" });
if (error) { console.error("Erreur :", error.message); process.exit(1); }
console.log(`✔ Administrateur prêt : ${email} (propriétaire)`);
