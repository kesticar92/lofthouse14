-- Filas de propiedad para los 14 lofts (el 4 es bodega) + listado "casa completa" en Airbnb.
-- Idempotente: solo inserta nombres que aún no existen.

insert into public.properties (name)
select v
from (
  values
    ('Loft 1'),
    ('Loft 2'),
    ('Loft 3'),
    ('Loft 4 — Bodega'),
    ('Loft 5'),
    ('Loft 6'),
    ('Loft 7'),
    ('Loft 8'),
    ('Loft 9'),
    ('Loft 10'),
    ('Loft 11'),
    ('Loft 12'),
    ('Loft 13'),
    ('Loft 14'),
    ('Casa completa (Airbnb — grupo / listing entero)')
) as t(v)
where not exists (
  select 1 from public.properties p where p.name = t.v
);
