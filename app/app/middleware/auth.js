import { useSupabaseClient } from '../composables/useSupabaseClient'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only guard dashboard routes.
  if (!to.path.startsWith('/dashboard')) return

  // Skip on server — session is browser-only with the anon key client.
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    return navigateTo('/auth/login')
  }
})
