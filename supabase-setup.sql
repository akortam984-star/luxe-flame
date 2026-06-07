-- ============================================================
-- Luxe Flame — Supabase Setup
-- Run this entire file in Supabase → SQL Editor → New query
-- ============================================================

-- ─── Products ───────────────────────────────────────────────
create table if not exists public.products (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  description text,
  price       numeric(10,2) not null default 0,
  image_url   text,
  in_stock    boolean     default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Orders ─────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid          default gen_random_uuid() primary key,
  customer_name    text          not null,
  customer_email   text          not null,
  customer_phone   text,
  customer_address text,
  items            jsonb         not null default '[]',
  total            numeric(10,2) not null default 0,
  status           text          default 'pending'
                   check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  notes            text,
  created_at       timestamptz   default now()
);

-- ─── auto-update updated_at ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Products: public read
create policy "Public can read products" on public.products
  for select using (true);

-- Products: only authenticated (admin) can write
create policy "Admin can insert products" on public.products
  for insert to authenticated with check (true);

create policy "Admin can update products" on public.products
  for update to authenticated using (true);

create policy "Admin can delete products" on public.products
  for delete to authenticated using (true);

-- Orders: anyone can place an order
create policy "Anyone can place order" on public.orders
  for insert with check (true);

-- Orders: only admin can read/update
create policy "Admin can view orders" on public.orders
  for select to authenticated using (true);

create policy "Admin can update order status" on public.orders
  for update to authenticated using (true);

-- ─── Storage bucket for product images ───────────────────────
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Public can read product images" on storage.objects
  for select using (bucket_id = 'products');

create policy "Admin can upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

create policy "Admin can update product images" on storage.objects
  for update to authenticated using (bucket_id = 'products');

create policy "Admin can delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'products');

-- ─── Done ────────────────────────────────────────────────────
-- Next step: go to Supabase → Authentication → Users → Add user
-- to create your admin account, then use those credentials in admin.html
