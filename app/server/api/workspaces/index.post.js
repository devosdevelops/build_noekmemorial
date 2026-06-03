import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser } from '../../utils/workspaceAccess.js'

function slugifyName(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function createUniqueWorkspaceSlug(supabase, name) {
  const base = slugifyName(name) || 'herdenkingsruimte'

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = attempt === 0
      ? base
      : `${base}-${Math.random().toString(36).slice(2, 6)}`

    const { data, error } = await supabase
      .from('app_workspaces')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Kon geen unieke slug genereren.',
        data: {
          supabaseError: error.message
        }
      })
    }

    if (!data) {
      return candidate
    }
  }

  return `${base}-${Date.now().toString(36)}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const deceasedFirstName = typeof body?.deceasedFirstName === 'string' ? body.deceasedFirstName.trim() : ''
  const deceasedLastName = typeof body?.deceasedLastName === 'string' ? body.deceasedLastName.trim() : ''
  const visibility = 'offline'
  const approvalMode = body?.approvalMode === 'automatic' ? 'automatic' : 'manual'

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Naam van ruimte is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId } = await requireAuthenticatedAppUser(event, supabase)
  const slug = await createUniqueWorkspaceSlug(supabase, name)

  const { data: workspace, error } = await supabase
    .from('app_workspaces')
    .insert({
      name,
      slug,
      owner_id: actorId,
      deceased_first_name: deceasedFirstName || null,
      deceased_last_name: deceasedLastName || null,
      visibility,
      approval_mode: approvalMode,
      access_pin: null
    })
    .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, access_pin, published_at, created_at, updated_at')
    .single()

  if (error || !workspace) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Aanmaken van werkruimte is mislukt.',
      data: {
        supabaseError: error?.message
      }
    })
  }

  return {
    ok: true,
    workspace
  }
})
