import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'

function formatName(firstName, lastName, fallback) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || fallback || 'Onbekend'
}

function mapCollaborator(collaboratorRow, userRow) {
  const displayName = formatName(userRow?.first_name, userRow?.last_name, userRow?.email)
  const initialsSource = displayName || userRow?.email || 'S'

  return {
    id: collaboratorRow.user_id,
    initials: initialsSource
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || initialsSource.slice(0, 2).toUpperCase(),
    name: displayName,
    email: userRow?.email ?? null,
    role: collaboratorRow.role,
    addedAt: collaboratorRow.created_at
  }
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')

  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()

  const { data: workspace, error: workspaceError } = await supabase
    .from('app_workspaces')
    .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, access_pin, created_at, updated_at')
    .eq('id', workspaceId)
    .single()

  if (workspaceError || !workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: `Werkruimte niet gevonden (${workspaceId}).`,
      data: {
        supabaseError: workspaceError?.message
      }
    })
  }

  const [ownerResult, collaboratorsResult] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, email, first_name, last_name')
      .eq('id', workspace.owner_id)
      .maybeSingle(),
    supabase
      .from('collaborators')
      .select('workspace_id, user_id, role, added_by, created_at')
      .eq('workspace_id', workspaceId)
  ])

  const owner = ownerResult.data ?? null
  const collaborators = Array.isArray(collaboratorsResult.data) ? collaboratorsResult.data : []

  const collaboratorUserIds = [...new Set(collaborators.map((row) => row.user_id).filter(Boolean))]
  let collaboratorUsers = []

  if (collaboratorUserIds.length > 0) {
    const { data: userRows } = await supabase
      .from('app_users')
      .select('id, email, first_name, last_name')
      .in('id', collaboratorUserIds)

    collaboratorUsers = Array.isArray(userRows) ? userRows : []
  }

  const collaboratorsWithProfiles = collaborators.map((row) =>
    mapCollaborator(
      row,
      collaboratorUsers.find((user) => user.id === row.user_id)
    )
  )

  return {
    ok: true,
    workspace,
    owner,
    collaborators: collaboratorsWithProfiles
  }
})