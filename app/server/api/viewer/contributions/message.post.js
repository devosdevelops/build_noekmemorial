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
  const message = normalizeText(body?.message, 1600)
  const voiceUrl = normalizeText(body?.voiceUrl, 2000)
  const guestName = normalizeText(body?.guestName, 120)
  const elementId = normalizeText(body?.elementId, 160)
  const accessPin = normalizeText(body?.accessPin, 16)

  if (!slug.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruimte-slug is verplicht.'
    })
  }

  if (!message.length && !voiceUrl.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Berichttekst of voice URL is verplicht.'
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
    kind: 'message',
    message: message || null,
    voice_url: voiceUrl || null,
    guest_name: authorId ? null : guestName,
    element_id: elementId || null,
    world_position: Array.isArray(body?.worldPosition) ? body.worldPosition : null
  }

  const isVoiceOnly = !message.length && voiceUrl.length
  const titleBase = isVoiceOnly
    ? (authorId ? 'Spraakbericht van bezoeker' : `Spraakbericht van ${guestName}`)
    : (authorId ? 'Bericht van bezoeker' : `Bericht van ${guestName}`)

  const { data, error } = await supabase
    .from('app_posts')
    .insert({
      workspace_id: workspace.id,
      author_id: authorId,
      scene_id: null,
      content_type: 'post',
      slug: buildContributionSlug('msg'),
      title: titleBase,
      excerpt: message.length ? message.slice(0, 180) : 'Spraakbericht',
      content: contributionContent,
      status,
      published_at: status === 'published' ? now : null
    })
    .select('id, status, created_at')
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Bericht kon niet worden opgeslagen.',
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
