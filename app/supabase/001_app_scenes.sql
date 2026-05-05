-- First persistence slice for editor scenes
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.app_scenes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null,
  name text not null default 'Untitled Scene',
  schema_version integer not null default 1,
  scene_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_scenes_updated_at_idx on public.app_scenes (updated_at desc);
create index if not exists app_scenes_workspace_updated_at_idx on public.app_scenes (workspace_id, updated_at desc);

create or replace function public.set_app_scenes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_scenes_updated_at on public.app_scenes;
create trigger trg_app_scenes_updated_at
before update on public.app_scenes
for each row
execute function public.set_app_scenes_updated_at();

alter table public.app_scenes enable row level security;

-- Demo-friendly policies for initial evaluation slice.
drop policy if exists app_scenes_select_authenticated on public.app_scenes;
create policy app_scenes_select_authenticated
on public.app_scenes
for select
to authenticated
using (true);

drop policy if exists app_scenes_insert_authenticated on public.app_scenes;
create policy app_scenes_insert_authenticated
on public.app_scenes
for insert
to authenticated
with check (true);

drop policy if exists app_scenes_update_authenticated on public.app_scenes;
create policy app_scenes_update_authenticated
on public.app_scenes
for update
to authenticated
using (true)
with check (true);
