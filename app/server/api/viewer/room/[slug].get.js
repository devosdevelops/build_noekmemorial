import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'

function buildDemoSceneDocument() {
  return {
    id: 'viewer-demo-scene',
    name: 'Viewer Demo Scene',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    editorSettings: {
      grid: {
        cellSize: 1,
        groundSize: 24,
        origin: [0, 0, 0]
      },
      lighting: {
        presetId: 'bright-warm'
      }
    },
    objects: [
      {
        id: 'floor-main',
        kind: 'floor',
        assetRef: 'floor-base',
        transform: {
          position: [0, -0.07, 0],
          rotation: [0, 0, 0],
          scale: [20, 1, 20]
        },
        appearance: {
          color: '#7a8fa0',
          texture: null,
          materialOverrides: null,
          finish: {
            roughness: 0.56,
            metalness: 0.03
          }
        },
        metadata: null,
        interaction: null
      },
      {
        id: 'demo-message-node',
        kind: 'model',
        assetRef: 'placeholder-model',
        transform: {
          position: [-2.8, 1.0, -1.5],
          rotation: [0, 0.25, 0],
          scale: [1, 1, 1]
        },
        appearance: {
          color: '#c7b08d',
          texture: null,
          materialOverrides: [],
          finish: {
            roughness: 0.58,
            metalness: 0.06
          }
        },
        metadata: null,
        interaction: {
          type: 'media-carousel',
          mediaKind: 'message'
        }
      },
      {
        id: 'demo-image-node',
        kind: 'model',
        assetRef: 'placeholder-model',
        transform: {
          position: [2.6, 1.0, -1.8],
          rotation: [0, -0.3, 0],
          scale: [1, 1, 1]
        },
        appearance: {
          color: '#9ab8c8',
          texture: null,
          materialOverrides: [],
          finish: {
            roughness: 0.54,
            metalness: 0.05
          }
        },
        metadata: null,
        interaction: {
          type: 'media-carousel',
          mediaKind: 'image-video'
        }
      }
    ]
  }
}

function normalizePin(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeReactions(input) {
  const source = input && typeof input === 'object' ? input : {}

  return {
    heart: Number.isFinite(source.heart) ? Math.max(0, Math.floor(source.heart)) : 0,
    hug: Number.isFinite(source.hug) ? Math.max(0, Math.floor(source.hug)) : 0,
    sad: Number.isFinite(source.sad) ? Math.max(0, Math.floor(source.sad)) : 0
  }
}

function toContribution(row) {
  const content = row?.content && typeof row.content === 'object' ? { ...row.content } : {}
  content.reactions = normalizeReactions(content.reactions)

  return {
    id: row.id,
    type: content.kind || row.content_type || 'post',
    title: row.title,
    excerpt: row.excerpt,
    content,
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

  if (slug === 'demo') {
    return {
      ok: true,
      room: {
        id: 'demo-room',
        slug: 'demo',
        name: 'Demo Herdenkingsruimte',
        visibility: 'public',
        approvalMode: 'manual',
        deceasedFirstName: 'Demo',
        deceasedLastName: 'Ruimte'
      },
      scene: {
        id: 'demo-scene-row',
        scene_data: buildDemoSceneDocument(),
        updated_at: new Date().toISOString()
      },
      contributions: []
    }
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
