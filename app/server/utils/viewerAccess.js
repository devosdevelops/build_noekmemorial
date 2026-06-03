import { getBearerToken } from './workspaceAccess.js'

function slugifyPart(value) {
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

export async function resolveOptionalViewerActor(event, supabase) {
  const token = getBearerToken(event)

  if (!token.length) {
    return {
      token: '',
      actorId: null,
      actor: null
    }
  }

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token)

  if (authUserError || !authUserData?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie kon niet worden geverifieerd.'
    })
  }

  const actorId = authUserData.user.id
  const { data: actor, error: actorError } = await supabase
    .from('app_users')
    .select('id, email, first_name, last_name, display_name, user_type')
    .eq('id', actorId)
    .single()

  if (actorError || !actor) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je profiel kon niet worden gevonden.'
    })
  }

  return {
    token,
    actorId,
    actor
  }
}

export async function requireViewerWorkspaceBySlug({ supabase, slug }) {
  if (!slug || !slug.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruimte-slug is verplicht.'
    })
  }

  const { data: workspace, error } = await supabase
    .from('app_workspaces')
    .select('id, name, slug, owner_id, visibility, approval_mode, access_pin, deceased_first_name, deceased_last_name')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Herdenkingsruimte kon niet worden geladen.',
      data: {
        supabaseError: error.message
      }
    })
  }

  if (!workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Herdenkingsruimte niet gevonden.'
    })
  }

  return workspace
}

export function ensureViewerRoomAccess({ workspace, roomPin }) {
  if (workspace.visibility !== 'private') {
    return
  }

  const expectedPin = String(workspace.access_pin || '').trim()
  const providedPin = String(roomPin || '').trim()

  if (!expectedPin.length || providedPin !== expectedPin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Deze ruimte is afgeschermd met een pincode.'
    })
  }
}

export function resolvePostStatus(approvalMode) {
  return approvalMode === 'automatic' ? 'published' : 'draft'
}

export async function createUniqueViewerPostSlug({ supabase, workspaceId, prefix = 'viewer' }) {
  const basePrefix = slugifyPart(prefix) || 'viewer'

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 8)
    const candidate = `${basePrefix}-${Date.now().toString(36)}-${suffix}`

    const { data, error } = await supabase
      .from('app_posts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Kon geen unieke bijdrage-slug genereren.',
        data: {
          supabaseError: error.message
        }
      })
    }

    if (!data) {
      return candidate
    }
  }

  return `${basePrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function resolveDisplayName({ actor, guestName }) {
  if (actor) {
    const firstName = String(actor.first_name || '').trim()
    const lastName = String(actor.last_name || '').trim()
    const fullName = `${firstName} ${lastName}`.trim()

    return fullName || actor.display_name || actor.email || 'Bezoeker'
  }

  return String(guestName || '').trim() || 'Gast'
}
