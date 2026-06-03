-- App users table linked to Supabase auth users.
-- Run this after 001_app_scenes.sql.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  user_type text not null default 'user' check (user_type in ('user', 'collaborator', 'owner', 'consultant')),
  display_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_user_type_idx on public.app_users (user_type);

-- SECURITY DEFINER is required so RLS policies can reliably check consultant status.
create or replace function public.is_consultant(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where id = target_user_id
      and user_type = 'consultant'
  );
$$;

grant execute on function public.is_consultant(uuid) to authenticated;

create or replace function public.set_app_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_app_users_updated_at();

alter table public.app_users enable row level security;

drop policy if exists app_users_select_self on public.app_users;
create policy app_users_select_self
on public.app_users
for select
to authenticated
using (id = auth.uid() or public.is_consultant(auth.uid()));

drop policy if exists app_users_insert_self on public.app_users;
create policy app_users_insert_self
on public.app_users
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists app_users_update_self on public.app_users;
create policy app_users_update_self
on public.app_users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());