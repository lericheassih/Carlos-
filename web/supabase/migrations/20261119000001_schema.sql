-- =====================================================================
--  LUMO — Plateforme de gestion d'appartements meublés
--  Schéma principal : tables, contraintes, index, triggers
-- =====================================================================

create extension if not exists btree_gist;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Administrateurs & permissions
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('owner','admin','staff')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.admin_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.admin_users where user_id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role in ('owner','admin'));
$$;

-- ---------------------------------------------------------------------
-- Appartements
-- ---------------------------------------------------------------------
create sequence public.apartment_ref_seq start 1;

create table public.apartments (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique default ('APT-' || lpad(nextval('public.apartment_ref_seq')::text, 4, '0')),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status             text not null default 'draft' check (status in ('draft','published','hidden','archived')),

  -- Informations générales
  name               text not null check (char_length(name) between 2 and 160),
  short_description  text not null default '',
  description        text not null default '',
  city               text not null default 'Lomé',
  neighborhood       text not null default '',
  address            text not null default '',
  property_type      text not null default 'appartement',
  bedrooms           int  not null default 1 check (bedrooms >= 0),
  living_rooms       int  not null default 1 check (living_rooms >= 0),
  bathrooms          int  not null default 1 check (bathrooms >= 0),
  max_guests         int  not null default 2 check (max_guests >= 1),
  latitude           numeric(9,6),
  longitude          numeric(9,6),

  -- Tarification (montants entiers en FCFA)
  price_night        int  not null default 0 check (price_night >= 0),
  price_week         int  check (price_week >= 0),
  price_month        int  check (price_month >= 0),
  promo_price_night  int  check (promo_price_night >= 0),
  promo_label        text,
  promo_start        date,
  promo_end          date,
  extra_fees         jsonb not null default '[]'::jsonb,  -- [{label, amount, per: 'stay'|'night'}]
  min_nights         int  not null default 1 check (min_nights >= 1),
  pricing_conditions text not null default '',

  -- Conditions de séjour
  booking_conditions text not null default '',
  house_rules        text not null default '',
  check_in_time      text not null default '14:00',
  check_out_time     text not null default '12:00',

  -- Mise en avant
  featured           boolean not null default false,
  sort_order         int not null default 0,

  -- Publication : instantané servi au site public
  published          jsonb,
  published_at       timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint promo_dates_ok check (promo_end is null or promo_start is null or promo_end >= promo_start)
);
create index apartments_status_idx on public.apartments (status);
create index apartments_name_trgm on public.apartments using gin (name gin_trgm_ops);
create trigger apartments_updated before update on public.apartments
  for each row execute function public.set_updated_at();

-- Équipements
create table public.amenities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  icon        text not null default 'check',
  category    text not null default 'Général',
  is_custom   boolean not null default false,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

create table public.apartment_amenities (
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  amenity_id   uuid not null references public.amenities(id) on delete cascade,
  primary key (apartment_id, amenity_id)
);
create index apartment_amenities_amenity_idx on public.apartment_amenities (amenity_id);

-- ---------------------------------------------------------------------
-- Médiathèque (photos et vidéos), réutilisable entre appartements
-- (remplace apartment_images / apartment_videos : un même média peut
--  servir dans plusieurs fiches)
-- ---------------------------------------------------------------------
create table public.media (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('image','video')),
  storage_path  text not null unique,
  name          text not null,
  alt           text not null default '',
  mime_type     text not null,
  size_bytes    bigint not null default 0,
  width         int,
  height        int,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index media_created_idx on public.media (created_at desc);

