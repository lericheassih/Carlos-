-- Présentation façon plateformes hôtelières : équipements détaillés, « non inclus », pièces des photos
alter table public.amenities add column if not exists description text not null default '';
alter table public.apartment_amenities add column if not exists included boolean not null default true;
alter table public.apartment_media add column if not exists room text not null default '';

-- Catégories harmonisées
update public.amenities set category = 'Internet et bureau' where name in ('Wi-Fi','Espace de travail');
update public.amenities set category = 'Chauffage et climatisation' where name = 'Climatisation';
update public.amenities set category = 'Cuisine et salle à manger' where name in ('Cuisine équipée','Réfrigérateur');
update public.amenities set category = 'Divertissement' where name = 'Télévision';
update public.amenities set category = 'Parking et installations' where name in ('Parking','Piscine','Ascenseur','Balcon','Terrasse','Groupe électrogène');
update public.amenities set category = 'Salle de bain' where name = 'Chauffe-eau';
update public.amenities set category = 'Chambre et linge' where name in ('Machine à laver','Linge de maison fourni');
update public.amenities set category = 'Sécurité' where name = 'Sécurité';
update public.amenities set description = 'Espace où les voyageurs peuvent cuisiner' where name = 'Cuisine équipée';
update public.amenities set description = 'Serviettes, draps, savon et papier toilette', name = 'Produits de base' where name = 'Linge de maison fourni';
update public.amenities set name = 'Lave-linge' where name = 'Machine à laver';
update public.amenities set name = 'Espace de travail dédié' where name = 'Espace de travail';
update public.amenities set name = 'Stationnement gratuit sur place' where name = 'Parking';
update public.amenities set name = 'Wifi' where name = 'Wi-Fi';

insert into public.amenities (name, icon, category, description, sort_order) values
  ('Sèche-cheveux','wind','Salle de bain','',20),
  ('Shampoing','droplet','Salle de bain','',21),
  ('Eau chaude','bath','Salle de bain','',22),
  ('Sèche-linge','washing-machine','Chambre et linge','',23),
  ('Cintres','shirt','Chambre et linge','',24),
  ('Chauffage','thermometer','Chauffage et climatisation','',25),
  ('Tout le nécessaire pour cuisiner','cooking-pot','Cuisine et salle à manger','Casseroles et poêles, huile, sel et poivre',26),
  ('Cuisinière à gaz','flame','Cuisine et salle à manger','',27),
  ('Micro-ondes','microwave','Cuisine et salle à manger','',28),
  ('Cafetière','coffee','Cuisine et salle à manger','',29),
  ('Animaux acceptés','paw-print','Services','Les animaux d''assistance sont toujours autorisés',30),
  ('Logement fumeur','cigarette','Services','',31),
  ('Arrivée autonome','key-round','Services','',32),
  ('Boîte à clé sécurisée','lock','Services','',33),
  ('Caméras de surveillance extérieures','cctv','Sécurité','',34),
  ('Détecteur de fumée','alarm-smoke','Sécurité','',35),
  ('Détecteur de monoxyde de carbone','siren','Sécurité','',36),
  ('Extincteur','fire-extinguisher','Sécurité','',37),
  ('Kit de premiers secours','briefcase-medical','Sécurité','',38)
on conflict (name) do nothing;
