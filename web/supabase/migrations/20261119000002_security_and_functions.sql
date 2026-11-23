-- =====================================================================
--  Sécurité (RLS), vues publiques, fonctions métier et statistiques
-- =====================================================================

-- ---------------------------------------------------------------------
-- RLS : tout est fermé par défaut, l'administration passe par is_admin()
-- ---------------------------------------------------------------------
alter table public.admin_users        enable row level security;
alter table public.apartments         enable row level security;
alter table public.amenities          enable row level security;
alter table public.apartment_amenities enable row level security;
alter table public.media              enable row level security;
alter table public.apartment_media    enable row level security;
alter table public.customers          enable row level security;
alter table public.reservations       enable row level security;
alter table public.payments           enable row level security;
alter table public.blocked_dates      enable row level security;
alter table public.reviews            enable row level security;
alter table public.website_settings   enable row level security;
alter table public.app_settings       enable row level security;
alter table public.notifications      enable row level security;
alter table public.visitor_sessions   enable row level security;
alter table public.analytics_events   enable row level security;

-- Équipe
create policy admin_users_read on public.admin_users for select to authenticated using (public.is_admin());
create policy admin_users_write on public.admin_users for all to authenticated
  using (public.admin_role() = 'owner') with check (public.admin_role() = 'owner');

-- Tables de gestion : lecture/écriture pour l'équipe, suppression réservée aux gérants
do $$
declare t text;
begin
  foreach t in array array['apartments','amenities','apartment_amenities','media','apartment_media',
                           'customers','reservations','payments','blocked_dates','reviews','notifications']
  loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (public.is_admin())', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  foreach t in array array['apartments','media','customers','reservations','reviews']
  loop
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_manager())', t);
  end loop;
  foreach t in array array['amenities','apartment_amenities','apartment_media','payments','blocked_dates','notifications']
  loop
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Paramètres : lecture équipe, modification gérants
create policy website_settings_select on public.website_settings for select to authenticated using (public.is_admin());
create policy website_settings_update on public.website_settings for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy app_settings_select on public.app_settings for select to authenticated using (public.is_admin());
create policy app_settings_update on public.app_settings for update to authenticated using (public.is_manager()) with check (public.is_manager());

-- Analytics : lecture seule pour l'équipe ; l'écriture passe par le serveur (service_role)
create policy visitor_sessions_select on public.visitor_sessions for select to authenticated using (public.is_admin());
create policy analytics_events_select on public.analytics_events for select to authenticated using (public.is_admin());

-- Le rôle anonyme n'a accès à aucune table directement
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------
-- Vues publiques : seules les données PUBLIÉES sortent vers le site
-- ---------------------------------------------------------------------
create or replace view public.public_apartments as
  select a.id, (a.published->>'slug') as slug, a.published, a.published_at, a.featured, a.sort_order,
         r.avg_rating, coalesce(r.review_count, 0) as review_count
  from public.apartments a
  left join lateral (
    select round(avg(rating)::numeric, 1) as avg_rating, count(*)::int as review_count
    from public.reviews where apartment_id = a.id and is_published
  ) r on true
  where a.status = 'published' and a.published is not null;

create or replace view public.public_reviews as
  select v.id, v.apartment_id, v.author_name, v.author_country, v.rating, v.comment, v.stay_date, v.created_at
  from public.reviews v
  left join public.apartments a on a.id = v.apartment_id
  where v.is_published and (v.apartment_id is null or a.status = 'published');

create or replace view public.public_site as
  select published as settings, published_at from public.website_settings where id = 1;

grant select on public.public_apartments, public.public_reviews, public.public_site to anon, authenticated;

-- Disponibilités publiques : plages occupées uniquement (aucune donnée client)
create or replace function public.get_unavailable_ranges(p_apartment uuid)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select r.check_in, r.check_out from public.reservations r
   join public.apartments a on a.id = r.apartment_id and a.status = 'published'
   where r.apartment_id = p_apartment and r.status in ('confirmed','in_progress')
     and r.check_out >= (now() at time zone 'Africa/Lome')::date
  union all
  select b.start_date, b.end_date from public.blocked_dates b
   join public.apartments a on a.id = b.apartment_id and a.status = 'published'
   where b.apartment_id = p_apartment
     and b.end_date >= (now() at time zone 'Africa/Lome')::date
  order by 1;
