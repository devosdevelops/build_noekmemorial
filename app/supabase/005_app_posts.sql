-- Workspace posts/content for memorial pages.
-- Run this after 004_collaborators.sql.

create extension if not exists pgcrypto;

create table if not exists public.app_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.app_workspaces(id) on delete cascade,
  author_id uuid null references public.app_users(id) on delete set null,
  scene_id uuid null references public.app_scenes(id) on delete set null,
  content_type text not null default 'post' check (content_type in ('post', 'image', 'video', 'audio')),
  slug text not null,
  title text not null,
  excerpt text null,
  content jsonb not null default '{}'::jsonb,
  media_url text null,
  media_storage_path text null,
  media_mime_type text null,
  media_duration_seconds integer null check (media_duration_seconds is null or media_duration_seconds >= 0),
  thumbnail_url text null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug),
  check (
    (content_type = 'post')
    or (content_type in ('image', 'video', 'audio') and media_url is not null)
  )
);

create index if not exists app_posts_workspace_status_idx on public.app_posts (workspace_id, status);
create index if not exists app_posts_workspace_updated_at_idx on public.app_posts (workspace_id, updated_at desc);
create index if not exists app_posts_published_at_idx on public.app_posts (published_at desc);
create index if not exists app_posts_workspace_content_type_idx on public.app_posts (workspace_id, content_type);

create or replace function public.set_app_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_posts_updated_at on public.app_posts;
create trigger trg_app_posts_updated_at
before update on public.app_posts
for each row
execute function public.set_app_posts_updated_at();

alter table public.app_posts enable row level security;

-- Public can read published posts only.
drop policy if exists app_posts_select_anon_published on public.app_posts;
create policy app_posts_select_anon_published
on public.app_posts
for select
to anon
using (status = 'published');

drop policy if exists app_posts_select_authenticated on public.app_posts;
create policy app_posts_select_authenticated
on public.app_posts
for select
to authenticated
using (
  status = 'published'
  or public.is_consultant(auth.uid())
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = app_posts.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_posts.workspace_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists app_posts_insert_authenticated on public.app_posts;
create policy app_posts_insert_authenticated
on public.app_posts
for insert
to authenticated
with check (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = app_posts.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_posts.workspace_id
      and c.user_id = auth.uid()
      and c.role = 'collaborator'
  )
);

drop policy if exists app_posts_update_authenticated on public.app_posts;
create policy app_posts_update_authenticated
on public.app_posts
for update
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = app_posts.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_posts.workspace_id
      and c.user_id = auth.uid()
      and c.role = 'collaborator'
  )
)
with check (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = app_posts.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_posts.workspace_id
      and c.user_id = auth.uid()
      and c.role = 'collaborator'
  )
);

drop policy if exists app_posts_delete_authenticated on public.app_posts;
create policy app_posts_delete_authenticated
on public.app_posts
for delete
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = app_posts.workspace_id
      and w.owner_id = auth.uid()
  )
);