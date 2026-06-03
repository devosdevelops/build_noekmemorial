-- Workspace collaborators and role-based access support.
-- Run this after 003_app_workspaces.sql.

create table if not exists public.collaborators (
  workspace_id uuid not null references public.app_workspaces(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null default 'collaborator' check (role = 'collaborator'),
  added_by uuid null references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists collaborators_user_id_idx on public.collaborators (user_id);
create index if not exists collaborators_workspace_role_idx on public.collaborators (workspace_id, role);

alter table public.collaborators enable row level security;

drop policy if exists collaborators_select_authenticated on public.collaborators;
create policy collaborators_select_authenticated
on public.collaborators
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_consultant(auth.uid())
  or exists (
    select 1
    from public.app_workspaces w
    where w.id = collaborators.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists collaborators_insert_authenticated on public.collaborators;
create policy collaborators_insert_authenticated
on public.collaborators
for insert
to authenticated
with check (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = collaborators.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists collaborators_update_authenticated on public.collaborators;
create policy collaborators_update_authenticated
on public.collaborators
for update
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = collaborators.workspace_id
      and w.owner_id = auth.uid()
  )
)
with check (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = collaborators.workspace_id
      and w.owner_id = auth.uid()
  )
);

drop policy if exists collaborators_delete_authenticated on public.collaborators;
create policy collaborators_delete_authenticated
on public.collaborators
for delete
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  exists (
    select 1
    from public.app_workspaces w
    where w.id = collaborators.workspace_id
      and w.owner_id = auth.uid()
  )
);

-- Expand workspace read access to collaborators.
drop policy if exists app_workspaces_select_authenticated on public.app_workspaces;
create policy app_workspaces_select_authenticated
on public.app_workspaces
for select
to authenticated
using (
  public.is_consultant(auth.uid())
  or
  owner_id = auth.uid()
  or exists (
    select 1
    from public.collaborators c
    where c.workspace_id = app_workspaces.id
      and c.user_id = auth.uid()
  )
);