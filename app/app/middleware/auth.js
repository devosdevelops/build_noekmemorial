import { useSupabaseClient } from '../composables/useSupabaseClient'

export default defineNuxtRouteMiddleware(async (to) => {
  // Guard authenticated app surfaces.
  const needsAuth = to.path.startsWith('/dashboard') || to.path.startsWith('/editor')
  if (!needsAuth) return

  // Skip on server — session is browser-only with the anon key client.
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    return navigateTo('/auth/login')
  }
})
