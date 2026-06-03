import { createSupabaseServerClient } from '../../../../utils/supabaseServerClient.js'

function getBearerToken(event) {
  const header = getHeader(event, 'authorization')
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return ''
  }

  return header.slice(7).trim()
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')
  const collaboratorUserId = getRouterParam(event, 'userId')

  if (!workspaceId || !workspaceId.length || !collaboratorUserId || !collaboratorUserId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID en collaborator-ID zijn verplicht.'
    })
  }

  const token = getBearerToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie is ongeldig. Log opnieuw in.'
    })
  }

  const supabase = createSupabaseServerClient()

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token)
  if (authUserError || !authUserData?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie kon niet worden geverifieerd.'
    })
  }

  const actorId = authUserData.user.id

  const [actorResult, workspaceResult] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, user_type')
      .eq('id', actorId)
      .single(),
    supabase
      .from('app_workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .single()
  ])

  if (actorResult.error || !actorResult.data) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je profiel kon niet worden gevonden.'
    })
  }

  if (workspaceResult.error || !workspaceResult.data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Werkruimte niet gevonden.'
    })
  }

  const workspace = workspaceResult.data
  const mayManageCollaborators = workspace.owner_id === actorId || actorResult.data.user_type === 'consultant'

  if (!mayManageCollaborators) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je hebt geen rechten om samenwerkers te beheren voor deze ruimte.'
    })
  }

  if (collaboratorUserId === workspace.owner_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'De eigenaar kan niet als collaborator worden verwijderd.'
    })
  }

  const { data: existingRow, error: existingError } = await supabase
    .from('collaborators')
    .select('workspace_id, user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', collaboratorUserId)
    .maybeSingle()

  if (existingError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kon collaborator niet ophalen.',
      data: {
        supabaseError: existingError.message
      }
    })
  }

  if (!existingRow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Collaborator niet gevonden in deze ruimte.'
    })
  }

  const { error: deleteError } = await supabase
    .from('collaborators')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', collaboratorUserId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Verwijderen van collaborator is mislukt.',
      data: {
        supabaseError: deleteError.message
      }
    })
  }

  return {
    ok: true,
    removedUserId: collaboratorUserId
  }
})
