import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser, requireWorkspaceAccess } from '../../utils/workspaceAccess.js'

function formatName(firstName, lastName, fallback) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || fallback || 'Onbekend'
}

function parseVisibility(value) {
  if (value === 'private') return 'private'
  if (value === 'public') return 'public'
  return 'offline'
}

function generateAccessPin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizeAccessPin(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\D/g, '').slice(0, 6)
}

function mapWorkspaceResponse(workspace, owner, collaborators = []) {
  const deceasedName = formatName(workspace.deceased_first_name, workspace.deceased_last_name, workspace.name)
  const ownerName = formatName(owner?.first_name, owner?.last_name, owner?.email)

  return {
    ok: true,
    workspace,
    owner,
    collaborators,
    room: {
      id: workspace.id,
      title: workspace.name || `In liefdevolle herinnering aan ${deceasedName}`,
      deceasedName,
      ownerName,
      slug: workspace.slug,
      visibility: workspace.visibility,
      approvalMode: workspace.approval_mode,
      accessPin: workspace.access_pin,
      updatedAt: workspace.updated_at
    }
  }
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const deceasedFirstName = typeof body?.deceasedFirstName === 'string' ? body.deceasedFirstName.trim() : ''
  const deceasedLastName = typeof body?.deceasedLastName === 'string' ? body.deceasedLastName.trim() : ''
  const visibility = parseVisibility(body?.visibility)
  const approvalMode = body?.approvalMode === 'automatic' ? 'automatic' : 'manual'
  const requestedAccessPin = normalizeAccessPin(body?.accessPin)

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruimte-naam is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)
  const targetWorkspace = await requireWorkspaceAccess({
    supabase,
    workspaceId,
    actorId,
    actorUserType: actor.user_type
  })

  const mayUpdateWorkspaceSettings = targetWorkspace.owner_id === actorId || actor.user_type === 'consultant'
  if (!mayUpdateWorkspaceSettings) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je hebt geen rechten om werkruimte-instellingen bij te werken.'
    })
  }

  if (targetWorkspace.visibility === 'offline' && visibility !== 'offline') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Publiceer de ruimte eerst vanuit de editor om zichtbaarheid te wijzigen.'
    })
  }

  let nextAccessPin = null
  if (visibility === 'private') {
    if (requestedAccessPin.length && !/^\d{6}$/.test(requestedAccessPin)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PIN moet exact 6 cijfers bevatten.'
      })
    }

    nextAccessPin = requestedAccessPin || targetWorkspace.access_pin || generateAccessPin()
  }

  const { data: updatedWorkspace, error: updateError } = await supabase
    .from('app_workspaces')
    .update({
      name,
      deceased_first_name: deceasedFirstName || null,
      deceased_last_name: deceasedLastName || null,
      visibility,
      approval_mode: approvalMode,
      access_pin: nextAccessPin
    })
    .eq('id', workspaceId)
    .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, access_pin, created_at, updated_at')
    .single()

  if (updateError || !updatedWorkspace) {
    throw createError({
      statusCode: 500,
      statusMessage: `Opslaan van werkruimte (${workspaceId}) is mislukt.`,
      data: {
        supabaseError: updateError?.message
      }
    })
  }

  const [ownerResult, collaboratorsResult] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, email, first_name, last_name')
      .eq('id', updatedWorkspace.owner_id)
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

  const collaboratorsWithProfiles = collaborators.map((row) => {
    const collaboratorUser = collaboratorUsers.find((user) => user.id === row.user_id)
    const collaboratorName = formatName(collaboratorUser?.first_name, collaboratorUser?.last_name, collaboratorUser?.email)
    const initials = collaboratorName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || collaboratorName.slice(0, 2).toUpperCase()

    return {
      id: row.user_id,
      initials,
      name: collaboratorName,
      email: collaboratorUser?.email ?? null,
      role: row.role,
      addedAt: row.created_at
    }
  })

  return mapWorkspaceResponse(updatedWorkspace, owner, collaboratorsWithProfiles)
})