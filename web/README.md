# LUMO — Plateforme de gestion d'appartements meublés

Administration privée façon Shopify + site public façon Airbnb, connectés à une vraie base de données.
**Toute publication dans l'administration est visible immédiatement sur le site, sans toucher au code ni redéployer.**

| | |
|---|---|
| Site public | `https://votre-domaine.com` |
| Administration | `https://votre-domaine.com/admin` (connexion : `/connexion`) |

## 1. Architecture

```
Navigateur ──► Next.js 15 (Vercel)
                ├─ Site public  (/ , /appartements, /appartements/[slug])  ← lit uniquement les vues « publiées »
                ├─ Administration (/admin/*)  ← Supabase Auth + vérification du rôle côté serveur
                ├─ /api/track            ← collecte analytics first-party (robots filtrés, sans IP)
                ├─ /api/booking-request  ← demandes de réservation (prix recalculé côté serveur)
                └─ /api/availability     ← dates indisponibles (sans données client)
                         │
                         ▼
               Supabase : PostgreSQL (RLS) · Auth · Storage (photos/vidéos) · Realtime
```

* **Next.js 15 + TypeScript + Tailwind CSS 4**, graphiques **Recharts**.
* **Supabase PostgreSQL** : 16 tables, contraintes, index, politiques **RLS** sur toutes les tables.
* **Supabase Storage** (bucket `media`) : images redimensionnées et converties en WebP dans le navigateur avant envoi (rapide en 3G), servies optimisées (AVIF/WebP) par `next/image`.
* **Supabase Realtime** : notifications de nouvelles demandes et compteur de visiteurs actualisés en direct (plus une actualisation toutes les 10 s par sécurité).
* **Analytics first-party** stockées dans votre base (consultables dans l'admin). Google Analytics 4 est **optionnel** (`NEXT_PUBLIC_GA_ID`), chargé uniquement après consentement.

### Brouillon / publication
Chaque appartement possède ses **données de travail** et un **instantané publié** (`apartments.published`).
* **Enregistrer** → met à jour les données de travail (le site ne change pas).
* **Prévisualiser** → `/apercu/appartement/[id]` affiche la version enregistrée (réservé aux admins).
* **Publier** → copie l'instantané : le site affiche la nouvelle version à la requête suivante.
* **Masquer / Archiver** → retiré du site immédiatement (page publique en 404).

La personnalisation du site fonctionne de la même façon (`website_settings.draft` / `published`).
Les **disponibilités** (réservations confirmées, dates bloquées) sont toujours en direct.

### Base de données (`supabase/migrations`)
| Table | Rôle |
|---|---|
| `apartments` | fiches (infos, tarifs nuit/semaine/mois, promo, frais, conditions, statut, instantané publié) |
| `amenities`, `apartment_amenities` | équipements (liste standard + équipements personnalisés) |
| `media`, `apartment_media` | médiathèque centrale ; un média peut servir dans plusieurs fiches (remplace `apartment_images`/`apartment_videos`), ordre + photo principale |
| `customers` | clients (dédoublonnés par téléphone/WhatsApp) |
| `reservations` | réservations ; **contrainte d'exclusion** : deux séjours confirmés/en cours ne peuvent pas se chevaucher |
| `payments` | acomptes, soldes, remboursements → « avance versée », « reste à payer », statut de paiement calculés automatiquement |
| `blocked_dates` | dates bloquées manuellement (incompatibles avec une réservation confirmée) |
| `reviews` | avis, visibles sur le site uniquement s'ils sont publiés |
| `website_settings`, `app_settings` | personnalisation (brouillon/publié) et paramètres |
| `notifications` | notifications de l'administration (nouvelle demande du site) |
| `visitor_sessions`, `analytics_events` | analytics (sessions anonymes, événements dédupliqués par `event_id`) |
| `admin_users` | équipe et rôles : `owner` (tout), `admin` (tout sauf l'équipe), `staff` (pas de suppression ni de paramètres) |

Les statuts « En cours » / « Terminée » sont mis à jour automatiquement selon la date du jour à Lomé.

### Analytics
* **Visiteur actif** = signal reçu dans les 60 dernières secondes (battement toutes les 20 s quand l'onglet est visible). Les visiteurs plus anciens ne sont jamais présentés comme « en ligne ».
* **Session** : 30 min d'inactivité, ou nouvelle campagne UTM.
* **Sources** : `utm_source/medium/campaign/content/term`, identifiants de clic publicitaire (`fbclid`, `gclid`, `ttclid`), sinon site référent → Facebook, Instagram, TikTok, Google, Accès direct, Sites référents, Campagnes publicitaires, Autres.
* **Pays / ville** : fournis par l'en-tête géographique de Vercel (`x-vercel-ip-country`, `x-vercel-ip-city`). Hors Vercel ou si absent : « Inconnu » — jamais deviné. **Aucune adresse IP n'est stockée.**
* **Événements** : page vue, consultation d'appartement, consultation des tarifs, clic WhatsApp, clic téléphone, demande initiée (sélection de dates), demande envoyée. Les **réservations confirmées** viennent du système de réservation (pas d'un clic).
* Robots, aperçus de liens (WhatsApp, Facebook…) et navigateurs automatisés exclus.
* Consentement : bandeau d'information avec refus possible (ou consentement préalable, réglable dans *Personnalisation du site*). Page `/confidentialite`.

## 2. Mise en production (≈ 30 minutes)

### Ce dont vous avez besoin
1. Un compte **Supabase** (gratuit pour démarrer ; plan Pro recommandé ensuite pour les sauvegardes quotidiennes automatiques).
2. Un compte **Vercel** (gratuit) relié à GitHub.
3. Votre **nom de domaine** (optionnel au départ).

### Étape 1 — Supabase
1. Créez un projet sur <https://supabase.com/dashboard> (région conseillée : *West EU (Paris/London)*, la plus proche du Togo).
2. Appliquez le schéma, au choix :
   * **Ligne de commande** (depuis `web/`) : `npx supabase login`, `npx supabase link --project-ref VOTRE_REF`, puis `npm run db:push` ;
   * **ou** copiez/collez dans *SQL Editor*, dans l'ordre, `supabase/migrations/20261119000001_schema.sql` puis `20261119000002_security_and_functions.sql`.
3. (Facultatif) Importez vos 3 logements actuels en brouillon : exécutez `supabase/seed.sql` dans *SQL Editor*.
4. Récupérez dans *Project Settings → API* : `Project URL`, la clé `anon` et la clé `service_role`.
5. *Authentication → Sign In / Providers* : désactivez les inscriptions publiques (**Allow new users to sign up = off**). Seuls les comptes que vous créez peuvent se connecter.

### Étape 2 — Vercel
1. *Add New → Project*, importez le dépôt GitHub, **Root Directory = `web`**.
2. Variables d'environnement :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` (publique, protégée par la RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` — **secrète**, jamais préfixée `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | `https://votre-domaine.com` (ou l'URL `.vercel.app`) |
| `NEXT_PUBLIC_GA_ID` | *(facultatif)* identifiant Google Analytics 4 `G-XXXX` |

3. *Deploy*. Puis *Settings → Domains* pour brancher votre domaine.

### Étape 3 — Compte administrateur
Depuis votre ordinateur (dans `web/`, avec un fichier `.env.local` contenant les 3 variables Supabase) :
```bash
npm install
npm run create-admin -- votre@email.com "UnMotDePasseSolide2026" "Votre Nom"
```
Connectez-vous ensuite sur `https://votre-domaine.com/connexion`. Les autres membres s'ajoutent dans *Paramètres → Équipe*.

### Étape 4 — Premiers réglages
*Personnalisation du site* (logo, couleurs, WhatsApp, textes, images de couverture) → **Publier**.
*Mes appartements* → ajoutez les photos des logements importés → **Publier**.

## 3. Développement local
Prérequis : Node 20+, Docker.
```bash
cd web
npm install
npx supabase start          # base, auth, stockage, realtime en local
cp .env.example .env.local  # puis collez les clés affichées par « supabase start »
npm run db:reset            # applique les migrations + seed
npm run create-admin -- admin@test.local "MotDePasse-Test-2026" "Admin"
npm run dev                 # http://localhost:3000
```

### Tests
* `npm run typecheck` et `npm run lint`
* **Test de bout en bout** (38 vérifications, navigateur réel) : `npm run build && npm start`, puis `npm run test:e2e`.
  Il couvre : connexion et protection des routes, création d'appartement avec téléversement de photos, publication et synchronisation du site, brouillon vs publié, prévisualisation, devis et message WhatsApp prérempli, demande de réservation depuis le site, confirmation, acompte, calendrier, blocage de dates, double réservation refusée, visiteurs en temps réel, clics WhatsApp, UTM, filtrage des robots, tableau de bord, masquage, accès anonyme à l'API refusé.

## 4. Ce qui n'est pas inclus (volontairement)
* **Paiement en ligne** (Mobile Money / carte) : les paiements sont enregistrés manuellement dans chaque réservation. Une intégration (ex. PayDunya, CinetPay, FedaPay) nécessitera un compte marchand.
* **E-mails automatiques** : les notifications apparaissent dans l'administration ; l'envoi d'e-mails nécessite un service d'envoi (ex. Resend) et sa clé API.
* **Carte interactive** : un lien Google Maps est affiché (latitude/longitude facultatives dans la fiche).

## 5. Sécurité
* Authentification Supabase ; middleware + vérification serveur du rôle sur chaque page et action.
* RLS sur toutes les tables ; le rôle anonyme ne lit que `public_apartments`, `public_reviews`, `public_site` (données publiées) et la fonction de disponibilités (sans données client).
* Validation de toutes les entrées (Zod) ; requêtes paramétrées (pas d'injection SQL) ; protection des exports CSV contre l'injection de formules.
* Prix des demandes de réservation recalculés côté serveur ; pot de miel et limitation de débit anti-spam.
* En-têtes de sécurité (HSTS, X-Frame-Options, nosniff, Referrer-Policy) ; administration non indexée (`noindex`, `robots.txt`).
* Sauvegardes : exports CSV dans *Paramètres → Données* ; sauvegardes quotidiennes automatiques avec Supabase Pro.
