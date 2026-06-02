import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'

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

  return {
    ok: true,
    scene: data
  }
})
