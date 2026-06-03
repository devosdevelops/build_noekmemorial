import { ref } from 'vue'
import { useSupabaseClient } from './useSupabaseClient'

// Module-level reactive state — shared across the app for the lifetime of the page.
const session = ref(null)
const appUser = ref(null)
let _initialized = false

export function useAuth() {
  const supabase = useSupabaseClient()

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
    signOut
  }
}
