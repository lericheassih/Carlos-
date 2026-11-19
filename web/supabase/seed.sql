-- =====================================================================
--  Import des 3 logements LUMO existants (repris de la page de réservation
--  actuelle) en BROUILLON : ajoutez les photos puis cliquez sur « Publier ».
--  Exécuté automatiquement en local (supabase db reset) ; en production,
--  à lancer une seule fois dans Supabase > SQL Editor (facultatif).
-- =====================================================================
insert into public.apartments (slug, name, status, short_description, description, city, neighborhood, property_type,
  bedrooms, living_rooms, bathrooms, max_guests, price_night, price_week, price_month, min_nights,
  check_in_time, check_out_time, house_rules)
values
 ('appartement-3-chambres-totsi', 'Appartement 3 chambres salon, Totsi', 'draft',
  'Appartement meublé de 3 chambres avec grand salon lumineux, cuisine équipée et climatisation.',
  'Un appartement meublé de 3 chambres avec grand salon lumineux, salle à manger, cuisine équipée et climatisation. Décoration soignée, literie blanche et rideaux occultants dans les chambres.',
  'Lomé', 'Totsi', 'appartement', 3, 1, 1, 6, 75000, 500000, 800000, 2, '14:00', '13:00',
  E'Arrivée entre 14:00 et 16:00, départ avant 13:00\nSéjour de 2 nuits minimum'),
 ('chambre-salon-hedzranawoe', 'Chambre salon, Hedzranawoé', 'draft',
  'Appartement meublé d''une chambre avec salon et coin cuisine, idéal voyageur seul, couple ou séjour professionnel.',
  'Un appartement meublé d''une chambre avec salon confortable, coin cuisine équipé (réfrigérateur, plaques de cuisson, micro-ondes, bouilloire), climatisation et salle de douche moderne. Idéal pour un voyageur seul, un couple ou un séjour professionnel.',
  'Lomé', 'Hedzranawoé', 'appartement', 1, 1, 1, 4, 40000, 250000, 450000, 2, '14:00', '13:00',
  E'Arrivée entre 14:00 et 16:00, départ avant 13:00\nSéjour de 2 nuits minimum'),
 ('villa-2-chambres-hedzranawoe', 'Villa 2 chambres salon, Hedzranawoé', 'draft',
  'Villa meublée de 2 chambres climatisées avec grand salon, salle à manger, cuisine équipée et jardin.',
  'Une villa meublée de 2 chambres climatisées avec grand salon lumineux (canapé en cuir, fauteuils, télévision écran plat), salle à manger de 6 places, cuisine équipée (cuisinière à gaz, réfrigérateur) et salle de bain avec douche à l''italienne. Jardin aménagé à l''extérieur.',
  'Lomé', 'Hedzranawoé', 'villa', 2, 1, 1, 4, 60000, 400000, 700000, 2, '14:00', '13:00',
  E'Arrivée entre 14:00 et 16:00, départ avant 13:00\nSéjour de 2 nuits minimum')
on conflict (slug) do nothing;

insert into public.apartment_amenities (apartment_id, amenity_id)
select a.id, m.id from public.apartments a
join public.amenities m on m.name in ('Wi-Fi','Climatisation','Cuisine équipée','Télévision','Réfrigérateur','Machine à laver','Parking','Espace de travail','Linge de maison fourni')
where a.slug in ('appartement-3-chambres-totsi','chambre-salon-hedzranawoe','villa-2-chambres-hedzranawoe')
on conflict do nothing;
