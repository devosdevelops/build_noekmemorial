import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser, requireWorkspaceAccess } from '../../utils/workspaceAccess.js'

const SCENES_TABLE = 'app_scenes'

export default defineEventHandler(async (event) => {
  const sceneId = getRouterParam(event, 'id')

  if (!sceneId || !sceneId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Scène-ID is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)

  const { data, error } = await supabase
    .from(SCENES_TABLE)
    .select('id, workspace_id, name, schema_version, scene_data, created_at, updated_at')
    .eq('id', sceneId)
    .single()

  if (error) {
    throw createError({
      statusCode: 404,
      statusMessage: `Scène niet gevonden (${sceneId}).`,
      data: {
        supabaseError: error.message
      }
    })
  }

  if (!data.workspace_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Deze scène is niet gekoppeld aan een werkruimte.'
    })
  }

  await requireWorkspaceAccess({
    supabase,
    workspaceId: data.workspace_id,
    actorId,
    actorUserType: actor.user_type
  })

  return {
    ok: true,
    scene: data
  }
})
