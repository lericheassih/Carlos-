/* Rend le site statique interactif : calendrier et prix, galerie, filtres, pixel Meta (après consentement). */
(function () {
  var APTS = window.__APTS || {}, SITE = window.__SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Couleurs du site disponibles aussi pour les fenêtres ajoutées au document
  var themed = document.querySelector("[style*='--site-primary']");
  if (themed) ["--site-primary", "--site-accent"].forEach(function (k) { var v = themed.style.getPropertyValue(k); if (v) document.documentElement.style.setProperty(k, v); });

  // ---- Bandeau d'aperçu (copie de démonstration uniquement)
  if (SITE.preview) {
  var bar = document.createElement("div");
  bar.style.cssText = "background:#fde68a;color:#422006;font:500 13px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:8px 16px";
  bar.textContent = "Aperçu de votre site LUMO (copie de démonstration). Le bouton WhatsApp fonctionne ; l'envoi de demandes sera actif une fois le site en ligne.";
  document.body.insertBefore(bar, document.body.firstChild);
  }

  // ---- Pixel Meta : chargé seulement après l'accord du visiteur
  var CK = "lm_consent", px = { on: false, q: [] };
  var store = { get: function () { try { return localStorage.getItem(CK); } catch (e) { return null; } }, set: function (v) { try { localStorage.setItem(CK, v); } catch (e) {} } };
  var eid = function () { return "lm-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); };
  var track = function (name, params) {
    if (!SITE.pixel) return;
    if (px.on) window.fbq("track", name, params || {}, { eventID: eid() }); else px.q.push([name, params]);
  };
  var loadPixel = function () {
    if (!SITE.pixel || px.on) return;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", SITE.pixel);
    window.fbq("track", "PageView", {}, { eventID: eid() });
    px.on = true;
    px.q.splice(0).forEach(function (e) { track(e[0], e[1]); });
  };
  if (SITE.pixel && !SITE.preview) {
    var choice = store.get();
    if (choice === "granted") loadPixel();
    else if (choice !== "denied") {
      var cb = document.createElement("div");
      cb.setAttribute("role", "dialog"); cb.setAttribute("aria-label", "Cookies");
      cb.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;background:#fff;color:#222;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.2);padding:16px;font:14px/1.45 Figtree,system-ui,sans-serif";
      cb.innerHTML = '<p style="margin:0 0 12px">Nous utilisons des cookies de mesure (Meta) pour savoir quelles publicités vous ont amené ici et améliorer nos annonces. <a href="confidentialite.html" style="text-decoration:underline">En savoir plus</a></p>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-c="denied" style="padding:10px 16px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;font-weight:600;cursor:pointer">Refuser</button>' +
        '<button type="button" data-c="granted" style="padding:10px 16px;border-radius:10px;border:0;background:#222;color:#fff;font-weight:600;cursor:pointer">Accepter</button></div>';
      cb.addEventListener("click", function (e) { var v = e.target.getAttribute && e.target.getAttribute("data-c"); if (!v) return; store.set(v); cb.remove(); if (v === "granted") loadPixel(); });
      document.body.appendChild(cb);
    }
  }
  // Page Confidentialité : boutons Accepter / Refuser
  if (/confidentialite/.test(location.pathname)) {
    $$("main button").forEach(function (b) {
      var v = /Accepter/.test(b.textContent) ? "granted" : /Refuser/.test(b.textContent) ? "denied" : null;
      if (!v) return;
      var st = b.parentElement.querySelector("strong"), lab = function (c) { return c === "granted" ? "acceptée" : c === "denied" ? "refusée" : "non choisie"; };
      if (st) st.textContent = lab(store.get());
      b.onclick = function () { store.set(v); if (st) st.textContent = lab(v); if (v === "granted") loadPixel(); else location.reload(); };
    });
  }
  // Clic vers WhatsApp ou appel : l'action qui compte (une réservation passe par WhatsApp)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"], a[href^="tel:"]');
    if (!a || a.getAttribute("href") === "#") return;
    var slugNow = (location.pathname.split("/").pop() || "").replace(".html", ""), ap = APTS[slugNow];
    track("Contact", { content_name: ap ? ap.name : "site", method: /^tel:/.test(a.getAttribute("href")) ? "telephone" : "whatsapp" });
  }, true);

  // ---- Outils dates / prix
  function p2(n) { return String(n).padStart(2, "0"); }
  function iso(d) { return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); }
  function parse(s) { var a = s.split("-"); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); }
  function add(s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function diff(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); }
  function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lome" }).format(new Date()); }
  function fcfa(n) { return new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/[  ]/g, " ") + " FCFA"; }
  function dfr(s, o) { return new Intl.DateTimeFormat("fr-FR", Object.assign({ timeZone: "UTC" }, o || { day: "numeric", month: "short", year: "numeric" })).format(parse(s)); }
  function rate(p, d) {
    var promo = p.promo_night && p.promo_night > 0 && (!p.promo_start || d >= p.promo_start) && (!p.promo_end || d <= p.promo_end);
    return promo ? Math.min(p.promo_night, p.night) : p.night;
  }
  function quote(p, a, b, g) {
    // Même calcul que le site : forfaits 7/14/21/30 nuits ; un forfait peut couvrir un séjour plus court
    var n = Math.max(0, diff(a, b)), c = [0], i;
    var blocks = [[7, p.week], [14, p.week2], [21, p.week3], [30, p.month]].filter(function (x) { return x[1] > 0; });
    for (i = 1; i <= n; i++) {
      var best = c[i - 1] + rate(p, add(a, i - 1));
      blocks.forEach(function (x) { best = Math.min(best, c[Math.max(0, i - x[0])] + x[1]); });
      c[i] = best;
    }
    var fees = (p.extra_fees || []).filter(function (f) { return f && f.amount > 0; }).map(function (f) {
      return { label: f.label, amount: f.amount * (f.per === "night" ? n : f.per === "guest" ? g : 1) };
    });
    var ft = fees.reduce(function (s, f) { return s + f.amount; }, 0);
    return { n: n, base: n * p.night, stay: c[n], fees: fees, total: c[n] + ft };
  }

  // ---- Widget de réservation
  var slug = (location.pathname.split("/").pop() || "").replace(".html", "");
  var apt = APTS[slug], box = $("#reserver");
  if (apt) track("ViewContent", { content_ids: [slug], content_name: apt.name, content_type: "product", value: rate(apt.pricing, today()), currency: "XOF" });
  if (apt && box) {
    var host = box.querySelector(".space-y-4");
    var busy = {};
    (apt.ranges || []).forEach(function (r) { for (var d = r.start_date; d < r.end_date; d = add(d, 1)) busy[d] = 1; });
    var t = today(), S = { a: null, b: null, g: Math.min(2, apt.max), m: t.slice(0, 7), err: "" }, P = apt.pricing, minN = Math.max(1, P.min_nights || 1);
    var free = function (a, b) { for (var d = a; d < b; d = add(d, 1)) if (busy[d]) return false; return true; };
    var draw = function () {
      var first = parse(S.m + "-01"), lead = (first.getUTCDay() + 6) % 7;
      var dim = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate(), cells = "";
      for (var i = 0; i < lead; i++) cells += "<span></span>";
      for (var k = 1; k <= dim; k++) {
        var d = S.m + "-" + p2(k), choosingEnd = S.a && !S.b && d > S.a;
        var dis = d < t || (busy[d] && !(choosingEnd && free(S.a, d)));
        var sel = d === S.a || d === S.b, inr = S.a && S.b && d > S.a && d < S.b;
        cells += '<button type="button" data-d="' + d + '"' + (dis ? " disabled" : "") + ' style="margin:auto;width:40px;height:40px;border-radius:' + (inr ? "0" : "999px") + ";border:0;font:14px Inter,system-ui;" +
          (sel ? "background:#222;color:#fff;font-weight:600;" : inr ? "background:#f7f7f7;" : "background:transparent;") +
          (dis ? "color:#cbd5e1;text-decoration:line-through;cursor:not-allowed;" : "cursor:pointer;") + '">' + k + "</button>";
      }
      var n = S.a && S.b ? diff(S.a, S.b) : 0, q = n ? quote(P, S.a, S.b, S.g) : null, ok = q && n >= minN;
      var msg = ["Bonjour " + SITE.company + ", je souhaite réserver :", "🏠 " + apt.name,
        ok ? "📅 Du " + dfr(S.a) + " au " + dfr(S.b) + " (" + n + " nuit" + (n > 1 ? "s" : "") + ")" : "📅 Dates : à définir",
        "👥 " + S.g + " personne" + (S.g > 1 ? "s" : ""), ok ? "💰 Prix estimé : " + fcfa(q.total) : "", "Est-ce disponible ?"].filter(Boolean).join("\n");
      var canPrev = S.m > t.slice(0, 7);
      host.innerHTML =
        '<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<button type="button" id="bwPrev" ' + (canPrev ? "" : "disabled") + ' style="width:36px;height:36px;border:0;border-radius:999px;background:#f1f5f9;cursor:pointer;opacity:' + (canPrev ? 1 : .3) + '">‹</button>' +
        '<strong style="font-size:14px;text-transform:capitalize">' + dfr(S.m + "-01", { month: "long", year: "numeric" }) + "</strong>" +
        '<button type="button" id="bwNext" style="width:36px;height:36px;border:0;border-radius:999px;background:#f1f5f9;cursor:pointer">›</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px;text-align:center">' +
        ["L", "M", "M", "J", "V", "S", "D"].map(function (w) { return '<span style="font-size:11px;color:#94a3b8;padding:4px 0">' + w + "</span>"; }).join("") + cells + "</div></div>" +
        '<div class="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-400 text-sm">' +
        '<div class="border-r border-slate-200 p-3"><div class="text-[10px] font-extrabold uppercase tracking-wide text-slate-900">Arrivée</div><div class="mt-0.5 font-medium">' + (S.a ? dfr(S.a) : "—") + "</div></div>" +
        '<div class="p-3"><div class="text-[10px] font-extrabold uppercase tracking-wide text-slate-900">Départ</div><div class="mt-0.5 font-medium">' + (S.b ? dfr(S.b) : "—") + "</div></div>" +
        '<div class="col-span-2 flex items-center justify-between border-t border-slate-200 p-3"><div><div class="text-[10px] font-extrabold uppercase tracking-wide text-slate-900">Personnes</div><div class="text-xs text-slate-500">max. ' + apt.max + "</div></div>" +
        '<div class="flex items-center gap-3"><button type="button" id="gMinus" class="grid size-8 place-items-center rounded-full border border-slate-300">−</button><span class="w-5 text-center font-semibold">' + S.g + '</span><button type="button" id="gPlus" class="grid size-8 place-items-center rounded-full border border-slate-300">+</button></div></div></div>' +
        (!S.a ? '<p class="text-sm text-slate-500">Choisissez votre date d\'arrivée' + (minN > 1 ? " (" + minN + " nuits minimum)" : "") + ".</p>" : !S.b ? '<p class="text-sm text-slate-500">Choisissez maintenant votre date de départ.</p>' : "") +
        (S.err ? '<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">' + S.err + "</p>" : "") +
        (q && n < minN ? '<p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Séjour minimum : ' + minN + " nuits.</p>" : "") +
        (q ? '<div class="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm"><div class="flex justify-between"><span class="text-slate-600">' + n + " nuit" + (n > 1 ? "s" : "") + "</span><span>" + fcfa(q.base) + "</span></div>" +
          (q.base > q.stay ? '<div class="flex justify-between text-emerald-700"><span>Tarif longue durée</span><span>−' + fcfa(q.base - q.stay) + "</span></div>" : "") +
          q.fees.map(function (f) { return '<div class="flex justify-between"><span class="text-slate-600">' + f.label + "</span><span>" + fcfa(f.amount) + "</span></div>"; }).join("") +
          '<div class="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total estimé</span><span>' + fcfa(q.total) + "</span></div></div>" : "") +
        '<a id="bwWa" target="_blank" rel="noopener noreferrer" href="' + (ok ? "https://wa.me/" + SITE.wa + "?text=" + encodeURIComponent(msg) : "#") + '" class="flex h-12 items-center justify-center gap-2 rounded-lg text-base font-semibold text-white ' + (ok ? "btn-brand" : "") + '" style="' + (ok ? "" : "background:#cbd5e1") + '">Réserver</a>' +
        '<p class="text-center text-xs text-slate-500">Confirmation sur WhatsApp · aucun montant débité pour le moment</p>';
      // Barre de réservation mobile : prix total des nuits choisies
      var mbP = $("#mb-price"), mbS = $("#mb-sub"), mbB = $("#mb-btn");
      if (mbP && mbS && mbB) {
        if (ok) {
          var short = function (x, m) { return new Intl.DateTimeFormat("fr-FR", m ? { day: "numeric", month: "short", timeZone: "UTC" } : { day: "numeric", timeZone: "UTC" }).format(parse(x)); };
          mbP.textContent = fcfa(q.total);
          mbS.textContent = "Pour " + n + " nuit" + (n > 1 ? "s" : "") + " · " + (S.a.slice(0, 7) === S.b.slice(0, 7) ? short(S.a) : short(S.a, 1)) + "–" + short(S.b, 1);
          mbB.textContent = "Réserver"; mbB.href = "https://wa.me/" + SITE.wa + "?text=" + encodeURIComponent(msg); mbB.target = "_blank";
        } else {
          mbP.textContent = fcfa(rate(P, t)); mbS.textContent = "par nuit" + (minN > 1 ? " · " + minN + " nuits min." : "");
          mbB.textContent = "Choisir les dates"; mbB.href = "#reserver"; mbB.removeAttribute("target");
        }
      }
      $$("button[data-d]", host).forEach(function (b) { b.onclick = function () { pick(b.dataset.d); }; });
      $("#bwPrev", host).onclick = function () { if (canPrev) { var d = parse(S.m + "-01"); d.setUTCMonth(d.getUTCMonth() - 1); S.m = iso(d).slice(0, 7); draw(); } };
      $("#bwNext", host).onclick = function () { var d = parse(S.m + "-01"); d.setUTCMonth(d.getUTCMonth() + 1); S.m = iso(d).slice(0, 7); draw(); };
      $("#gMinus", host).onclick = function () { S.g = Math.max(1, S.g - 1); draw(); };
      $("#gPlus", host).onclick = function () { S.g = Math.min(apt.max, S.g + 1); draw(); };
      $("#bwWa", host).onclick = function (e) { if (!ok) { e.preventDefault(); S.err = "Sélectionnez vos dates d'arrivée et de départ."; draw(); } };
      if (ok && !S.started) { S.started = 1; track("InitiateCheckout", { content_ids: [slug], content_type: "product", value: q.total, currency: "XOF", num_items: n }); }
    };
    var pick = function (d) {
      S.err = "";
      if (!S.a || S.b || d <= S.a) { if (!busy[d]) { S.a = d; S.b = null; } }
      else if (!free(S.a, d)) { S.err = "Certaines nuits de cette période sont déjà réservées."; S.a = busy[d] ? null : d; S.b = null; }
      else S.b = d;
      draw();
    };
    draw();
  }

  // ---- Visite photo, équipements et « À savoir » (comme sur le site en ligne)
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lock(on) { document.body.style.overflow = on ? "hidden" : ""; }
  var CHEV = '<svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  function sheet(html) {
    var w = document.createElement("div");
    w.className = "site fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6";
    w.innerHTML = '<div class="absolute inset-0 hidden bg-black/50 sm:block" data-close></div><div class="relative flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl">' +
      '<div class="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:rounded-t-2xl"><button data-close class="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Retour">' + CHEV + "</button></div>" +
      '<div class="flex-1 overflow-y-auto px-6 pb-28 pt-4 sm:pb-8">' + html + "</div></div>";
    document.body.appendChild(w); lock(true);
    $$("[data-close]", w).forEach(function (b) { b.onclick = function () { w.remove(); lock(false); }; });
  }
  if (apt) {
    // Visite photo
    var rooms = [], byRoom = {};
    apt.media.forEach(function (m) { var r = m.room || "Photos supplémentaires"; if (!byRoom[r]) { byRoom[r] = []; rooms.push(r); } byRoom[r].push(m.src); });
    var ix = rooms.indexOf("Photos supplémentaires"); if (ix >= 0) { rooms.splice(ix, 1); rooms.push("Photos supplémentaires"); }
    var all = []; rooms.forEach(function (r) { all = all.concat(byRoom[r]); });
    var zoom = function (i, list) {
      list = list || all;
      var z = document.createElement("div"); z.className = "fixed inset-0 z-[70] flex flex-col bg-black text-white";
      z.innerHTML = '<div class="flex items-center justify-between px-3 py-3"><button data-x class="grid size-11 place-items-center rounded-full text-3xl leading-none">×</button><span data-c class="text-sm"></span>' +
        '<div class="flex gap-1"><button data-m class="grid size-11 place-items-center rounded-full text-2xl">−</button><button data-pl class="grid size-11 place-items-center rounded-full text-2xl">+</button></div></div>' +
        '<div data-b class="relative flex-1 overflow-hidden" style="touch-action:none;user-select:none"><img draggable="false" class="absolute inset-0 m-auto max-h-full max-w-full object-contain">' +
        '<button data-p class="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl sm:grid">‹</button><button data-n class="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl sm:grid">›</button></div>' +
        '<p data-h class="py-3 text-center text-xs" style="color:rgba(255,255,255,.6)"></p>';
      document.body.appendChild(z); lock(true);
      var box = z.querySelector("[data-b]"), img = box.querySelector("img"), S = 1, T = { x: 0, y: 0 }, P = {}, G = { last: 0 };
      var clamp = function (x, y, sc) { var r = box.getBoundingClientRect(), mx = r.width * (sc - 1) / 2, my = r.height * (sc - 1) / 2; return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) }; };
      var apply = function (anim) {
        img.style.transition = anim ? "transform .2s ease-out" : "none";
        img.style.transform = "translate(" + T.x + "px," + T.y + "px) scale(" + S + ")";
        z.querySelector("[data-h]").textContent = S > 1 ? "Glissez pour vous déplacer · double-tap pour revenir" : "Double-tap ou pincez pour zoomer · balayez pour changer de photo";
        z.querySelector("[data-m]").style.opacity = S > 1 ? 1 : .3;
      };
      var at = function (cx, cy, sc) { var r = box.getBoundingClientRect(), ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2); S = sc; T = sc === 1 ? { x: 0, y: 0 } : clamp(-ox * (sc - 1), -oy * (sc - 1), sc); apply(true); };
      var show = function () { img.src = list[i]; S = 1; T = { x: 0, y: 0 }; apply(false); z.querySelector("[data-c]").textContent = (i + 1) + " / " + list.length; };
      var go = function (d) { i = (i + d + list.length) % list.length; show(); };
      var key = function (e) { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
      var close = function () { z.remove(); if (!document.querySelector(".site.fixed")) lock(false); document.removeEventListener("keydown", key); };
      document.addEventListener("keydown", key);
      z.querySelector("[data-x]").onclick = close;
      z.querySelector("[data-p]").onclick = function () { go(-1); };
      z.querySelector("[data-n]").onclick = function () { go(1); };
      var mid = function () { var r = box.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
      z.querySelector("[data-pl]").onclick = function () { var m = mid(); at(m[0], m[1], Math.min(4, S + 1)); };
      z.querySelector("[data-m]").onclick = function () { var m = mid(); at(m[0], m[1], Math.max(1, S - 1)); };
      box.addEventListener("wheel", function (e) { e.preventDefault(); at(e.clientX, e.clientY, Math.max(1, Math.min(4, S * (e.deltaY < 0 ? 1.25 : .8)))); }, { passive: false });
      box.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return;
        box.setPointerCapture(e.pointerId); P[e.pointerId] = { x: e.clientX, y: e.clientY }; G.moved = false;
        var k = Object.keys(P);
        if (k.length === 2) { var a = P[k[0]], b = P[k[1]]; G.d = Math.hypot(a.x - b.x, a.y - b.y); G.s = S; }
        else { G.st = { x: e.clientX, y: e.clientY }; G.t = { x: T.x, y: T.y }; }
      });
      box.addEventListener("pointermove", function (e) {
        if (!P[e.pointerId]) return;
        P[e.pointerId] = { x: e.clientX, y: e.clientY };
        var k = Object.keys(P);
        if (k.length === 2) { var a = P[k[0]], b = P[k[1]], d = Math.hypot(a.x - b.x, a.y - b.y); S = Math.max(1, Math.min(4, G.s * d / (G.d || d))); T = clamp(T.x, T.y, S); G.moved = true; apply(false); return; }
        var dx = e.clientX - G.st.x, dy = e.clientY - G.st.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) G.moved = true;
        if (S > 1) { T = clamp(G.t.x + dx, G.t.y + dy, S); apply(false); }
      });
      var up = function (e) {
        var pinch = Object.keys(P).length === 2; delete P[e.pointerId];
        if (pinch) { if (S < 1.05) { S = 1; T = { x: 0, y: 0 }; apply(true); } return; }
        if (!G.st) return;
        var dx = e.clientX - G.st.x;
        if (S === 1 && G.moved && Math.abs(dx) > 50) { go(dx < 0 ? 1 : -1); return; }
        if (!G.moved) { var now = Date.now(); if (now - G.last < 300) { at(e.clientX, e.clientY, S > 1 ? 1 : 2.5); G.last = 0; } else G.last = now; }
      };
      box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
      show();
    };
    var tour = function () {
      var t = document.createElement("div"); t.className = "site fixed inset-0 z-50 overflow-y-auto bg-white";
      var mosaic = function (list) {
        var out = "";
        for (var i = 0; i < list.length; i += 3) {
          var c = list.slice(i, i + 3);
          out += '<div class="mb-2 grid gap-2 ' + (c.length === 1 ? "aspect-[4/3] grid-cols-1" : c.length === 2 ? "aspect-[2/1.2] grid-cols-2" : "aspect-[1.13] grid-cols-[2fr_1fr] grid-rows-2") + '">' +
            c.map(function (src, k) { return '<button data-z="' + all.indexOf(src) + '" class="relative overflow-hidden rounded-2xl bg-slate-100 ' + (c.length === 3 && k === 0 ? "row-span-2" : "") + '"><img src="' + src + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></button>'; }).join("") + "</div>";
        }
        return out;
      };
      t.innerHTML = '<div class="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3"><button data-x class="grid size-10 place-items-center rounded-full hover:bg-slate-100" aria-label="Retour">' + CHEV + '</button><span class="text-lg font-semibold">Visite photo</span><span class="w-10"></span></div>' +
        '<div class="mx-auto max-w-3xl px-6 pb-32"><div class="flex gap-3 overflow-x-auto pb-4">' +
        rooms.map(function (r, k) { return '<button data-r="' + k + '" class="w-28 shrink-0 text-left sm:w-32"><span class="relative block aspect-[1.05] overflow-hidden rounded-xl bg-slate-100"><img src="' + byRoom[r][0] + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></span><span class="mt-2 block text-sm text-slate-600">' + esc(r) + "</span></button>"; }).join("") + "</div>" +
        rooms.map(function (r, k) { return '<section id="room' + k + '" class="scroll-mt-16 pt-8"><h2 class="text-[26px] font-semibold">' + esc(r) + "</h2>" + (/^Chambre/.test(r) ? '<p class="mb-5 mt-1 text-slate-600">1 lit</p>' : r === "Salon" ? '<p class="mb-5 mt-1 text-slate-600">Canapé</p>' : '<div class="h-4"></div>') + mosaic(byRoom[r]) + "</section>"; }).join("") +
        '</div><a href="#reserver" data-x class="fixed bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--site-primary)] px-8 py-4 text-base font-semibold text-white shadow-xl">Vérifier les disponibilités</a>';
      document.body.appendChild(t); lock(true);
      $$("[data-x]", t).forEach(function (b) { b.addEventListener("click", function () { t.remove(); lock(false); }); });
      $$("[data-r]", t).forEach(function (b) { b.onclick = function () { t.querySelector("#room" + b.dataset.r).scrollIntoView({ behavior: "smooth", block: "start" }); }; });
      $$("[data-z]", t).forEach(function (b) { b.onclick = function () { zoom(+b.dataset.z); }; });
    };
    var pageList = apt.media.map(function (m) { return m.src; });
    $$("main button").forEach(function (b) {
      var lab = b.getAttribute("aria-label") || "", m = lab.match(/^(?:Photo|Agrandir la photo) (\d+)$/);
      if (m) b.onclick = function () { zoom(+m[1] - 1, pageList); };
      else if (/Afficher toutes les photos|^\s*Visite photo\s*$/.test(b.textContent)) b.onclick = tour;
    });
    var strip = $("main .snap-x"), counter = strip && strip.parentElement.querySelector("span");
    if (strip && counter) strip.addEventListener("scroll", function () { counter.textContent = (Math.round(strip.scrollLeft / strip.clientWidth) + 1) + " / " + apt.media.length; });

    // Équipements
    var row = function (a) { return '<div class="flex items-start gap-4 border-b border-slate-200 py-6 last:border-0"><span class="relative mt-0.5 shrink-0">' + a.svg + (a.included ? "" : '<span class="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-500"></span>') + '</span><span class="min-w-0"><span class="block text-base ' + (a.included ? "" : "text-slate-500 line-through") + '">' + esc(a.name) + "</span>" + (a.included && a.description ? '<span class="mt-0.5 block text-sm text-slate-500">' + esc(a.description) + "</span>" : "") + "</span></div>"; };
    var ORDER = ["Salle de bain", "Chambre et linge", "Divertissement", "Chauffage et climatisation", "Internet et bureau", "Cuisine et salle à manger", "Parking et installations", "Services", "Sécurité"];
    $$("main button").forEach(function (b) {
      if (!/^Afficher les \d+ équipements$/.test(b.textContent.trim())) return;
      b.onclick = function () {
        var inc = apt.amenities.filter(function (a) { return a.included; }), exc = apt.amenities.filter(function (a) { return !a.included; });
        var cats = ORDER.concat(inc.map(function (a) { return a.category; }).filter(function (c, i, l) { return ORDER.indexOf(c) < 0 && l.indexOf(c) === i; }));
        sheet('<h2 class="mb-2 text-[26px] font-semibold">Ce que propose ce logement</h2>' + cats.map(function (c) {
          var l = inc.filter(function (a) { return a.category === c; }); if (!l.length) return "";
          return '<div class="pt-8"><h3 class="text-lg font-semibold">' + esc(c) + "</h3><div>" + l.map(row).join("") + "</div></div>"; }).join("") +
          (exc.length ? '<div class="pt-8"><h3 class="text-lg font-semibold">Non inclus</h3><div>' + exc.map(row).join("") + "</div></div>" : ""));
      };
    });

    // À savoir
    var has = function (n) { return apt.amenities.some(function (a) { return a.name === n && a.included; }); };
    var item = function (t) { return '<div class="border-b border-slate-200 py-5 text-base last:border-0">' + esc(t) + "</div>"; };
    $$("main section button").forEach(function (b) {
      var t = b.textContent;
      if (/^Règlement intérieur/.test(t)) b.onclick = function () {
        var r = ["Arrivée à partir de " + apt.checkIn, "Départ avant " + apt.checkOut].concat(apt.rules, has("Animaux acceptés") ? ["Animaux acceptés"] : [], has("Logement fumeur") ? ["Logement fumeur"] : []);
        sheet('<h2 class="text-[26px] font-semibold">Règlement intérieur</h2><p class="mt-2 text-slate-500">Vous séjournerez chez quelqu\'un : traitez ce logement avec soin et respect.</p><div class="mt-4">' + r.map(item).join("") + "</div>"); };
      if (/^Sécurité et logement/.test(t)) b.onclick = function () {
        var r = [has("Caméras de surveillance extérieures") ? "Caméra de surveillance extérieure présente sur place" : null,
          has("Détecteur de monoxyde de carbone") ? "Détecteur de monoxyde de carbone" : "Aucune indication de la présence d'un détecteur de monoxyde de carbone",
          has("Détecteur de fumée") ? "Détecteur de fumée" : "Aucune indication de la présence d'un détecteur de fumée"].filter(Boolean);
        sheet('<h2 class="text-[26px] font-semibold">Sécurité et logement</h2><h3 class="mt-6 text-lg font-semibold">Équipements de sécurité</h3><div>' + r.map(item).join("") + "</div>"); };
      if (/^Conditions d'annulation/.test(t)) b.onclick = function () {
        var c = SITE.cancel || apt.conditions || "Les conditions d'annulation vous sont communiquées lors de votre demande de réservation.";
        sheet('<h2 class="text-[26px] font-semibold">Conditions d\'annulation</h2><p class="mt-4 whitespace-pre-line text-base leading-relaxed">' + esc(c) + "</p>"); };
    });
  }

  // ---- Partager / favori (boutons flottants sur la photo)
  var sh = $('button[aria-label="Partager"]');
  if (sh) sh.onclick = function () {
    var url = location.href.split("?")[0];
    if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { sh.style.background = "#dcfce7"; setTimeout(function () { sh.style.background = ""; }, 1500); }).catch(function () {});
  };
  var fv = $('button[aria-label="Ajouter aux favoris"], button[aria-label="Retirer des favoris"]');
  if (fv && apt) {
    var favKey = "lm_fav";
    var getFav = function () { try { return JSON.parse(localStorage.getItem(favKey) || "[]"); } catch (e) { return []; } };
    var paintFav = function () { var on = getFav().indexOf(apt.id) >= 0, svg = fv.querySelector("svg"); if (svg) { svg.style.fill = on ? "#e11d48" : "none"; svg.style.color = on ? "#e11d48" : ""; } };
    fv.onclick = function () {
      var l = getFav(), k = l.indexOf(apt.id);
      var next = k >= 0 ? l.filter(function (x) { return x !== apt.id; }) : l.concat([apt.id]);
      try { localStorage.setItem(favKey, JSON.stringify(next)); } catch (e) {}
      paintFav();
    };
    paintFav();
  }

  // ---- Menu mobile
  var mb = $('header button[aria-label="Menu"]');
  if (mb) {
    var nav = document.createElement("nav");
    nav.style.cssText = "display:none;position:absolute;left:0;right:0;top:64px;background:#fff;border-bottom:1px solid #e2e8f0;padding:8px 16px;box-shadow:0 8px 20px rgba(0,0,0,.08)";
    nav.innerHTML = [["index.html", "Accueil"], ["appartements.html", "Nos appartements"], ["index.html#contact", "Contact"]].map(function (l) {
      return '<a href="' + l[0] + '" style="display:block;padding:12px;font-weight:500;color:#0f172a;text-decoration:none">' + l[1] + "</a>"; }).join("");
    mb.closest("header").appendChild(nav);
    mb.onclick = function () { nav.style.display = nav.style.display === "none" ? "block" : "none"; };
  }

  // ---- Recherche et filtres (côté navigateur)
  $$("form").forEach(function (f) {
    var isCatalog = /appartements/.test(location.pathname);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var qs = new URLSearchParams(new FormData(f)); Array.from(qs.keys()).forEach(function (k) { if (!qs.get(k)) qs.delete(k); });
      if (!isCatalog) { location.href = "appartements.html" + (qs.toString() ? "?" + qs : ""); return; }
      track("Search", { search_string: qs.toString(), content_category: "logement" });
      var v = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? el.value : ""; };
      var ai = v("arrivee"), de = v("depart"), g = +v("voyageurs") || 0, q = v("quartier"), ch = +v("chambres") || 0, mn = +v("prix_min") || 0, mx = +v("prix_max") || 0;
      var shown = 0;
      $$('main a[href$=".html"].group').forEach(function (card) {
        var a = APTS[card.getAttribute("href").replace(".html", "")]; if (!a) return;
        var okd = true;
        if (ai && de && de > ai) for (var d = ai; d < de; d = add(d, 1)) (a.ranges || []).forEach(function (r) { if (d >= r.start_date && d < r.end_date) okd = false; });
        var ok = okd && (!g || a.max >= g) && (!q || a.neighborhood === q) && (!ch || a.bedrooms >= ch) && (!mn || a.pricing.night >= mn) && (!mx || a.pricing.night <= mx);
        card.style.display = ok ? "" : "none"; if (ok) shown++;
      });
      var h = $("main p.mt-2"); if (h) h.textContent = shown + " logement" + (shown > 1 ? "s" : "") + (ai && de ? " disponibles sur vos dates" : "");
    });
  });
  // Recherche lancée depuis l'accueil : on remplit le formulaire du catalogue et on filtre
  if (/appartements/.test(location.pathname) && location.search) {
    var sp = new URLSearchParams(location.search), cf = $("main form") || $("form");
    if (cf) { sp.forEach(function (v, k) { var el = cf.querySelector('[name="' + k + '"]'); if (el) el.value = v; }); cf.dispatchEvent(new Event("submit", { cancelable: true })); }
  }
})();
