import subprocess, re, os, json
T = ["amenities", "media", "apartments", "apartment_amenities", "apartment_media", "website_settings", "app_settings"]
q = lambda s: subprocess.run(["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-tAc", s], env={**os.environ, "PGPASSWORD": "postgres"}, capture_output=True, text=True, check=True).stdout.split()
test_ids = q("select id from apartments where slug like 'appartement-test-%'")
args = ["docker", "exec", "supabase_db_lumo", "pg_dump", "-U", "postgres", "--data-only", "--column-inserts", "-d", "postgres"] + sum([["-t", "public." + t] for t in T], [])
out = subprocess.run(args, capture_output=True, text=True, check=True).stdout
stm, buf = [], []
for l in out.splitlines():
    if buf or l.startswith("INSERT"):
        buf.append(l)
        if l.endswith(");"): stm.append("\n".join(buf)); buf = []
    else: stm.append(l)
keep = []
for l in stm:
    if l.startswith("INSERT") and any(i in l for i in test_ids): continue
    if l.startswith("INSERT INTO public.media "):
        l = re.sub(r"'[0-9a-f-]{36}', '(\d{4}-\d\d-\d\d [^']+)'\);$", r"NULL, '\1');", l)
    keep.append(l)
sql = "\n".join(keep)
sql = sql.replace("INSERT INTO public.website_settings", "DELETE FROM public.website_settings;\nINSERT INTO public.website_settings", 1).replace("INSERT INTO public.app_settings", "DELETE FROM public.app_settings;\nINSERT INTO public.app_settings", 1)
open("supabase/sauvegarde/donnees.sql", "w").write("-- Sauvegarde du contenu LUMO (logements, photos, équipements, réglages du site). Sans réservations ni clients de test.\n-- Restauration : voir supabase/sauvegarde/LISEZMOI.md\n" + sql + "\n")
paths = q("select m.storage_path from media m where not exists (select 1 from apartment_media am join apartments a on a.id=am.apartment_id where am.media_id=m.id and a.slug like 'appartement-test-%')")
print(len(paths), "médias ;", sql.count("INSERT INTO public.apartments "), "logements ;", "created_by restant:", len(re.findall(r"INSERT INTO public.media .*'[0-9a-f-]{36}', '\d{4}", sql)))
json.dump(paths, open("/tmp/claude-0/paths.json", "w"))
