-- Fix RLS recursion between app_workspaces and collaborators policies.
-- Apply this on existing environments where app_workspaces select returns
-- "infinite recursion detected in policy for relation app_workspaces".

create or replace function public.is_workspace_owner(target_workspace_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_workspaces
    where id = target_workspace_id
      and owner_id = target_user_id
  );
$$;

grant execute on function public.is_workspace_owner(uuid, uuid) to authenticated;

create or replace function public.is_workspace_collaborator(target_workspace_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collaborators
    where workspace_id = target_workspace_id
      and user_id = target_user_id
  );
$$;

grant execute on function public.is_workspace_collaborator(uuid, uuid) to authenticated;

-- app_workspaces access: use helper function (no direct collaborators subquery in policy).
drop policy if exists app_workspaces_select_authenticated on public.app_workspaces;
create policy app_workspaces_select_authenticated
on public.app_workspaces
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_consultant(auth.uid())
  or public.is_workspace_collaborator(app_workspaces.id, auth.uid())
);

-- collaborators policies: use helper function (no direct app_workspaces subquery in policy).
drop policy if exists collaborators_select_authenticated on public.collaborators;
create policy collaborators_select_authenticated
on public.collaborators
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_consultant(auth.uid())
  or public.is_workspace_owner(collaborators.workspace_id, auth.uid())
);

drop policy if exists collaborators_insert_authenticated on public.collaborators;
create policy collaborators_insert_authenticated
on public.collaborators
for insert
to authenticated
with check (
  public.is_consultant(auth.uid())
  or public.is_workspace_owner(collaborators.workspace_id, auth.uid())
);

drop policy if exists collaborators_update_authenticated on public.collaborators;
create policy collaborators_update_authenticated
on public.collaborators
for update
to authenticated
using (
  public.is_consultant(auth.uid())
  or public.is_workspace_owner(collaborators.workspace_id, auth.uid())
)
with check (
  public.is_consultant(auth.uid())
  or public.is_workspace_owner(collaborators.workspace_id, auth.uid())
);

drop policy if exists collaborators_delete_authenticated on public.collaborators;
create policy collaborators_delete_authenticated
on public.collaborators
for delete
to authenticated
using (
  public.is_consultant(auth.uid())
  or public.is_workspace_owner(collaborators.workspace_id, auth.uid())
);
