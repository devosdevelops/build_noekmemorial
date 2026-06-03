-- Harden scenes table for workspace/owner access.
-- Run this after 004_collaborators.sql.

alter table public.app_scenes
add column if not exists owner_id uuid null references public.app_users(id) on delete set null;

alter table public.app_scenes
alter column owner_id set default auth.uid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_scenes_workspace_id_fkey'
      and conrelid = 'public.app_scenes'::regclass
  ) then
    alter table public.app_scenes
    add constraint app_scenes_workspace_id_fkey
    foreign key (workspace_id)
    references public.app_workspaces(id)
    on delete set null;
  end if;
end;
$$;

create index if not exists app_scenes_owner_id_idx on public.app_scenes (owner_id);

update public.app_scenes s
set owner_id = w.owner_id
from public.app_workspaces w
where s.workspace_id = w.id
  and s.owner_id is null;

-- Remove initial demo-open policies.
drop policy if exists app_scenes_select_authenticated on public.app_scenes;
drop policy if exists app_scenes_insert_authenticated on public.app_scenes;
drop policy if exists app_scenes_update_authenticated on public.app_scenes;
drop policy if exists app_scenes_delete_authenticated on public.app_scenes;

create policy app_scenes_select_authenticated
on public.app_scenes
for select
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  owner_id = auth.uid()
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = app_scenes.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_scenes.workspace_id
      and c.user_id = auth.uid()
  )
);

create policy app_scenes_insert_authenticated
on public.app_scenes
for insert
to authenticated
with check (
  public.is_consultant(auth.uid())
  or
  (
    workspace_id is null
    and owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = app_scenes.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_scenes.workspace_id
      and c.user_id = auth.uid()
      and c.role = 'collaborator'
  )
);

create policy app_scenes_update_authenticated
on public.app_scenes
for update
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  owner_id = auth.uid()
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = app_scenes.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_scenes.workspace_id
      and c.user_id = auth.uid()
      and c.role = 'collaborator'
  )
)
with check (
  public.is_consultant(auth.uid())
  or
  owner_id = auth.uid()
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = app_scenes.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_scenes.workspace_id
      and c.user_id = auth.uid()
      and c.role = 'collaborator'
  )
);

create policy app_scenes_delete_authenticated
on public.app_scenes
for delete
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  owner_id = auth.uid()
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = app_scenes.workspace_id
      and w.owner_id = auth.uid()
  )
);