-- Workspaces owned by app users.
-- Run this after 002_app_users.sql.

create extension if not exists pgcrypto;

create table if not exists public.app_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.app_users(id) on delete cascade,
  deceased_first_name text null,
  deceased_last_name text null,
  visibility text not null default 'offline' check (visibility in ('offline', 'public', 'private')),
  approval_mode text not null default 'manual' check (approval_mode in ('manual', 'automatic')),
  access_pin text null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_workspaces_owner_id_idx on public.app_workspaces (owner_id);
create index if not exists app_workspaces_updated_at_idx on public.app_workspaces (updated_at desc);

create or replace function public.set_app_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_workspaces_updated_at on public.app_workspaces;
create trigger trg_app_workspaces_updated_at
before update on public.app_workspaces
for each row
execute function public.set_app_workspaces_updated_at();

alter table public.app_workspaces enable row level security;

drop policy if exists app_workspaces_select_authenticated on public.app_workspaces;
create policy app_workspaces_select_authenticated
on public.app_workspaces
for select
to authenticated
using (owner_id = auth.uid() or public.is_consultant(auth.uid()));

drop policy if exists app_workspaces_insert_authenticated on public.app_workspaces;
create policy app_workspaces_insert_authenticated
on public.app_workspaces
for insert
to authenticated
with check (owner_id = auth.uid() or public.is_consultant(auth.uid()));

drop policy if exists app_workspaces_update_authenticated on public.app_workspaces;
create policy app_workspaces_update_authenticated
on public.app_workspaces
for update
to authenticated
using (owner_id = auth.uid() or public.is_consultant(auth.uid()))
with check (owner_id = auth.uid() or public.is_consultant(auth.uid()));

drop policy if exists app_workspaces_delete_authenticated on public.app_workspaces;
create policy app_workspaces_delete_authenticated
on public.app_workspaces
for delete
to authenticated
using (owner_id = auth.uid() or public.is_consultant(auth.uid()));