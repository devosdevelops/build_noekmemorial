import { createClient } from '@supabase/supabase-js'

let _client = null

export function useSupabaseClient() {
  if (_client) return _client

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey

  if (!url || !key) {
    throw new Error('Supabase public config is missing. Check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.')
  }

  _client = createClient(url, key)
  return _client
}
