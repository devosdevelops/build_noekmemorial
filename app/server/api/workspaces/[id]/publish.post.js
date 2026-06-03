import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser, requireWorkspaceAccess } from '../../../utils/workspaceAccess.js'

function parsePublishVisibility(value) {
  return value === 'private' ? 'private' : value === 'public' ? 'public' : null
}

function generateAccessPin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const requestedVisibility = parsePublishVisibility(body?.visibility)

  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)
  const targetWorkspace = await requireWorkspaceAccess({
    supabase,
    workspaceId,
    actorId,
    actorUserType: actor.user_type
  })

  const mayPublishWorkspace = targetWorkspace.owner_id === actorId || actor.user_type === 'consultant'
  if (!mayPublishWorkspace) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je hebt geen rechten om deze ruimte te publiceren.'
    })
  }

  if (targetWorkspace.visibility !== 'offline') {
    return {
      ok: true,
      workspace: targetWorkspace,
      alreadyPublished: true
    }
  }

  if (!requestedVisibility) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kies bij de eerste publicatie Publiek of Afgeschermd.'
    })
  }

  const nextAccessPin = requestedVisibility === 'private'
    ? targetWorkspace.access_pin || generateAccessPin()
    : null

  const { data: publishedWorkspace, error: publishError } = await supabase
    .from('app_workspaces')
    .update({
      visibility: requestedVisibility,
      access_pin: nextAccessPin,
      published_at: new Date().toISOString()
    })
    .eq('id', workspaceId)
    .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, access_pin, published_at, created_at, updated_at')
    .single()

  if (publishError || !publishedWorkspace) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Publiceren van werkruimte is mislukt.',
      data: {
        supabaseError: publishError?.message
      }
    })
  }

  return {
    ok: true,
    workspace: publishedWorkspace,
    justPublished: true
  }
})
