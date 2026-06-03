import { Resend } from 'resend'
import { createSupabaseServerClient } from '../../../utils/supabaseServerClient.js'

function getBearerToken(event) {
  const header = getHeader(event, 'authorization')
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return ''
  }

  return header.slice(7).trim()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function formatName(firstName, lastName, fallback) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || fallback || 'Onbekend'
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const inviteEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!workspaceId || !workspaceId.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Werkruimte-ID is verplicht.'
    })
  }

  if (!inviteEmail || !isValidEmail(inviteEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Geef een geldig e-mailadres op.'
    })
  }

  const token = getBearerToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie is ongeldig. Log opnieuw in.'
    })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const supabase = createSupabaseServerClient()

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token)
  if (authUserError || !authUserData?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Je sessie kon niet worden geverifieerd.'
    })
  }

  const inviterId = authUserData.user.id

  const [inviterResult, workspaceResult] = await Promise.all([
    supabase
      .from('app_users')
      .select('id, email, first_name, last_name, user_type')
      .eq('id', inviterId)
      .single(),
    supabase
      .from('app_workspaces')
      .select('id, owner_id, name, slug')
      .eq('id', workspaceId)
      .single()
  ])

  const inviter = inviterResult.data
  const workspace = workspaceResult.data

  if (inviterResult.error || !inviter) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je profiel kon niet worden gevonden.'
    })
  }

  if (workspaceResult.error || !workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Werkruimte niet gevonden.'
    })
  }

  const mayInvite = workspace.owner_id === inviterId || inviter.user_type === 'consultant'
  if (!mayInvite) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Je hebt geen rechten om samenwerkers uit te nodigen voor deze ruimte.'
    })
  }

  const { data: invitee, error: inviteeError } = await supabase
    .from('app_users')
    .select('id, email, first_name, last_name')
    .eq('email', inviteEmail)
    .maybeSingle()

  if (inviteeError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kon uitgenodigde gebruiker niet ophalen.',
      data: {
        supabaseError: inviteeError.message
      }
    })
  }

  if (!invitee) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Geen gebruiker gevonden met dit e-mailadres. Laat hen eerst registreren.'
    })
  }

  if (invitee.id === workspace.owner_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'De eigenaar van de werkruimte kan niet als collaborator worden toegevoegd.'
    })
  }

  const existingCollaboratorResult = await supabase
    .from('collaborators')
    .select('workspace_id, user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', invitee.id)
    .maybeSingle()

  if (existingCollaboratorResult.data) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Deze gebruiker is al collaborator in deze ruimte.'
    })
  }

  const { error: insertError } = await supabase
    .from('collaborators')
    .insert({
      workspace_id: workspaceId,
      user_id: invitee.id,
      role: 'collaborator',
      added_by: inviterId
    })

  if (insertError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Kon collaborator niet toevoegen.',
      data: {
        supabaseError: insertError.message
      }
    })
  }

  const inviterName = formatName(inviter.first_name, inviter.last_name, inviter.email)
  const inviteeName = formatName(invitee.first_name, invitee.last_name, invitee.email)
  const workspaceLink = `${runtimeConfig.public.appBaseUrl}/dashboard/ruimte/${workspaceId}`

  if (runtimeConfig.resendApiKey) {
    const resend = new Resend(runtimeConfig.resendApiKey)

    await resend.emails.send({
      from: runtimeConfig.inviteFromEmail,
      to: invitee.email,
      subject: `Uitnodiging voor ${workspace.name}`,
      html: `
        <p>Hallo ${inviteeName},</p>
        <p>${inviterName} heeft je toegevoegd als collaborator voor de herdenkingsruimte <strong>${workspace.name}</strong>.</p>
        <p>Je kan de ruimte bekijken via: <a href="${workspaceLink}">${workspaceLink}</a></p>
      `
    })
  }

  return {
    ok: true,
    collaborator: {
      id: invitee.id,
      name: inviteeName,
      email: invitee.email,
      role: 'collaborator'
    }
  }
})
