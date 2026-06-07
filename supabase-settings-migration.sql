-- ============================================================
-- Luxe Flame — Site Settings Migration (Issue #8)
-- Run in Supabase → SQL Editor → New query
-- ============================================================

create table if not exists public.site_settings (
  key        text        primary key,
  value      text,
  updated_at timestamptz default now()
);

-- RLS
alter table public.site_settings enable row level security;

create policy "Public can read site settings" on public.site_settings
  for select using (true);

create policy "Admin can manage site settings" on public.site_settings
  for all to authenticated using (true) with check (true);

-- auto updated_at
drop trigger if exists trg_settings_updated_at on public.site_settings;
create trigger trg_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Seed default values (safe to re-run — won't overwrite existing)
insert into public.site_settings (key, value) values
  ('instagram_url',  'https://www.instagram.com/luxe_flame/'),
  ('contact_email',  'info@luxe-flame.com'),
  ('contact_phone',  '+20 100 000 0000'),
  ('contact_address','Cairo, Egypt'),
  ('hero_title',     'Light Up Luxury'),
  ('hero_subtitle',  'Premium candles that transform your world'),
  ('hero_image_url', ''),
  ('about_text_1',   'Luxe Flame creates high-end candles designed to transform your environment. Every piece is crafted with premium wax, luxury fragrances, and modern design.'),
  ('about_text_2',   'We believe your surroundings should tell a story. Let ours be written in light.'),
  ('tagline',        'Handcrafted Luxury Candles')
on conflict (key) do nothing;