$$;

-- Appartements publiés libres sur une période (filtre « disponibilité » du catalogue)
create or replace function public.available_apartment_ids(p_in date, p_out date)
returns setof uuid language sql stable security definer set search_path = public as $$
  select a.id from public.apartments a
  where a.status = 'published'
    and p_out > p_in
    and not exists (select 1 from public.reservations r where r.apartment_id = a.id
                    and r.status in ('confirmed','in_progress') and r.stay && daterange(p_in, p_out, '[)'))
    and not exists (select 1 from public.blocked_dates b where b.apartment_id = a.id
                    and b.period && daterange(p_in, p_out, '[)'));
$$;

grant execute on function public.get_unavailable_ranges(uuid) to anon, authenticated;
grant execute on function public.available_apartment_ids(date, date) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Demande de réservation depuis le site (appelée par le serveur uniquement)
-- ---------------------------------------------------------------------
create or replace function public.submit_booking_request(
  p_apartment uuid, p_check_in date, p_check_out date, p_guests int,
  p_full_name text, p_phone text, p_email text, p_message text,
  p_price_per_night int, p_extra_fees int, p_total int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_apt public.apartments; v_customer uuid; v_res public.reservations;
  v_today date := (now() at time zone 'Africa/Lome')::date;
  v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
begin
  select * into v_apt from public.apartments where id = p_apartment and status = 'published';
  if not found then raise exception 'Appartement introuvable.' using errcode = 'P0001'; end if;
  if p_check_in < v_today then raise exception 'La date d''arrivée est déjà passée.' using errcode = 'P0001'; end if;
  if p_check_out <= p_check_in then raise exception 'La date de départ doit suivre la date d''arrivée.' using errcode = 'P0001'; end if;
  if (p_check_out - p_check_in) < v_apt.min_nights then
    raise exception 'Séjour minimum : % nuit(s).', v_apt.min_nights using errcode = 'P0001'; end if;
  if p_guests < 1 or p_guests > v_apt.max_guests then
    raise exception 'Capacité maximale : % personne(s).', v_apt.max_guests using errcode = 'P0001'; end if;
  if not exists (select 1 from public.available_apartment_ids(p_check_in, p_check_out) x where x = p_apartment) then
    raise exception 'Ces dates ne sont plus disponibles.' using errcode = 'P0001'; end if;
  if char_length(trim(p_full_name)) < 2 or char_length(v_phone) < 8 then
    raise exception 'Nom et numéro de téléphone requis.' using errcode = 'P0001'; end if;

  select id into v_customer from public.customers
   where regexp_replace(coalesce(whatsapp,''), '[^0-9+]', '', 'g') = v_phone
      or regexp_replace(coalesce(phone,''), '[^0-9+]', '', 'g') = v_phone
   order by created_at limit 1;
  if v_customer is null then
    insert into public.customers (full_name, phone, whatsapp, email)
    values (trim(p_full_name), v_phone, v_phone, nullif(trim(coalesce(p_email,'')), ''))
    returning id into v_customer;
  elsif nullif(trim(coalesce(p_email,'')), '') is not null then
    update public.customers set email = coalesce(email, trim(p_email)) where id = v_customer;
  end if;

  insert into public.reservations (apartment_id, customer_id, check_in, check_out, guests,
         price_per_night, extra_fees, total_amount, status, source, notes)
  values (p_apartment, v_customer, p_check_in, p_check_out, p_guests,
          greatest(p_price_per_night,0), greatest(p_extra_fees,0), greatest(p_total,0), 'pending', 'website',
          coalesce(left(p_message, 2000), ''))
  returning * into v_res;

  return jsonb_build_object('id', v_res.id, 'reference', v_res.reference);
end $$;
revoke execute on function public.submit_booking_request from public, anon, authenticated;
grant execute on function public.submit_booking_request to service_role;

-- ---------------------------------------------------------------------
-- Collecte analytics (appelée par le serveur uniquement)
-- ---------------------------------------------------------------------
create or replace function public.ingest_event(
  p_event_id uuid, p_session_id uuid, p_visitor_id uuid, p_type text, p_path text,
  p_apartment uuid, p_metadata jsonb, p_session jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.visitor_sessions as s (id, visitor_id, current_path, landing_path, referrer, referrer_domain,
       channel, is_paid, utm_source, utm_medium, utm_campaign, utm_content, utm_term, country, city, device, browser, os)
  values (p_session_id, p_visitor_id, p_path, p_path,
          p_session->>'referrer', p_session->>'referrer_domain', coalesce(p_session->>'channel','direct'),
          coalesce((p_session->>'is_paid')::boolean, false),
          p_session->>'utm_source', p_session->>'utm_medium', p_session->>'utm_campaign',
          p_session->>'utm_content', p_session->>'utm_term',
          p_session->>'country', p_session->>'city', p_session->>'device', p_session->>'browser', p_session->>'os')
  on conflict (id) do update set
     last_seen_at = now(),
     current_path = coalesce(excluded.current_path, s.current_path),
     country = coalesce(s.country, excluded.country),
     city = coalesce(s.city, excluded.city)
  where s.visitor_id = excluded.visitor_id;

  if p_type = 'heartbeat' then
    return;
  elsif p_type = 'engaged' then
    update public.visitor_sessions set engaged = true where id = p_session_id;
    return;
  end if;

  insert into public.analytics_events (event_id, session_id, visitor_id, type, path, apartment_id, metadata)
  select p_event_id, p_session_id, p_visitor_id, p_type, p_path,
         (select id from public.apartments where id = p_apartment), coalesce(p_metadata, '{}'::jsonb)
  where exists (select 1 from public.visitor_sessions where id = p_session_id and visitor_id = p_visitor_id)
  on conflict (event_id) do nothing;

  if found then
    update public.visitor_sessions set
      page_views = page_views + case when p_type = 'page_view' then 1 else 0 end,
      events = events + 1,
      engaged = engaged or (page_views + case when p_type = 'page_view' then 1 else 0 end) >= 2
                        or p_type in ('whatsapp_click','phone_click','booking_start','booking_request','pricing_view')
    where id = p_session_id;
  end if;
end $$;
revoke execute on function public.ingest_event from public, anon, authenticated;
grant execute on function public.ingest_event to service_role;

-- Purge des données analytics trop anciennes (minimisation des données)
create or replace function public.purge_analytics(p_keep_days int default 400)
returns void language sql security definer set search_path = public as $$
  delete from public.visitor_sessions where last_seen_at < now() - make_interval(days => p_keep_days);
$$;
revoke execute on function public.purge_analytics from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Statistiques du tableau de bord (données réelles uniquement)
-- ---------------------------------------------------------------------
create or replace function public.dashboard_stats(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Africa/Lome')::date;
  v_days int := (p_to - p_from) + 1;
  v_prev_from date := p_from - v_days;
  v_prev_to date := p_from - 1;
  v_published int; r jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select count(*) into v_published from public.apartments where status = 'published';

  with occ_today as (
    select distinct apartment_id from public.reservations
     where status in ('confirmed','in_progress') and check_in <= v_today and check_out > v_today
  ), blk_today as (
    select distinct apartment_id from public.blocked_dates where start_date <= v_today and end_date > v_today
  ), period_nights as (
    select
      coalesce(sum(greatest(0, least(check_out, p_to + 1) - greatest(check_in, p_from))) filter (where true), 0) as cur
    from public.reservations r join public.apartments a on a.id = r.apartment_id and a.status = 'published'
    where r.status in ('confirmed','in_progress','completed') and r.stay && daterange(p_from, p_to + 1, '[)')
  ), prev_nights as (
    select coalesce(sum(greatest(0, least(check_out, v_prev_to + 1) - greatest(check_in, v_prev_from))), 0) as prev
    from public.reservations r join public.apartments a on a.id = r.apartment_id and a.status = 'published'
    where r.status in ('confirmed','in_progress','completed') and r.stay && daterange(v_prev_from, v_prev_to + 1, '[)')
  )
  select jsonb_build_object(
    'apartments_total', (select count(*) from public.apartments where status <> 'archived'),
    'apartments_published', v_published,
    'occupied_today', (select count(*) from occ_today o join public.apartments a on a.id = o.apartment_id and a.status = 'published'),
    'blocked_today', (select count(*) from blk_today b join public.apartments a on a.id = b.apartment_id and a.status = 'published'
                       where b.apartment_id not in (select apartment_id from occ_today)),
    'available_today', (select count(*) from public.apartments a where a.status = 'published'
                          and a.id not in (select apartment_id from occ_today)
                          and a.id not in (select apartment_id from blk_today)),
    'reservations_period', (select count(*) from public.reservations
                              where status in ('confirmed','in_progress','completed') and check_in between p_from and p_to),
    'reservations_prev', (select count(*) from public.reservations
                              where status in ('confirmed','in_progress','completed') and check_in between v_prev_from and v_prev_to),
    'requests_period', (select count(*) from public.reservations where (created_at at time zone 'Africa/Lome')::date between p_from and p_to),
    'pending_total', (select count(*) from public.reservations where status = 'pending'),
    'revenue_collected', (select coalesce(sum(amount),0) from public.payments where paid_at between p_from and p_to),
    'revenue_collected_prev', (select coalesce(sum(amount),0) from public.payments where paid_at between v_prev_from and v_prev_to),
    'revenue_booked', (select coalesce(sum(total_amount),0) from public.reservations
                         where status in ('confirmed','in_progress','completed') and check_in between p_from and p_to),
    'balance_due', (select coalesce(sum(total_amount - amount_paid),0) from public.reservations
                      where status in ('confirmed','in_progress') and total_amount > amount_paid),
    'occupancy_rate', case when v_published = 0 then 0
                       else round(100.0 * (select cur from period_nights) / (v_published * v_days), 1) end,
    'occupancy_prev', case when v_published = 0 then 0
                       else round(100.0 * (select prev from prev_nights) / (v_published * v_days), 1) end,
    'customers_total', (select count(*) from public.customers),
    'customers_new', (select count(*) from public.customers where (created_at at time zone 'Africa/Lome')::date between p_from and p_to),
    'period', jsonb_build_object('from', p_from, 'to', p_to, 'prev_from', v_prev_from, 'prev_to', v_prev_to)
  ) into r;
  return r;
end $$;

create or replace function public.dashboard_series(p_from date, p_to date, p_bucket text default 'day')
returns table (bucket date, revenue bigint, reservations bigint, nights bigint, occupancy numeric)
language plpgsql stable security definer set search_path = public as $$
declare v_step interval; v_published int;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_bucket not in ('day','week','month') then p_bucket := 'day'; end if;
  v_step := ('1 ' || p_bucket)::interval;
  select count(*) into v_published from public.apartments where status = 'published';
  return query
  with b as (
    select g::date as b_start,
           least((g + v_step)::date, p_to + 1) as b_end
    from generate_series(date_trunc(p_bucket, p_from::timestamp), p_to::timestamp, v_step) g
  ), bb as (select greatest(b_start, p_from) as b_start, b_end from b)
  select bb.b_start,
    (select coalesce(sum(p.amount),0) from public.payments p where p.paid_at >= bb.b_start and p.paid_at < bb.b_end)::bigint,
    (select count(*) from public.reservations r where r.status in ('confirmed','in_progress','completed')
       and r.check_in >= bb.b_start and r.check_in < bb.b_end)::bigint,
    (select coalesce(sum(greatest(0, least(r.check_out, bb.b_end) - greatest(r.check_in, bb.b_start))),0)
       from public.reservations r join public.apartments a on a.id = r.apartment_id and a.status = 'published'
      where r.status in ('confirmed','in_progress','completed') and r.stay && daterange(bb.b_start, bb.b_end, '[)'))::bigint,
    case when v_published = 0 or bb.b_end <= bb.b_start then 0::numeric else round(100.0 *
      (select coalesce(sum(greatest(0, least(r.check_out, bb.b_end) - greatest(r.check_in, bb.b_start))),0)
         from public.reservations r join public.apartments a on a.id = r.apartment_id and a.status = 'published'
        where r.status in ('confirmed','in_progress','completed') and r.stay && daterange(bb.b_start, bb.b_end, '[)'))
      / (v_published * (bb.b_end - bb.b_start)), 1) end
  from bb order by 1;
end $$;

-- Statistiques par client (fiche et liste)
create or replace view public.customer_stats with (security_invoker = true) as
  select c.*,
    count(r.id) filter (where r.status in ('confirmed','in_progress','completed')) as stays,
    count(r.id) as reservations_count,
    coalesce(sum(r.amount_paid) filter (where r.status <> 'cancelled'), 0) as total_spent,
    max(r.check_in) as last_check_in
  from public.customers c left join public.reservations r on r.customer_id = c.id
  group by c.id;
grant select on public.customer_stats to authenticated;

-- ---------------------------------------------------------------------
-- Analytics : temps réel et rapports
-- ---------------------------------------------------------------------
create or replace function public.analytics_realtime()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_day_start timestamptz := date_trunc('day', now() at time zone 'Africa/Lome') at time zone 'Africa/Lome';
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'active_now', (select count(distinct visitor_id) from public.visitor_sessions where last_seen_at >= now() - interval '60 seconds'),
    'active_5min', (select count(distinct visitor_id) from public.visitor_sessions where last_seen_at >= now() - interval '5 minutes'),
    'visitors_today', (select count(distinct visitor_id) from public.visitor_sessions where last_seen_at >= v_day_start),
    'new_visitors_today', (select count(*) from (
        select visitor_id from public.visitor_sessions group by visitor_id having min(started_at) >= v_day_start) x),
    'sessions_today', (select count(*) from public.visitor_sessions where started_at >= v_day_start),
    'pageviews_today', (select count(*) from public.analytics_events where type = 'page_view' and created_at >= v_day_start),
    'whatsapp_today', (select count(*) from public.analytics_events where type = 'whatsapp_click' and created_at >= v_day_start),
    'active_pages', coalesce((select jsonb_agg(x) from (
        select current_path as path, count(distinct visitor_id) as visitors from public.visitor_sessions
         where last_seen_at >= now() - interval '5 minutes' group by current_path order by 2 desc limit 8) x), '[]'::jsonb),
    'active_countries', coalesce((select jsonb_agg(x) from (
        select coalesce(country,'??') as country, count(distinct visitor_id) as visitors from public.visitor_sessions
         where last_seen_at >= now() - interval '5 minutes' group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
    'server_time', now()
  );
end $$;

create or replace function public.analytics_report(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_hourly boolean := (p_to - p_from) <= interval '2 days'; r jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  with s as (select * from public.visitor_sessions where started_at >= p_from and started_at < p_to),
       e as (select * from public.analytics_events where created_at >= p_from and created_at < p_to),
       tot as (select count(distinct visitor_id) as visitors from s)
  select jsonb_build_object(
    'hourly', v_hourly,
    'totals', jsonb_build_object(
      'visitors', (select visitors from tot),
      'sessions', (select count(*) from s),
      'pageviews', (select count(*) from e where type = 'page_view'),
      'avg_duration_sec', (select coalesce(round(avg(extract(epoch from (last_seen_at - started_at)))), 0) from s),
      'engagement_rate', (select case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where engaged) / count(*), 1) end from s),
      'new_visitors', (select count(*) from (select visitor_id from public.visitor_sessions group by visitor_id
                        having min(started_at) >= p_from and min(started_at) < p_to) x),
      'pages_per_session', (select case when count(*) = 0 then 0 else round(avg(page_views)::numeric, 2) end from s)
    ),
    'series', coalesce((select jsonb_agg(x order by x.t) from (
        select g as t,
          (select count(distinct visitor_id) from s where started_at >= g and started_at < g + case when v_hourly then interval '1 hour' else interval '1 day' end) as visitors,
          (select count(*) from s where started_at >= g and started_at < g + case when v_hourly then interval '1 hour' else interval '1 day' end) as sessions,
          (select count(*) from e where type = 'page_view' and created_at >= g and created_at < g + case when v_hourly then interval '1 hour' else interval '1 day' end) as pageviews
        from generate_series(
          case when v_hourly then date_trunc('hour', p_from) else (date_trunc('day', p_from at time zone 'Africa/Lome') at time zone 'Africa/Lome') end,
          p_to - interval '1 second',
          case when v_hourly then interval '1 hour' else interval '1 day' end) g) x), '[]'::jsonb),
    'apartments', coalesce((select jsonb_agg(x order by x.views desc, x.name) from (
        select a.id, a.name, a.slug, a.status,
          count(*) filter (where e.type = 'apartment_view') as views,
          count(distinct e.visitor_id) filter (where e.type = 'apartment_view') as unique_visitors,
          count(*) filter (where e.type = 'pricing_view') as pricing_views,
          count(*) filter (where e.type = 'whatsapp_click') as whatsapp_clicks,
          count(*) filter (where e.type = 'phone_click') as phone_clicks,
          count(*) filter (where e.type = 'booking_start') as booking_starts,
          count(*) filter (where e.type = 'booking_request') as booking_requests,
          (select count(*) from public.reservations r where r.apartment_id = a.id
             and r.confirmed_at >= p_from and r.confirmed_at < p_to and r.status <> 'cancelled') as confirmed
        from public.apartments a left join e on e.apartment_id = a.id
        where a.status <> 'archived' or e.id is not null
        group by a.id) x), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(x order by x.visitors desc) from (
        select coalesce(country, '??') as country, count(distinct visitor_id) as visitors, count(*) as sessions,
          round(100.0 * count(distinct visitor_id) / nullif((select visitors from tot), 0), 1) as pct
        from s group by 1 order by 2 desc limit 50) x), '[]'::jsonb),
    'cities', coalesce((select jsonb_agg(x order by x.visitors desc) from (
        select country, city, count(distinct visitor_id) as visitors
        from s where city is not null group by 1, 2 order by 3 desc limit 20) x), '[]'::jsonb),
    'channels', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select case when is_paid then 'paid' else channel end as channel,
          count(*) as sessions, count(distinct visitor_id) as visitors,
          count(*) filter (where engaged) as engaged
        from s group by 1) x), '[]'::jsonb),
    'social', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select channel, is_paid, count(*) as sessions, count(distinct visitor_id) as visitors
        from s group by 1, 2) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select referrer_domain as domain, count(*) as sessions from s where referrer_domain is not null
        group by 1 order by 2 desc limit 15) x), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content, s.utm_term,
          count(distinct s.id) as sessions, count(distinct s.visitor_id) as visitors,
          (select count(*) from e where e.type = 'whatsapp_click' and e.session_id in
             (select id from s s2 where s2.utm_source is not distinct from s.utm_source and s2.utm_campaign is not distinct from s.utm_campaign
                and s2.utm_medium is not distinct from s.utm_medium and s2.utm_content is not distinct from s.utm_content and s2.utm_term is not distinct from s.utm_term)) as whatsapp_clicks,
          (select count(*) from e where e.type = 'booking_request' and e.session_id in
             (select id from s s2 where s2.utm_source is not distinct from s.utm_source and s2.utm_campaign is not distinct from s.utm_campaign
                and s2.utm_medium is not distinct from s.utm_medium and s2.utm_content is not distinct from s.utm_content and s2.utm_term is not distinct from s.utm_term)) as booking_requests
        from s where s.utm_source is not null or s.utm_campaign is not null
        group by 1,2,3,4,5 order by 6 desc limit 50) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(x) from (
        select coalesce(device,'inconnu') as device, count(*) as sessions from s group by 1 order by 2 desc) x), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'visitors', (select visitors from tot),
      'apartment_viewers', (select count(distinct visitor_id) from e where type = 'apartment_view'),
      'whatsapp_clicks', (select count(*) from e where type = 'whatsapp_click'),
      'whatsapp_clickers', (select count(distinct visitor_id) from e where type = 'whatsapp_click'),
      'phone_clicks', (select count(*) from e where type = 'phone_click'),
      'booking_starts', (select count(*) from e where type = 'booking_start'),
      'booking_requests', (select count(*) from e where type = 'booking_request'),
      'confirmed', (select count(*) from public.reservations where confirmed_at >= p_from and confirmed_at < p_to and status <> 'cancelled')
    ),
    'events_series', coalesce((select jsonb_agg(x order by x.t) from (
        select (date_trunc('day', created_at at time zone 'Africa/Lome'))::date as t,
          count(*) filter (where type = 'whatsapp_click') as whatsapp_clicks,
          count(*) filter (where type = 'booking_request') as booking_requests,
          count(*) filter (where type = 'apartment_view') as apartment_views
        from e group by 1) x), '[]'::jsonb)
  ) into r;
  return r;