create table public.apartment_media (
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  media_id     uuid not null references public.media(id) on delete cascade,
  position     int not null default 0,
  is_cover     boolean not null default false,
  caption      text not null default '',
  primary key (apartment_id, media_id)
);
create unique index apartment_media_one_cover on public.apartment_media (apartment_id) where is_cover;
create index apartment_media_media_idx on public.apartment_media (media_id);

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null check (char_length(full_name) between 2 and 160),
  phone       text,
  whatsapp    text,
  email       text,
  country     text,
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index customers_name_trgm on public.customers using gin (full_name gin_trgm_ops);
create index customers_phone_idx on public.customers (phone);
create index customers_whatsapp_idx on public.customers (whatsapp);
create index customers_email_idx on public.customers (lower(email));
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Réservations
-- ---------------------------------------------------------------------
create sequence public.reservation_ref_seq start 1;

create table public.reservations (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique default ('R' || to_char(now() at time zone 'Africa/Lome', 'YYMM') || '-' || lpad(nextval('public.reservation_ref_seq')::text, 4, '0')),
  apartment_id     uuid not null references public.apartments(id) on delete restrict,
  customer_id      uuid not null references public.customers(id) on delete restrict,
  check_in         date not null,
  check_out        date not null,
  nights           int generated always as (check_out - check_in) stored,
  stay             daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  guests           int not null default 1 check (guests >= 1),
  price_per_night  int not null default 0 check (price_per_night >= 0),
  extra_fees       int not null default 0 check (extra_fees >= 0),
  discount         int not null default 0 check (discount >= 0),
  total_amount     int not null default 0 check (total_amount >= 0),
  amount_paid      int not null default 0,
  payment_method   text check (payment_method in ('cash','tmoney','flooz','bank_transfer','card','other')),
  payment_status   text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid','refunded')),
  status           text not null default 'pending' check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  source           text not null default 'admin' check (source in ('admin','website','whatsapp','phone','other')),
  notes            text not null default '',
  cancelled_at     timestamptz,
  confirmed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint stay_valid check (check_out > check_in),
  -- Aucune double réservation : deux séjours actifs ne peuvent pas se chevaucher
  constraint no_double_booking exclude using gist (apartment_id with =, stay with &&)
    where (status in ('confirmed','in_progress','completed'))
);
create index reservations_apartment_idx on public.reservations (apartment_id, check_in);
create index reservations_customer_idx on public.reservations (customer_id);
create index reservations_status_idx on public.reservations (status);
create index reservations_created_idx on public.reservations (created_at desc);
create index reservations_stay_idx on public.reservations using gist (stay);
create trigger reservations_updated before update on public.reservations
  for each row execute function public.set_updated_at();

-- Paiements (acomptes, soldes, remboursements)
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  amount          int not null check (amount <> 0),
  method          text not null default 'cash' check (method in ('cash','tmoney','flooz','bank_transfer','card','other')),
  paid_at         date not null default ((now() at time zone 'Africa/Lome')::date),
  note            text not null default '',
  created_at      timestamptz not null default now()
);
create index payments_reservation_idx on public.payments (reservation_id);
create index payments_paid_at_idx on public.payments (paid_at);

-- Dates bloquées manuellement (travaux, usage personnel…)
create table public.blocked_dates (
  id            uuid primary key default gen_random_uuid(),
  apartment_id  uuid not null references public.apartments(id) on delete cascade,
  start_date    date not null,
  end_date      date not null,          -- exclusif (comme une date de départ)
  period        daterange generated always as (daterange(start_date, end_date, '[)')) stored,
  reason        text not null default '',
  created_at    timestamptz not null default now(),
  constraint blocked_valid check (end_date > start_date),
  constraint no_overlapping_blocks exclude using gist (apartment_id with =, period with &&)
);
create index blocked_dates_period_idx on public.blocked_dates using gist (apartment_id, period);

-- Une réservation active ne peut pas tomber sur des dates bloquées, et inversement
create or replace function public.check_reservation_vs_blocks()
returns trigger language plpgsql as $$
begin
  if new.status in ('confirmed','in_progress') and exists (
    select 1 from public.blocked_dates b
    where b.apartment_id = new.apartment_id and b.period && daterange(new.check_in, new.check_out, '[)')
  ) then
    raise exception 'Ces dates sont bloquées dans le calendrier de cet appartement.'
      using errcode = 'P0001', hint = 'blocked_dates_conflict';
  end if;
  return new;
