export function getBearerToken(event) {
  const header = getHeader(event, 'authorization')
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return ''
  }

  return header.slice(7).trim()
}

export async function requireAuthenticatedAppUser(event, supabase) {
  const token = getBearerToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie is ongeldig. Log opnieuw in.'
    })
  }

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token)
  if (authUserError || !authUserData?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie kon niet worden geverifieerd.'
    })
  }

  const actorId = authUserData.user.id
  const { data: actor, error: actorError } = await supabase
    .from('app_users')
    .select('id, user_type')
    .eq('id', actorId)
    .single()

  if (actorError || !actor) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je profiel kon niet worden gevonden.'
    })
  }

  return {
    token,
    actorId,
    actor
  }
}

export async function requireWorkspaceAccess({ supabase, workspaceId, actorId, actorUserType }) {
  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from('app_workspaces')
    .select('id, owner_id, name, slug')
    .eq('id', workspaceId)
    .single()

  if (workspaceError || !workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Werkruimte niet gevonden.'
    })
  }

  const isOwner = workspace.owner_id === actorId
  const isConsultant = actorUserType === 'consultant'

  if (isOwner || isConsultant) {
    return workspace
  }

  const { data: collaboratorRow, error: collaboratorError } = await supabase
    .from('collaborators')
    .select('workspace_id, user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', actorId)
    .maybeSingle()

  if (collaboratorError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kon samenwerkersrechten niet controleren.',
      data: {
        supabaseError: collaboratorError.message
      }
    })
  }

  if (!collaboratorRow) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je hebt geen toegang tot deze werkruimte.'
    })
  }

  return workspace
}
