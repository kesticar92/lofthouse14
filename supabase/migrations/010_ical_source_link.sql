-- 010_ical_source_link.sql
--
-- Vincula cada reserva importada por iCal a su `ical_sources.id` para que al
-- eliminar un calendario sincronizado se eliminen también las reservas que
-- trajo (sin dejar "rastro visual" en el timeline de Reservas & ocupación).
--
-- Cambios:
--   1. Nueva columna `reservations.ical_source_id` (uuid, nullable).
--   2. FK con ON DELETE CASCADE → al borrar el iCal source se borran sus
--      reservas. Reservas creadas manualmente (`source != 'airbnb'`) no se ven
--      afectadas porque su `ical_source_id` siempre es NULL.
--   3. Índice por `ical_source_id` para hacer el cascade y los selects rápidos.
--   4. Backfill best-effort: emparejar reservas Airbnb con el único iCal
--      source vivo de su propiedad (cuando hay solo uno). Si hay 0 ó >1 iCal
--      sources para esa propiedad, se deja NULL — esas reservas se consideran
--      "huérfanas" (legacy) y deberán gestionarse manualmente.

begin;

alter table public.reservations
  add column if not exists ical_source_id uuid;

do $$
begin
  if not exists (
    select 1
      from information_schema.table_constraints
     where table_schema = 'public'
       and table_name = 'reservations'
       and constraint_name = 'reservations_ical_source_id_fkey'
  ) then
    alter table public.reservations
      add constraint reservations_ical_source_id_fkey
      foreign key (ical_source_id)
      references public.ical_sources(id)
      on delete cascade;
  end if;
end$$;

create index if not exists idx_reservations_ical_source_id
  on public.reservations(ical_source_id);

-- Backfill: solo cuando hay exactamente UN iCal source por propiedad.
update public.reservations r
   set ical_source_id = sub.source_id
  from (
    select s.property_id, (array_agg(s.id))[1] as source_id
      from public.ical_sources s
     group by s.property_id
    having count(*) = 1
  ) sub
 where r.property_id = sub.property_id
   and r.source = 'airbnb'
   and r.ical_source_id is null;

commit;