end $$;
create trigger reservations_vs_blocks before insert or update of check_in, check_out, status, apartment_id
  on public.reservations for each row execute function public.check_reservation_vs_blocks();

create or replace function public.check_block_vs_reservations()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.reservations r
    where r.apartment_id = new.apartment_id
      and r.status in ('confirmed','in_progress')
      and r.stay && daterange(new.start_date, new.end_date, '[)')
  ) then
    raise exception 'Une réservation confirmée existe déjà sur ces dates.'
      using errcode = 'P0001', hint = 'reservation_conflict';
  end if;
  return new;
end $$;
create trigger blocks_vs_reservations before insert or update on public.blocked_dates
  for each row execute function public.check_block_vs_reservations();

-- Recalcul du montant payé et du statut de paiement
create or replace function public.refresh_payment_status(p_reservation uuid)
returns void language plpgsql as $$
declare v_paid int; v_total int;
begin
  select coalesce(sum(amount), 0) into v_paid from public.payments where reservation_id = p_reservation;
  select total_amount into v_total from public.reservations where id = p_reservation;
  update public.reservations set
    amount_paid = v_paid,
    payment_status = case
      when v_paid <= 0 and exists (select 1 from public.payments where reservation_id = p_reservation and amount < 0) then 'refunded'
      when v_paid <= 0 then 'unpaid'
      when v_paid >= v_total then 'paid'
      else 'partial' end
  where id = p_reservation;
end $$;

create or replace function public.payments_changed()
returns trigger language plpgsql as $$
begin
  perform public.refresh_payment_status(coalesce(new.reservation_id, old.reservation_id));
  return null;
end $$;
create trigger payments_after_change after insert or update or delete on public.payments
  for each row execute function public.payments_changed();

create or replace function public.reservation_total_changed()
returns trigger language plpgsql as $$
begin
  if new.total_amount is distinct from old.total_amount then
    perform public.refresh_payment_status(new.id);
  end if;
  return null;
end $$;
create trigger reservations_total_after after update of total_amount on public.reservations
  for each row execute function public.reservation_total_changed();

-- Horodatage des changements de statut
create or replace function public.reservation_status_stamps()
returns trigger language plpgsql as $$
begin
  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status <> 'cancelled') then new.cancelled_at := now(); end if;
  if new.status <> 'cancelled' then new.cancelled_at := null; end if;
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status = 'pending') then new.confirmed_at := coalesce(new.confirmed_at, now()); end if;
  return new;
end $$;
create trigger reservations_status_stamps before insert or update of status on public.reservations
  for each row execute function public.reservation_status_stamps();

-- Passage automatique Confirmée -> En cours -> Terminée selon la date du jour (Africa/Lome)
create or replace function public.refresh_reservation_statuses()
returns int language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Africa/Lome')::date; n1 int; n2 int;
begin
  update public.reservations set status = 'in_progress'
   where status = 'confirmed' and check_in <= v_today and check_out > v_today;
  get diagnostics n1 = row_count;
  update public.reservations set status = 'completed'
   where status in ('confirmed','in_progress') and check_out <= v_today;
  get diagnostics n2 = row_count;
  return n1 + n2;
end $$;

-- ---------------------------------------------------------------------
-- Avis clients (affichés uniquement après validation)
-- ---------------------------------------------------------------------
create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  apartment_id    uuid references public.apartments(id) on delete set null,
  reservation_id  uuid references public.reservations(id) on delete set null,
  author_name     text not null check (char_length(author_name) between 2 and 120),
  author_country  text,
  rating          int not null check (rating between 1 and 5),
  comment         text not null default '',
  stay_date       date,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index reviews_apartment_idx on public.reviews (apartment_id) where is_published;
