// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/global.css'],
  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    polypizzaApiKey: process.env.POLYPIZZA_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    inviteFromEmail: process.env.INVITE_FROM_EMAIL || 'onboarding@resend.dev',
    public: {
      appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY
    }
  }
})
