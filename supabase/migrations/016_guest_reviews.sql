-- Reseñas públicas (Google, Booking, Airbnb) sincronizadas desde scrapers diarios.

create table if not exists public.guest_reviews (
  id text primary key,
  source text not null check (source in ('google', 'airbnb', 'booking')),
  name text not null,
  body text not null,
  image text not null default '/default-avatar.png',
  star_rating numeric not null default 0,
  booking_score numeric,
  review_date date,
  listing_url text,
  listing_label text,
  loft_code text,
  booking_positive text,
  booking_negative text,
  synced_at timestamptz not null default now()
);

create index if not exists guest_reviews_source_idx on public.guest_reviews (source);
create index if not exists guest_reviews_review_date_idx on public.guest_reviews (review_date desc nulls last);

alter table public.guest_reviews enable row level security;

create policy "guest_reviews_public_read"
  on public.guest_reviews
  for select
  to anon, authenticated
  using (true);

comment on table public.guest_reviews is
  'Reseñas de plataformas externas; escritura solo vía service role (sync post-scrape).';
