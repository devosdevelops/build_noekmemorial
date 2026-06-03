import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser } from '../../utils/workspaceAccess.js'

const TEMPLATES_TABLE = 'app_scene_templates'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const templateId = Number.parseInt(idParam || '', 10)

  if (!Number.isInteger(templateId) || templateId < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Template-ID is ongeldig.'
    })
  }

  const supabase = createSupabaseServerClient()
  await requireAuthenticatedAppUser(event, supabase)

  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('id, template_key, name, description, schema_version, scene_data, thumbnail_url, sort_order, is_active, updated_at')
    .eq('id', templateId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Template ophalen is mislukt.',
      data: {
        supabaseError: error.message
      }
    })
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template niet gevonden.'
    })
  }

  return {
    ok: true,
    template: data
  }
})