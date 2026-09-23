-- RF-004: simulated academic purchases for Yokai Tales.
-- Apply in the Supabase SQL Editor. This schema never accepts card data.

create extension if not exists pgcrypto;

create table if not exists public.simulated_payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    edition text not null check (edition in ('standard', 'plus')),
    amount_brl numeric(10, 2) not null check (amount_brl in (20.00, 40.00)),
    status text not null check (status = 'simulated_approved'),
    created_at timestamptz not null default now()
);

create index if not exists simulated_payments_user_created_idx
    on public.simulated_payments (user_id, created_at desc);

create or replace function public.set_simulated_payment_values()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'Authentication is required to create an order';
    end if;

    new.user_id := auth.uid();
    new.amount_brl := case new.edition
        when 'standard' then 20.00
        when 'plus' then 40.00
        else null
    end;
    new.status := 'simulated_approved';
    new.created_at := now();
    return new;
end;
$$;

drop trigger if exists set_simulated_payment_values_before_insert
    on public.simulated_payments;
create trigger set_simulated_payment_values_before_insert
    before insert on public.simulated_payments
    for each row execute function public.set_simulated_payment_values();

alter table public.simulated_payments enable row level security;

drop policy if exists "Users can read their own simulated orders"
    on public.simulated_payments;
create policy "Users can read their own simulated orders"
    on public.simulated_payments
    for select to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own simulated orders"
    on public.simulated_payments;
create policy "Users can create their own simulated orders"
    on public.simulated_payments
    for insert to authenticated
    with check (user_id = (select auth.uid()));

revoke all on table public.simulated_payments from anon, authenticated;
grant select, insert on table public.simulated_payments to authenticated;

revoke all on function public.set_simulated_payment_values() from public, anon, authenticated;

create table if not exists public.game_downloads (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    payment_id uuid not null references public.simulated_payments (id) on delete cascade,
    release_version text not null default '1.0',
    requested_at timestamptz not null default now()
);

create index if not exists game_downloads_user_requested_idx
    on public.game_downloads (user_id, requested_at desc);

create or replace function public.set_game_download_owner()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'Authentication is required to request a download';
    end if;
    if not exists (
        select 1 from public.simulated_payments
        where id = new.payment_id
          and user_id = auth.uid()
          and status = 'simulated_approved'
    ) then
        raise exception 'An approved order belonging to the current user is required';
    end if;
    new.user_id := auth.uid();
    new.requested_at := now();
    return new;
end;
$$;

drop trigger if exists set_game_download_owner_before_insert on public.game_downloads;
create trigger set_game_download_owner_before_insert
    before insert on public.game_downloads
    for each row execute function public.set_game_download_owner();

alter table public.game_downloads enable row level security;

drop policy if exists "Users can read their own download requests" on public.game_downloads;
create policy "Users can read their own download requests"
    on public.game_downloads
    for select to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own download requests" on public.game_downloads;
create policy "Users can create their own download requests"
    on public.game_downloads
    for insert to authenticated
    with check (user_id = (select auth.uid()));

revoke all on table public.game_downloads from anon, authenticated;
grant select, insert on table public.game_downloads to authenticated;

revoke all on function public.set_game_download_owner() from public, anon, authenticated;

-- Lock down tables used by the former client-side login/card flow. This does
-- not delete historical rows. No app role gets browser access after this step.
do $$
declare
    legacy_table text;
begin
    foreach legacy_table in array array['Usuario', 'Cartao', 'Administrador'] loop
        if to_regclass(format('public.%I', legacy_table)) is not null then
            execute format('alter table public.%I enable row level security', legacy_table);
            execute format(
                'revoke all on table public.%I from public, anon, authenticated',
                legacy_table
            );
        end if;
    end loop;
end;
$$;
