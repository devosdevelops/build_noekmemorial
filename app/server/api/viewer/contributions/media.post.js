import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'
import { getBearerToken } from '../../../utils/workspaceAccess.js'

const ALLOWED_MEDIA_TYPES = new Set(['image', 'video', 'audio'])

function normalizeText(value, max = 2000) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.slice(0, max)
}

function buildContributionSlug(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

async function requireActorIdFromToken(supabase, token) {
  if (!token.length) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Alleen ingelogde gebruikers kunnen media plaatsen.'
    })
  }

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token)

  if (authUserError || !authUserData?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie kon niet worden geverifieerd.'
    })
  }

  const { data: appUser, error: appUserError } = await supabase
    .from('app_users')
    .select('id')
    .eq('id', authUserData.user.id)
    .maybeSingle()

  if (appUserError || !appUser?.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je accountprofiel kon niet worden gevonden.'
    })
  }

  return appUser.id
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
  const mediaType = normalizeText(body?.mediaType, 24).toLowerCase()
  const title = normalizeText(body?.title, 160)
  const caption = normalizeText(body?.caption, 500)
  const mediaUrl = normalizeText(body?.mediaUrl, 2000)
  const mediaMimeType = normalizeText(body?.mediaMimeType, 120)
  const elementId = normalizeText(body?.elementId, 160)
  const accessPin = normalizeText(body?.accessPin, 16)

  if (!slug.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruimte-slug is verplicht.'
    })
  }

  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mediatype moet image, video of audio zijn.'
    })
  }

  if (!mediaUrl.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Media-URL is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const token = getBearerToken(event)
  const authorId = await requireActorIdFromToken(supabase, token)

  const workspace = await loadWorkspaceBySlug(supabase, slug)
  assertPinIfNeeded(workspace, accessPin)

  const now = new Date().toISOString()
  const status = workspace.approval_mode === 'automatic' ? 'published' : 'draft'

  const contributionContent = {
    kind: 'media',
    media_type: mediaType,
    caption: caption || null,
    element_id: elementId || null,
    world_position: Array.isArray(body?.worldPosition) ? body.worldPosition : null,
    reactions: {
      heart: 0,
      hug: 0,
      sad: 0
    }
  }

  const finalTitle = title || `Media bijdrage (${mediaType})`

  const { data, error } = await supabase
    .from('app_posts')
    .insert({
      workspace_id: workspace.id,
      author_id: authorId,
      scene_id: null,
      content_type: mediaType,
      slug: buildContributionSlug('media'),
      title: finalTitle,
      excerpt: caption || null,
      content: contributionContent,
      media_url: mediaUrl,
      media_mime_type: mediaMimeType || null,
      status,
      published_at: status === 'published' ? now : null
    })
    .select('id, status, created_at')
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Media kon niet worden opgeslagen.',
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
