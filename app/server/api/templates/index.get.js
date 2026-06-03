import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser } from '../../utils/workspaceAccess.js'

const TEMPLATES_TABLE = 'app_scene_templates'

export default defineEventHandler(async (event) => {
  const supabase = createSupabaseServerClient()
  await requireAuthenticatedAppUser(event, supabase)

  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('id, template_key, name, description, schema_version, thumbnail_url, sort_order, is_active, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Template-lijst ophalen is mislukt.',
      data: {
        supabaseError: error.message
      }
    })
  }

  return {
    ok: true,
    templates: Array.isArray(data) ? data : []
  }
})