import { ref } from 'vue'
import { useSupabaseClient } from './useSupabaseClient'

// Module-level reactive state — shared across the app for the lifetime of the page.
const session = ref(null)
const appUser = ref(null)
let _initialized = false

export function useAuth() {
  const supabase = useSupabaseClient()
  const runtimeConfig = useRuntimeConfig()

  function getAuthRedirectUrl() {
    const runtimeBaseUrl = runtimeConfig.public?.appBaseUrl
    const browserBaseUrl = import.meta.client && typeof window !== 'undefined'
      ? window.location.origin
      : ''

    const baseUrl = (browserBaseUrl || runtimeBaseUrl || '').replace(/\/$/, '')
    return `${baseUrl}/auth/login?verified=1`
  }

  async function init() {
    if (_initialized) return
    _initialized = true

    const { data } = await supabase.auth.getSession()
    session.value = data.session

    if (session.value) {
      await loadAppUser(session.value.user.id)
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) {
        await loadAppUser(newSession.user.id)
      } else {
        appUser.value = null
      }
    })
  }

  async function loadAppUser(userId) {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, first_name, last_name, billing_card_last4, maintenance_yearly_price_cents, rooms_limit')
      .eq('id', userId)
      .single()

    if (!error && data) {
      appUser.value = data
    }
  }

  async function signUp({ email, password, firstName, lastName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`.trim()
        }
      }
    })
    if (error) throw error

    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function resendSignupVerification(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
      throw new Error('Geef een geldig e-mailadres op om de verificatiemail opnieuw te sturen.')
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl()
      }
    })

    if (error) throw error
    return data
  }

  async function updateProfile({ firstName, lastName, billingCardLast4 }) {
    if (!session.value?.user?.id) {
      throw new Error('Je moet aangemeld zijn om je profiel bij te werken.')
    }

    const userId = session.value.user.id
    const { data, error } = await supabase
      .from('app_users')
      .update({
        first_name: firstName,
        last_name: lastName,
        billing_card_last4: billingCardLast4,
        display_name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || null
      })
      .eq('id', userId)
      .select('id, email, first_name, last_name, billing_card_last4, maintenance_yearly_price_cents, rooms_limit')
      .single()

    if (error) throw error

    if (data) {
      appUser.value = data
    }

    return data
  }

  async function updateEmail(newEmail) {
    if (!session.value?.user?.id) {
      throw new Error('Je moet aangemeld zijn om je e-mailadres bij te werken.')
    }

    const currentEmail = session.value.user.email || appUser.value?.email || ''
    const nextEmail = newEmail.trim()

    if (!nextEmail || nextEmail === currentEmail) {
      return { emailUpdated: false, emailConfirmationRequired: false }
    }

    const { data, error } = await supabase.auth.updateUser({ email: nextEmail })
    if (error) throw error

    return {
      emailUpdated: true,
      emailConfirmationRequired: Boolean(data?.user && data.user.email !== nextEmail)
    }
  }

  async function addRoomSlots({
    slots = 1,
    yearlyMaintenanceIncreaseCents = 0
  } = {}) {
    if (!session.value?.user?.id) {
      throw new Error('Je moet aangemeld zijn om extra ruimtes toe te voegen.')
    }

    const slotCount = Number.isFinite(Number(slots)) ? Math.max(1, Math.floor(Number(slots))) : 1
    const yearlyIncrease = Number.isFinite(Number(yearlyMaintenanceIncreaseCents))
      ? Math.max(0, Math.floor(Number(yearlyMaintenanceIncreaseCents)))
      : 0

    const userId = session.value.user.id
    const currentLimit = Number(appUser.value?.rooms_limit ?? 1)
    const currentYearly = Number(appUser.value?.maintenance_yearly_price_cents ?? 0)
    const nextLimit = currentLimit + slotCount
    const nextYearly = currentYearly + yearlyIncrease

    const { data, error } = await supabase
      .from('app_users')
      .update({
        rooms_limit: nextLimit,
        maintenance_yearly_price_cents: nextYearly
      })
      .eq('id', userId)
      .select('id, email, first_name, last_name, billing_card_last4, maintenance_yearly_price_cents, rooms_limit')
      .single()

    if (error) throw error

    if (data) {
      appUser.value = data
    }

    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
    appUser.value = null
    _initialized = false
  }

  return {
    session,
    appUser,
    init,
    signUp,
    signIn,
    resendSignupVerification,
    updateProfile,
    updateEmail,
    addRoomSlots,
    signOut
  }
}
