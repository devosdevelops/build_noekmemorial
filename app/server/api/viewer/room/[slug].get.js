import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'

function normalizePin(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function toContribution(row) {
  return {
    id: row.id,
    type: row.content?.kind || row.content_type || 'post',
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    mediaUrl: row.media_url,
    mediaMimeType: row.media_mime_type,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at
  }
}

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '').trim().toLowerCase()

  if (!slug.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()

  const { data: workspace, error: workspaceError } = await supabase
    .from('app_workspaces')
    .select('id, name, slug, visibility, approval_mode, access_pin, deceased_first_name, deceased_last_name')
    .eq('slug', slug)
    .maybeSingle()

  if (workspaceError || !workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Herdenkingsruimte niet gevonden.'
    })
  }

  if (workspace.visibility === 'offline') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Deze herdenkingsruimte is nog offline en nog niet gepubliceerd.'
    })
  }

  const requestedPin = normalizePin(getQuery(event)?.accessPin)
  const expectedPin = normalizePin(workspace.access_pin)

  if (workspace.visibility === 'private' && expectedPin.length && requestedPin !== expectedPin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Deze ruimte is afgeschermd met een toegangscode.',
      data: {
        requiresPin: true
      }
    })
  }

  const [sceneResult, contributionsResult] = await Promise.all([
    supabase
      .from('app_scenes')
      .select('id, scene_data, updated_at')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('app_posts')
      .select('id, content_type, title, excerpt, content, media_url, media_mime_type, status, published_at, created_at')
      .eq('workspace_id', workspace.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(120)
  ])

  if (sceneResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Scènegegevens konden niet worden geladen.',
      data: {
        supabaseError: sceneResult.error.message
      }
    })
  }

  if (contributionsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Bijdragen konden niet worden geladen.',
      data: {
        supabaseError: contributionsResult.error.message
      }
    })
  }

  return {
    ok: true,
    room: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      visibility: workspace.visibility,
      approvalMode: workspace.approval_mode,
      deceasedFirstName: workspace.deceased_first_name,
      deceasedLastName: workspace.deceased_last_name
    },
    scene: sceneResult.data || null,
    contributions: Array.isArray(contributionsResult.data)
      ? contributionsResult.data.map((row) => toContribution(row))
      : []
  }
})
