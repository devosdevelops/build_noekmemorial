import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'

function formatName(firstName, lastName, fallback) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || fallback || 'Onbekend'
}

function mapCollaborator(collaboratorRow, userRow) {
  const displayName = formatName(userRow?.first_name, userRow?.last_name, userRow?.email)
  const initialsSource = displayName || userRow?.email || 'S'

  return {
    id: collaboratorRow.user_id,
    initials: initialsSource
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || initialsSource.slice(0, 2).toUpperCase(),
    name: displayName,
    email: userRow?.email ?? null,
    role: collaboratorRow.role,
    addedAt: collaboratorRow.created_at
  }
}

function mapRecentActivity(postRow, authorRow) {
  const authorName = formatName(authorRow?.first_name, authorRow?.last_name, authorRow?.email || 'Onbekend')

  return {
    id: postRow.id,
    type: postRow.content_type || 'post',
    status: postRow.status || 'draft',
    title: postRow.title || 'Ongetitelde bijdrage',
    authorName,
    happenedAt: postRow.updated_at || postRow.created_at || null
  }
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')

  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()

  const { data: workspace, error: workspaceError } = await supabase
    .from('app_workspaces')
    .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, access_pin, created_at, updated_at')
    .eq('id', workspaceId)
    .single()

  if (workspaceError || !workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: `Werkruimte niet gevonden (${workspaceId}).`,
      data: {
        supabaseError: workspaceError?.message
      }
    })
  }

  const [ownerResult, collaboratorsResult] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, email, first_name, last_name')
      .eq('id', workspace.owner_id)
      .maybeSingle(),
    supabase
      .from('collaborators')
      .select('workspace_id, user_id, role, added_by, created_at')
      .eq('workspace_id', workspaceId)
  ])

  const owner = ownerResult.data ?? null
  const collaborators = Array.isArray(collaboratorsResult.data) ? collaboratorsResult.data : []

  const collaboratorUserIds = [...new Set(collaborators.map((row) => row.user_id).filter(Boolean))]
  let collaboratorUsers = []

  if (collaboratorUserIds.length > 0) {
    const { data: userRows } = await supabase
      .from('app_users')
      .select('id, email, first_name, last_name')
      .in('id', collaboratorUserIds)

    collaboratorUsers = Array.isArray(userRows) ? userRows : []
  }

  const collaboratorsWithProfiles = collaborators.map((row) =>
    mapCollaborator(
      row,
      collaboratorUsers.find((user) => user.id === row.user_id)
    )
  )

  const [pendingPostsResult, recentPostsResult] = await Promise.all([
    supabase
      .from('app_posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'draft'),
    supabase
      .from('app_posts')
      .select('id, title, content_type, status, author_id, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(6)
  ])

  if (pendingPostsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kon moderatiegegevens niet ophalen.',
      data: {
        supabaseError: pendingPostsResult.error.message
      }
    })
  }

  if (recentPostsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kon recente activiteit niet ophalen.',
      data: {
        supabaseError: recentPostsResult.error.message
      }
    })
  }

  const recentPosts = Array.isArray(recentPostsResult.data) ? recentPostsResult.data : []
  const authorIds = [...new Set(recentPosts.map((row) => row.author_id).filter(Boolean))]

  let activityAuthors = []
  if (authorIds.length > 0) {
    const { data: authorRows } = await supabase
      .from('app_users')
      .select('id, email, first_name, last_name')
      .in('id', authorIds)

    activityAuthors = Array.isArray(authorRows) ? authorRows : []
  }

  const recentActivity = recentPosts.map((post) =>
    mapRecentActivity(
      post,
      activityAuthors.find((author) => author.id === post.author_id)
    )
  )

  return {
    ok: true,
    workspace,
    owner,
    collaborators: collaboratorsWithProfiles,
    moderation: {
      pendingCount: pendingPostsResult.count || 0
    },
    recentActivity
  }
})