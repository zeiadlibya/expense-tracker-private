create extension if not exists "pgcrypto";

create table if not exists public.account_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_key text not null default 'avatar_1',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.account_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.incomes enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_transfers enable row level security;
alter table public.transaction_wallet_splits enable row level security;

alter table public.wallet_balances add column if not exists profile_id uuid;
alter table public.incomes add column if not exists profile_id uuid;
alter table public.transactions add column if not exists profile_id uuid;
alter table public.wallet_transfers add column if not exists profile_id uuid;
alter table public.transaction_wallet_splits add column if not exists profile_id uuid;
alter table public.user_settings add column if not exists profile_id uuid;

insert into public.account_profiles (user_id, name, avatar_key, is_default)
select u.id, 'الرئيسي', 'avatar_1', true
from auth.users u
where not exists (
  select 1 from public.account_profiles p where p.user_id = u.id
);

update public.wallet_balances wb
set profile_id = p.id
from public.account_profiles p
where wb.profile_id is null
  and wb.user_id = p.user_id
  and p.is_default = true;

update public.incomes i
set profile_id = p.id
from public.account_profiles p
where i.profile_id is null
  and i.user_id = p.user_id
  and p.is_default = true;

update public.transactions t
set profile_id = p.id
from public.account_profiles p
where t.profile_id is null
  and t.user_id = p.user_id
  and p.is_default = true;

update public.wallet_transfers wt
set profile_id = p.id
from public.account_profiles p
where wt.profile_id is null
  and wt.user_id = p.user_id
  and p.is_default = true;

update public.transaction_wallet_splits tws
set profile_id = p.id
from public.account_profiles p
where tws.profile_id is null
  and tws.user_id = p.user_id
  and p.is_default = true;

update public.user_settings us
set profile_id = p.id
from public.account_profiles p
where us.profile_id is null
  and us.user_id = p.user_id
  and p.is_default = true;

do $$
declare
  constraint_name text;
  table_name text;
