-- Add workspace publish timestamp for editor publish flow.
-- Apply on existing databases after 011_workspace_offline_and_pin_policy.sql.

alter table public.app_workspaces
add column if not exists published_at timestamptz null;

-- Backfill already published rooms so dashboards/viewers can rely on this field.
update public.app_workspaces
set published_at = coalesce(published_at, updated_at, created_at, now())
where visibility in ('public', 'private')
  and published_at is null;
