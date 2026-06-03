import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'
import { getBearerToken } from '../../../utils/workspaceAccess.js'

function normalizeText(value, max = 2000) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.slice(0, max)
}

function buildContributionSlug(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

async function resolveActorIdFromToken(supabase, token) {
  if (!token.length) {
    return null
  }

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token)

  if (authUserError || !authUserData?.user?.id) {
    return null
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('id', authUserData.user.id)
    .maybeSingle()

  return appUser?.id || null
}

async function loadWorkspaceBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from('app_workspaces')
    .select('id, slug, visibility, approval_mode, access_pin')
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
      statusMessage: 'Deze herdenkingsruimte is nog offline en accepteert nog geen bijdragen.'
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
  const guestName = normalizeText(body?.guestName, 120)
  const candleStyle = normalizeText(body?.candleStyle, 80) || 'classic'
  const dedication = normalizeText(body?.dedication, 300)
  const elementId = normalizeText(body?.elementId, 160)
  const accessPin = normalizeText(body?.accessPin, 16)

  if (!slug.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruimte-slug is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const token = getBearerToken(event)
  const authorId = await resolveActorIdFromToken(supabase, token)

  if (!authorId && !guestName.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Gastnaam is verplicht wanneer je niet bent ingelogd.'
    })
  }

  const workspace = await loadWorkspaceBySlug(supabase, slug)
  assertPinIfNeeded(workspace, accessPin)

  const now = new Date().toISOString()
  const status = workspace.approval_mode === 'automatic' ? 'published' : 'draft'

  const contributionContent = {
    kind: 'candle',
    candle_style: candleStyle,
    dedication: dedication || null,
    guest_name: authorId ? null : guestName,
    element_id: elementId || null,
    world_position: Array.isArray(body?.worldPosition) ? body.worldPosition : null
  }

  const titleBase = authorId ? 'Kaars aangestoken' : `Kaars van ${guestName}`

  const { data, error } = await supabase
    .from('app_posts')
    .insert({
      workspace_id: workspace.id,
      author_id: authorId,
      scene_id: null,
      content_type: 'post',
      slug: buildContributionSlug('candle'),
      title: titleBase,
      excerpt: dedication || null,
      content: contributionContent,
      status,
      published_at: status === 'published' ? now : null
    })
    .select('id, status, created_at')
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kaars kon niet worden opgeslagen.',
      data: {
        supabaseError: error?.message
      }
    })
  }

  return {
    ok: true,
    contribution: data
  }
})
