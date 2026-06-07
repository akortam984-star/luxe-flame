-- ============================================================
-- Luxe Flame — Stock Count Migration (Issue #4)
-- Run in Supabase → SQL Editor → New query
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- Add stock_count column to products (null = unlimited)
alter table public.products
  add column if not exists stock_count integer default null;

-- Function: decrement stock when an order is placed
-- Runs as SECURITY DEFINER so it bypasses RLS on products
create or replace function public.decrement_stock_on_order()
returns trigger
language plpgsql
security definer
as $$
declare
  item jsonb;
  pid  uuid;
  qty  int;
begin
  for item in select * from jsonb_array_elements(new.items)
  loop
    pid := (item->>'id')::uuid;
    qty := (item->>'qty')::int;

    update public.products
    set
      stock_count = greatest(0, stock_count - qty),
      in_stock    = case when greatest(0, stock_count - qty) = 0 then false else in_stock end
    where id = pid
      and stock_count is not null;
  end loop;
  return new;
end;
$$;

-- Attach trigger to orders table
drop trigger if exists trg_decrement_stock on public.orders;
create trigger trg_decrement_stock
  after insert on public.orders
  for each row execute function public.decrement_stock_on_order();
