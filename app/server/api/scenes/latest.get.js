import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'

const SCENES_TABLE = 'app_scenes'

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from(SCENES_TABLE)
    .select('id, name, schema_version, scene_data, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load latest scene from ${SCENES_TABLE}.`,
      data: {
        supabaseError: error.message
      }
    })
  }

  const latest = Array.isArray(data) ? data[0] : null

  if (!latest) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No scenes found in Supabase yet.'
    })
  }

  return {
    ok: true,
    scene: latest
  }
})
