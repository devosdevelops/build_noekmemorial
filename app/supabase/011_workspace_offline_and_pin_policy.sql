-- Add offline visibility state and normalize access PIN behavior.
-- Apply on existing databases after prior dashboard patches.

alter table public.app_workspaces
alter column visibility set default 'offline';

alter table public.app_workspaces
drop constraint if exists app_workspaces_visibility_check;

alter table public.app_workspaces
add constraint app_workspaces_visibility_check
check (visibility in ('offline', 'public', 'private'));

-- Existing rows with null/invalid visibility become offline drafts.
update public.app_workspaces
set visibility = 'offline'
where visibility is null
   or visibility not in ('offline', 'public', 'private');

-- Access pins are only meaningful for private rooms.
update public.app_workspaces
set access_pin = null
where visibility <> 'private';