begin
  for table_name, constraint_name in
    select t.relname, c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname in ('wallet_balances', 'user_settings')
      and c.contype = 'u'
      and array_length(c.conkey, 1) = 1
      and c.conkey[1] = (
        select a.attnum
        from pg_attribute a
        where a.attrelid = t.oid
          and a.attname = 'user_id'
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', table_name, constraint_name);
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wallet_balances_user_profile_unique') then
    alter table public.wallet_balances
      add constraint wallet_balances_user_profile_unique unique (user_id, profile_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_settings_user_profile_unique') then
    alter table public.user_settings
      add constraint user_settings_user_profile_unique unique (user_id, profile_id);
  end if;
end $$;

create unique index if not exists account_profiles_user_default_unique
on public.account_profiles (user_id)
where is_default = true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wallet_balances_profile_fk') then
    alter table public.wallet_balances
      add constraint wallet_balances_profile_fk
      foreign key (profile_id) references public.account_profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incomes_profile_fk') then
    alter table public.incomes
      add constraint incomes_profile_fk
      foreign key (profile_id) references public.account_profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_profile_fk') then
    alter table public.transactions
      add constraint transactions_profile_fk
      foreign key (profile_id) references public.account_profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wallet_transfers_profile_fk') then
    alter table public.wallet_transfers
      add constraint wallet_transfers_profile_fk
      foreign key (profile_id) references public.account_profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transaction_wallet_splits_profile_fk') then
    alter table public.transaction_wallet_splits
      add constraint transaction_wallet_splits_profile_fk
      foreign key (profile_id) references public.account_profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_settings_profile_fk') then
    alter table public.user_settings
      add constraint user_settings_profile_fk
      foreign key (profile_id) references public.account_profiles(id) on delete cascade;
  end if;
end $$;

alter table public.wallet_balances alter column profile_id set not null;
alter table public.incomes alter column profile_id set not null;
alter table public.transactions alter column profile_id set not null;
alter table public.wallet_transfers alter column profile_id set not null;
alter table public.transaction_wallet_splits alter column profile_id set not null;
alter table public.user_settings alter column profile_id set not null;

create or replace function public.limit_account_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.account_profiles
    where user_id = new.user_id
  ) >= 3 then
    raise exception 'profile_limit_reached';
  end if;

  return new;
end;
$$;

drop trigger if exists limit_account_profiles_before_insert on public.account_profiles;
create trigger limit_account_profiles_before_insert
before insert on public.account_profiles
for each row execute function public.limit_account_profiles();

create or replace function public.create_default_account_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
begin
  insert into public.account_profiles (user_id, name, avatar_key, is_default)
  values (new.id, 'الرئيسي', 'avatar_1', true)
  returning id into new_profile_id;

  insert into public.wallet_balances (
    user_id, profile_id, expenses_balance, savings_balance, emergency_balance, total_income, total_spent
  )
  values (new.id, new_profile_id, 0, 0, 0, 0, 0)
  on conflict (user_id, profile_id) do nothing;

  insert into public.user_settings (
    user_id, profile_id, currency, theme, color_theme,
    expenses_percentage, savings_percentage, emergency_percentage
  )
  values (new.id, new_profile_id, 'LYD', 'light', 'classic', 50, 30, 20)
  on conflict (user_id, profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_default_account_profile_after_signup on auth.users;
create trigger create_default_account_profile_after_signup
after insert on auth.users
for each row execute function public.create_default_account_profile_for_new_user();

grant select, insert, update, delete on public.account_profiles to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.wallet_balances to authenticated;
grant select, insert, update, delete on public.incomes to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.wallet_transfers to authenticated;
grant select, insert, update, delete on public.transaction_wallet_splits to authenticated;

drop policy if exists "Users can read own account profiles" on public.account_profiles;
drop policy if exists "Users can insert own account profiles" on public.account_profiles;
drop policy if exists "Users can update own account profiles" on public.account_profiles;
drop policy if exists "Users can delete own account profiles" on public.account_profiles;

create policy "Users can read own account profiles"
on public.account_profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own account profiles"
on public.account_profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own account profiles"
on public.account_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own account profiles"
on public.account_profiles for delete
to authenticated
using (auth.uid() = user_id and is_default = false);

drop policy if exists "Users can read own settings" on public.user_settings;
drop policy if exists "Users can insert own settings" on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;
drop policy if exists "Users can read own wallet" on public.wallet_balances;
drop policy if exists "Users can insert own wallet" on public.wallet_balances;
drop policy if exists "Users can update own wallet" on public.wallet_balances;
drop policy if exists "Users can read own incomes" on public.incomes;
drop policy if exists "Users can insert own incomes" on public.incomes;
drop policy if exists "Users can update own incomes" on public.incomes;
drop policy if exists "Users can delete own incomes" on public.incomes;
drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;
drop policy if exists "Users can read own wallet transfers" on public.wallet_transfers;
drop policy if exists "Users can insert own wallet transfers" on public.wallet_transfers;
drop policy if exists "Users can update own wallet transfers" on public.wallet_transfers;
drop policy if exists "Users can delete own wallet transfers" on public.wallet_transfers;
drop policy if exists "Users can read own transaction wallet splits" on public.transaction_wallet_splits;
drop policy if exists "Users can insert own transaction wallet splits" on public.transaction_wallet_splits;
drop policy if exists "Users can update own transaction wallet splits" on public.transaction_wallet_splits;
drop policy if exists "Users can delete own transaction wallet splits" on public.transaction_wallet_splits;

create policy "Users can read own settings" on public.user_settings for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can insert own settings" on public.user_settings for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can update own settings" on public.user_settings for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Users can read own wallet" on public.wallet_balances for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can insert own wallet" on public.wallet_balances for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can update own wallet" on public.wallet_balances for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Users can read own incomes" on public.incomes for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can insert own incomes" on public.incomes for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can update own incomes" on public.incomes for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can delete own incomes" on public.incomes for delete to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Users can read own transactions" on public.transactions for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can insert own transactions" on public.transactions for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can update own transactions" on public.transactions for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can delete own transactions" on public.transactions for delete to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Users can read own wallet transfers" on public.wallet_transfers for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can insert own wallet transfers" on public.wallet_transfers for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can update own wallet transfers" on public.wallet_transfers for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can delete own wallet transfers" on public.wallet_transfers for delete to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));

create policy "Users can read own transaction wallet splits" on public.transaction_wallet_splits for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can insert own transaction wallet splits" on public.transaction_wallet_splits for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can update own transaction wallet splits" on public.transaction_wallet_splits for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users can delete own transaction wallet splits" on public.transaction_wallet_splits for delete to authenticated
using (auth.uid() = user_id and exists (select 1 from public.account_profiles p where p.id = profile_id and p.user_id = auth.uid()));
