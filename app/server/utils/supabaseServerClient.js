import { createClient } from '@supabase/supabase-js'

export function createSupabaseServerClient() {
  const runtimeConfig = useRuntimeConfig()
  const supabaseUrl = runtimeConfig.public?.supabaseUrl
  const supabaseKey = runtimeConfig.supabaseSecretKey || runtimeConfig.public?.supabasePublishableKey

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase runtime config is missing. Check SUPABASE_URL and SUPABASE_SECRET_KEY.'
    })
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
