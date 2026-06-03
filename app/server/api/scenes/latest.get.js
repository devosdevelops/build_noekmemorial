import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser, requireWorkspaceAccess } from '../../utils/workspaceAccess.js'

const SCENES_TABLE = 'app_scenes'

export default defineEventHandler(async (event) => {
  const workspaceId = typeof getQuery(event)?.workspaceId === 'string'
    ? getQuery(event).workspaceId
    : ''

  if (!workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht om een scène te laden.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)
  await requireWorkspaceAccess({
    supabase,
    workspaceId,
    actorId,
    actorUserType: actor.user_type
  })

  let query = supabase
    .from(SCENES_TABLE)
    .select('id, workspace_id, name, schema_version, scene_data, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)

  query = query.eq('workspace_id', workspaceId)

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
