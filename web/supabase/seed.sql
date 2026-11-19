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
  E'Arrivée entre 14:00 et 16:00\nSéjour de 2 nuits minimum'),
 ('chambre-salon-hedzranawoe', 'Chambre salon, Hedzranawoé', 'draft',
  'Appartement meublé d''une chambre avec salon et coin cuisine, idéal voyageur seul, couple ou séjour professionnel.',
  'Un appartement meublé d''une chambre avec salon confortable, coin cuisine équipé (réfrigérateur, plaques de cuisson, micro-ondes, bouilloire), climatisation et salle de douche moderne. Idéal pour un voyageur seul, un couple ou un séjour professionnel.',
  'Lomé', 'Hedzranawoé', 'appartement', 1, 1, 1, 4, 40000, 250000, 450000, 2, '14:00', '13:00',
  E'Arrivée entre 14:00 et 16:00\nSéjour de 2 nuits minimum'),
 ('villa-2-chambres-hedzranawoe', 'Villa 2 chambres salon, Hedzranawoé', 'draft',
  'Villa meublée de 2 chambres climatisées avec grand salon, salle à manger, cuisine équipée et jardin.',
  'Une villa meublée de 2 chambres climatisées avec grand salon lumineux (canapé en cuir, fauteuils, télévision écran plat), salle à manger de 6 places, cuisine équipée (cuisinière à gaz, réfrigérateur) et salle de bain avec douche à l''italienne. Jardin aménagé à l''extérieur.',
  'Lomé', 'Hedzranawoé', 'villa', 2, 1, 1, 4, 60000, 400000, 700000, 2, '14:00', '13:00',
  E'Arrivée entre 14:00 et 16:00\nSéjour de 2 nuits minimum')
on conflict (slug) do nothing;

-- Équipements repris de vos annonces actuelles (inclus), et éléments affichés « non inclus »
insert into public.apartment_amenities (apartment_id, amenity_id, included)
select a.id, m.id, true from public.apartments a
join public.amenities m on m.name in ('Sèche-cheveux','Shampoing','Eau chaude','Lave-linge','Sèche-linge','Produits de base','Cintres',
  'Télévision','Climatisation','Chauffage','Wifi','Espace de travail dédié','Cuisine équipée','Réfrigérateur','Tout le nécessaire pour cuisiner',
  'Cuisinière à gaz','Cafetière','Stationnement gratuit sur place','Animaux acceptés','Logement fumeur','Arrivée autonome','Boîte à clé sécurisée')
where a.slug in ('appartement-3-chambres-totsi','chambre-salon-hedzranawoe','villa-2-chambres-hedzranawoe')
on conflict do nothing;

insert into public.apartment_amenities (apartment_id, amenity_id, included)
select a.id, m.id, false from public.apartments a
join public.amenities m on m.name in ('Caméras de surveillance extérieures','Détecteur de fumée','Détecteur de monoxyde de carbone')
where a.slug in ('appartement-3-chambres-totsi','chambre-salon-hedzranawoe','villa-2-chambres-hedzranawoe')
on conflict do nothing;
