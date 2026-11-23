"""Collecte d'images libres de droits sur Wikimedia Commons (licences CC0 / domaine public / CC BY).
Usage : python3 lumo/scripts/fetch_images.py <dossier_sortie> "requête 1" "requête 2" ...
Écrit <dossier>/candidats.json (crédits + licence) et télécharge des vignettes 2560 px."""
import json, os, re, sys, time, urllib.parse, urllib.request

UA = "LumoAdCampaign/1.0 (video production; contact via operator)"
API = "https://commons.wikimedia.org/w/api.php"
OK = re.compile(r"^(cc0|public domain|pd.*|cc by [0-9.]+|cc by [0-9.]+ [a-z]+|attribution)$", re.I)


def get(url, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:  # 429 / réseau : on attend (Wikimedia limite le débit)
            print("   attente", getattr(e, "code", e), flush=True)
            time.sleep(45 + 30 * i)
    raise RuntimeError(url)


def search(q, n=24):
    p = dict(action="query", generator="search", gsrsearch=f"{q} filetype:bitmap filew:>1900 -HABS -\"Historic American\"", gsrnamespace=6, gsrlimit=n,
             prop="imageinfo", iiprop="url|size|extmetadata", iiurlwidth=2400, format="json")
    d = json.loads(get(API + "?" + urllib.parse.urlencode(p)))
    out = []
    for pg in d.get("query", {}).get("pages", {}).values():
        ii = pg["imageinfo"][0]; m = ii.get("extmetadata", {})
        lic = re.sub("<[^>]+>", "", m.get("LicenseShortName", {}).get("value", "")).strip()
        if "sa" in lic.lower().split() or not OK.match(lic):
            continue
        if ii["width"] < 1900 or ii["width"] < ii["height"] * 0.9:
            continue
        artist = re.sub("<[^>]+>", "", m.get("Artist", {}).get("value", "")).strip()
        out.append(dict(title=pg["title"], query=q, width=ii["width"], height=ii["height"], license=lic,
                        artist=artist, page=ii["descriptionurl"], url=ii.get("thumburl") or ii["url"]))
    return out


def main():
    out_dir, queries = sys.argv[1], sys.argv[2:]
    os.makedirs(out_dir, exist_ok=True)
    db_path = os.path.join(out_dir, "candidats.json")
    db = json.load(open(db_path)) if os.path.exists(db_path) else {}
    for q in queries:
        for c in search(q):
            key = re.sub(r"[^a-z0-9]+", "_", c["title"].lower())[5:60].strip("_")
            if key in db:
                continue
            path = os.path.join(out_dir, key + ".jpg")
            try:
                data = get(c["url"])
            except RuntimeError:
                continue
            open(path, "wb").write(data)
            c["file"] = os.path.basename(path); db[key] = c
            time.sleep(4)
        print(q, "->", len(db)); json.dump(db, open(db_path, "w"), ensure_ascii=False, indent=1)
        time.sleep(15)


if __name__ == "__main__":
    main()
