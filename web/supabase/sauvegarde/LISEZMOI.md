# Sauvegarde du contenu LUMO

Le contenu saisi dans l'administration (logements, photos, équipements, réglages du site) vit dans la base Supabase, pas dans le code.
Ce dossier en garde une copie pour le transférer vers le projet Supabase en ligne, ou le retrouver si la base locale est perdue.

- `donnees.sql` : logements, équipements, photos (références), liens logement ↔ photos, réglages du site. **Sans** clients, réservations, statistiques ni comptes.
- `media/` : les fichiers photo, aux mêmes chemins que dans le bucket `media`.

## Restaurer dans un projet Supabase
1. Appliquer les migrations : `npx supabase db push` (projet lié).
2. Charger les données dans une base **sans logements** : `psql "<URL de connexion>" -v ON_ERROR_STOP=1 -f supabase/sauvegarde/donnees.sql`
3. Envoyer les photos : `NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/restaurer-medias.mjs`
4. Créer le compte administrateur : `npm run create-admin`.

## Mettre à jour la sauvegarde
Avec la base locale démarrée, depuis `web/` : `python3 scripts/sauvegarder-contenu.py` (données et photos).
