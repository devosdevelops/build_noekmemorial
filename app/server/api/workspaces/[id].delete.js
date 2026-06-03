import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser, requireWorkspaceAccess } from '../../utils/workspaceAccess.js'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')

  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)
  const workspace = await requireWorkspaceAccess({
    supabase,
    workspaceId,
    actorId,
    actorUserType: actor.user_type
  })

  const mayDeleteWorkspace = workspace.owner_id === actorId || actor.user_type === 'consultant'
  if (!mayDeleteWorkspace) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Alleen de eigenaar kan deze werkruimte verwijderen.'
    })
  }

  const { error: deleteError } = await supabase
    .from('app_workspaces')
    .delete()
    .eq('id', workspaceId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Verwijderen van werkruimte is mislukt.',
      data: {
        supabaseError: deleteError.message
      }
    })
  }

  return {
    ok: true,
    deletedWorkspaceId: workspaceId
  }
})
