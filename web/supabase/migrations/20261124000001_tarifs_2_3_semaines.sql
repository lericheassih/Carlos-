-- Tarifs forfaitaires pour 2 semaines (14 nuits) et 3 semaines (21 nuits), en plus de la nuit, de la semaine et du mois.
alter table public.apartments
  add column if not exists price_2weeks int check (price_2weeks >= 0),
  add column if not exists price_3weeks int check (price_3weeks >= 0);