end $$;

grant execute on function public.dashboard_stats(date, date) to authenticated;
grant execute on function public.dashboard_series(date, date, text) to authenticated;
grant execute on function public.analytics_realtime() to authenticated;
grant execute on function public.analytics_report(timestamptz, timestamptz) to authenticated;
grant execute on function public.refresh_reservation_statuses() to authenticated;
revoke execute on function public.dashboard_stats(date, date), public.dashboard_series(date, date, text),
  public.analytics_realtime(), public.analytics_report(timestamptz, timestamptz), public.refresh_reservation_statuses() from anon;

-- ---------------------------------------------------------------------
-- Stockage cloud des médias (Supabase Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 209715200,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy media_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy media_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------
-- Temps réel (Supabase Realtime) : actualisation de l'administration
-- ---------------------------------------------------------------------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.visitor_sessions, public.analytics_events,
      public.reservations, public.notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Données de départ (équipements standards, paramètres)
-- ---------------------------------------------------------------------
insert into public.amenities (name, icon, category, sort_order) values
  ('Wi-Fi','wifi','Internet et bureau',1),
  ('Climatisation','snowflake','Confort',2),
  ('Cuisine équipée','chef-hat','Cuisine',3),
  ('Télévision','tv','Divertissement',4),
  ('Groupe électrogène','zap','Confort',5),
  ('Parking','car','Extérieur',6),
  ('Piscine','waves','Extérieur',7),
  ('Chauffe-eau','droplets','Salle de bain',8),
  ('Réfrigérateur','refrigerator','Cuisine',9),
  ('Machine à laver','washing-machine','Linge',10),
  ('Sécurité','shield-check','Sécurité',11),
  ('Ascenseur','arrow-up-down','Immeuble',12),
  ('Balcon','sun','Extérieur',13),
  ('Terrasse','umbrella','Extérieur',14),
  ('Espace de travail','laptop','Internet et bureau',15),
  ('Linge de maison fourni','bed-double','Linge',16)
on conflict (name) do nothing;

insert into public.app_settings (id) values (1) on conflict do nothing;

insert into public.website_settings (id, draft, published, published_at)
select 1, s, s, now() from (select jsonb_build_object(
  'company_name', 'LUMO Immobilier',
  'tagline', 'Appartements meublés à Lomé',
  'logo_url', null,
  'phone', '+228 70 39 05 05',
  'whatsapp', '22870390505',
  'email', '',
  'address', 'Lomé, Togo',
  'primary_color', '#FF385C',
  'accent_color', '#E61E4D',
  'hero_title', 'Votre appartement meublé à Lomé',
  'hero_subtitle', 'Des logements entièrement équipés pour vos séjours d''affaires, vos vacances ou votre retour au pays. Réservation simple et rapide sur WhatsApp.',
  'hero_images', '[]'::jsonb,
  'about_title', 'Pourquoi séjourner chez nous',
  'about_text', 'Nous proposons des appartements meublés soigneusement entretenus, situés dans des quartiers calmes et sécurisés de Lomé.',
  'services', jsonb_build_array(
     jsonb_build_object('title','Logements équipés','text','Cuisine, climatisation, Wi-Fi et linge de maison fournis.'),
     jsonb_build_object('title','Séjours courts ou longs','text','À la nuit, à la semaine ou au mois, avec des tarifs dégressifs.'),
     jsonb_build_object('title','Accueil réactif','text','Une équipe joignable sur WhatsApp avant et pendant votre séjour.')),
  'advantages', jsonb_build_array('Quartiers calmes et sécurisés','Tarifs dégressifs pour les longs séjours','Réservation rapide sur WhatsApp','Idéal voyageurs d''affaires et diaspora'),
  'booking_conditions', '',
  'cancellation_policy', '',
  'contact_text', 'Une question ? Écrivez-nous sur WhatsApp, nous répondons rapidement.',
  'social', jsonb_build_object('facebook','','instagram','','tiktok',''),
  'seo_title', 'LUMO Immobilier — Appartements meublés à Lomé, Togo',
  'consent_mode', 'notice',
  'seo_description', 'Location d''appartements meublés à Lomé : séjours courts et longs, réservation sur WhatsApp.'
) as s) x
on conflict (id) do nothing;

-- Ceinture et bretelles : aucun accès anonyme hors vues/fonctions publiques
revoke all on public.customer_stats from anon;
revoke execute on function public.refresh_payment_status(uuid) from public, anon;