create trigger reviews_updated before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Personnalisation du site (brouillon / publié) et paramètres
-- ---------------------------------------------------------------------
create table public.website_settings (
  id            int primary key default 1 check (id = 1),
  draft         jsonb not null default '{}'::jsonb,
  published     jsonb not null default '{}'::jsonb,
  published_at  timestamptz,
  updated_at    timestamptz not null default now()
);
create trigger website_settings_updated before update on public.website_settings
  for each row execute function public.set_updated_at();

create table public.app_settings (
  id          int primary key default 1 check (id = 1),
  currency    text not null default 'XOF',
  timezone    text not null default 'Africa/Lome',
  booking     jsonb not null default '{"default_min_nights":1,"deposit_percent":50,"accept_website_requests":true}'::jsonb,
  notifications jsonb not null default '{"new_request":true,"notify_email":""}'::jsonb,
  updated_at  timestamptz not null default now()
);
create trigger app_settings_updated before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Notifications internes (barre supérieure de l'administration)
-- ---------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  title       text not null,
  body        text not null default '',
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications (created_at desc) where read_at is null;

create or replace function public.notify_new_reservation()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_apt text; v_cust text;
begin
  if new.source = 'website' then
    select name into v_apt from public.apartments where id = new.apartment_id;
    select full_name into v_cust from public.customers where id = new.customer_id;
    insert into public.notifications (type, title, body, link)
    values ('booking_request', 'Nouvelle demande de réservation',
            coalesce(v_cust,'Client') || ' · ' || coalesce(v_apt,'') || ' · ' ||
            to_char(new.check_in,'DD/MM') || ' → ' || to_char(new.check_out,'DD/MM/YYYY'),
            '/admin/reservations/' || new.id);
  end if;
  return null;
end $$;
create trigger reservations_notify after insert on public.reservations
  for each row execute function public.notify_new_reservation();

-- ---------------------------------------------------------------------
-- Analytics first-party : sessions visiteurs et événements
-- (aucune adresse IP ni donnée personnelle n'est stockée)
-- ---------------------------------------------------------------------
create table public.visitor_sessions (
  id               uuid primary key,             -- identifiant de session (navigateur, 30 min d'inactivité)
  visitor_id       uuid not null,                -- identifiant anonyme persistant
  started_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  current_path     text,
  landing_path     text,
  referrer         text,
  referrer_domain  text,
  channel          text not null default 'direct'
                   check (channel in ('facebook','instagram','tiktok','google','direct','referral','whatsapp','email','other')),
  is_paid          boolean not null default false,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_content      text,
  utm_term         text,
  country          text,     -- code ISO pays fourni par l'hébergeur (en-tête géo), sinon NULL
  city             text,
  device           text check (device in ('mobile','tablet','desktop')),
  browser          text,
  os               text,
  page_views       int not null default 0,
  events           int not null default 0,
  engaged          boolean not null default false
);
create index visitor_sessions_last_seen_idx on public.visitor_sessions (last_seen_at desc);
create index visitor_sessions_started_idx on public.visitor_sessions (started_at desc);
create index visitor_sessions_visitor_idx on public.visitor_sessions (visitor_id);

create table public.analytics_events (
  id            bigint generated always as identity primary key,
  event_id      uuid not null unique,              -- déduplication (généré par le navigateur)
  session_id    uuid not null references public.visitor_sessions(id) on delete cascade,
  visitor_id    uuid not null,
  type          text not null check (type in ('page_view','apartment_view','pricing_view','whatsapp_click','phone_click','booking_start','booking_request')),
  path          text,
  apartment_id  uuid references public.apartments(id) on delete set null,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_type_idx on public.analytics_events (type, created_at desc);
create index analytics_events_apartment_idx on public.analytics_events (apartment_id, type) where apartment_id is not null;
create index analytics_events_session_idx on public.analytics_events (session_id);

-- Les réservations confirmées sont comptées depuis reservations.confirmed_at (donnée réelle du système).
