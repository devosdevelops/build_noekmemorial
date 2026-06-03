import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'
import { getBearerToken } from '../../../utils/workspaceAccess.js'

const ALLOWED_REACTIONS = new Set(['heart', 'hug', 'sad'])

function normalizeText(value, max = 2000) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.slice(0, max)
}

function normalizeReactions(input) {
  const source = input && typeof input === 'object' ? input : {}

  return {
    heart: Number.isFinite(source.heart) ? Math.max(0, Math.floor(source.heart)) : 0,
    hug: Number.isFinite(source.hug) ? Math.max(0, Math.floor(source.hug)) : 0,
    sad: Number.isFinite(source.sad) ? Math.max(0, Math.floor(source.sad)) : 0
  }
}

async function loadWorkspaceBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from('app_workspaces')
    .select('id, slug, visibility, access_pin')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Herdenkingsruimte niet gevonden.'
    })
  }

  return data
}

function assertPinIfNeeded(workspace, accessPin) {
  if (workspace.visibility === 'offline') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Deze herdenkingsruimte is offline en accepteert geen reacties.'
    })
  }

  const expectedPin = normalizeText(workspace.access_pin, 16)
  const suppliedPin = normalizeText(accessPin, 16)

  if (workspace.visibility === 'private' && expectedPin.length && suppliedPin !== expectedPin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Onjuiste toegangscode voor deze ruimte.'
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const slug = normalizeText(body?.slug, 140).toLowerCase()
  const contributionId = normalizeText(body?.contributionId, 140)
  const reactionType = normalizeText(body?.reactionType, 24).toLowerCase()
  const accessPin = normalizeText(body?.accessPin, 16)

  if (!slug.length || !contributionId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruimte en bijdrage zijn verplicht.'
    })
  }

  if (!ALLOWED_REACTIONS.has(reactionType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ongeldig reactietype.'
    })
  }

  const supabase = createSupabaseServerClient()

  // Keep behavior consistent with other viewer contribution routes.
  getBearerToken(event)

  const workspace = await loadWorkspaceBySlug(supabase, slug)
  assertPinIfNeeded(workspace, accessPin)

  const { data: postRow, error: postError } = await supabase
    .from('app_posts')
    .select('id, workspace_id, status, content')
    .eq('id', contributionId)
    .eq('workspace_id', workspace.id)
    .maybeSingle()

  if (postError || !postRow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Bijdrage niet gevonden.'
    })
  }

  if (postRow.status !== 'published') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Reacties zijn alleen beschikbaar voor gepubliceerde bijdragen.'
    })
  }

  const currentContent = postRow.content && typeof postRow.content === 'object' ? { ...postRow.content } : {}
  const reactions = normalizeReactions(currentContent.reactions)
  reactions[reactionType] += 1

  const { data: updated, error: updateError } = await supabase
    .from('app_posts')
    .update({
      content: {
        ...currentContent,
        reactions
      }
    })
    .eq('id', postRow.id)
    .select('id, content')
    .single()

  if (updateError || !updated) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Reactie kon niet worden opgeslagen.',
      data: {
        supabaseError: updateError?.message
      }
    })
  }

  return {
    ok: true,
    contributionId: updated.id,
    reactions: normalizeReactions(updated.content?.reactions)
  }
})
