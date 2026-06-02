import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'

const SCENES_TABLE = 'app_scenes'

export default defineEventHandler(async (event) => {
  const workspaceId = getQuery(event)?.workspaceId

  const supabase = createSupabaseServerClient()
  let query = supabase
    .from(SCENES_TABLE)
    .select('id, workspace_id, name, schema_version, scene_data, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (typeof workspaceId === 'string' && workspaceId.length) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Laden van de nieuwste scène uit ${SCENES_TABLE} is mislukt.`,
      data: {
        supabaseError: error.message
      }
    })
  }

  const latest = Array.isArray(data) ? data[0] : null

  if (!latest) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Er zijn nog geen scènes gevonden in Supabase.'
    })
  }

  return {
    ok: true,
    scene: latest
  }
})
