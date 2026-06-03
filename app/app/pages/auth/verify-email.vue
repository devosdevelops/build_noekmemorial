<template>
  <div class="verify-page">
    <div class="verify-shell">
      <section class="verify-brand-card">
        <img src="/logo-white.png" alt="Columba" class="verify-logo" />
        <h1>Controleer je e-mail</h1>
        <p>
          We hebben een verificatielink gestuurd. Open je inbox en klik op de link om je account te activeren.
        </p>
      </section>

      <Card class="verify-card">
        <h2>E-mailverificatie</h2>
        <p class="verify-subtitle">
          Zodra je e-mailadres bevestigd is, kan je meteen inloggen en je ruimtes beheren.
        </p>

        <AlertToast
          type="warning"
          title="Bevestig eerst je e-mailadres"
          message="Gebruik de link uit je mail om je account te activeren."
        />

        <div class="verify-field-group">
          <label for="verify-email-input">E-mailadres</label>
          <input
            id="verify-email-input"
            v-model="email"
            type="email"
            class="verify-input"
            placeholder="naam@mail.com"
          />
        </div>

        <button class="verify-primary-button" type="button" :disabled="isResending" @click="resendEmail">
          {{ isResending ? 'Verificatiemail verzenden...' : 'Stuur verificatiemail opnieuw' }}
        </button>

        <AlertToast
          v-if="feedbackMessage"
          :type="feedbackType"
          :title="feedbackTitle"
          :message="feedbackMessage"
        />

        <p class="verify-footnote">
          Al bevestigd?
          <NuxtLink :to="loginTarget">Ga naar login</NuxtLink>
        </p>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Card from '../../components/ui/Card.vue'
import AlertToast from '../../components/ui/AlertToast.vue'
import { useAuth } from '../../composables/useAuth'

definePageMeta({
  layout: false
})

const route = useRoute()
const { resendSignupVerification } = useAuth()

const queryEmail = typeof route.query.email === 'string' ? route.query.email : ''
const queryRedirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

const email = ref(queryEmail)
const isResending = ref(false)
const feedbackType = ref('success')
const feedbackTitle = ref('')
const feedbackMessage = ref('')

const loginTarget = computed(() => {
  if (!queryRedirect.length) {
    return '/auth/login'
  }

  return `/auth/login?redirect=${encodeURIComponent(queryRedirect)}`
})

async function resendEmail() {
  feedbackMessage.value = ''
  feedbackTitle.value = ''

  isResending.value = true
  const cleanEmail = email.value.trim().toLowerCase()

  if (!cleanEmail.length) {
    feedbackType.value = 'warning'
    feedbackTitle.value = 'E-mailadres ontbreekt'
    feedbackMessage.value = 'Geef een geldig e-mailadres op om de verificatiemail opnieuw te sturen.'
    isResending.value = false
    return
  }

   try {
    await resendSignupVerification(cleanEmail)
     feedbackType.value = 'success'
     feedbackTitle.value = 'Verificatiemail verzonden'
    feedbackMessage.value = `We hebben een nieuwe verificatielink verstuurd naar ${cleanEmail}. Controleer je inbox en spamfolder.`
   } catch (error) {
     feedbackType.value = 'error'
     feedbackTitle.value = 'Verzenden mislukt'
     feedbackMessage.value = error?.message || 'De verificatiemail kon niet opnieuw verstuurd worden.'
   } finally {
     isResending.value = false
   }
 }
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, #f3f2ee 0%, #edf0e8 52%, #e7eddf 100%);
  font-family: var(--font-sans);
}

.verify-shell {
  max-width: 1100px;
  margin: 0 auto;
  min-height: calc(100vh - 4rem);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 1.5rem;
  align-items: center;
}

.verify-brand-card {
  border-radius: 16px;
  padding: 2.2rem;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
  box-shadow: 0 10px 30px rgba(40, 50, 31, 0.18);
}

.verify-logo {
  height: 68px;
  width: auto;
  margin-bottom: 1.5rem;
}

.verify-brand-card h1 {
  margin: 0 0 0.65rem;
  font-family: var(--font-display);
  font-size: 2.1rem;
  line-height: 1.1;
}

.verify-brand-card p {
  margin: 0;
  max-width: 28rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);
}

.verify-card {
  padding: 1.7rem;
  display: grid;
  gap: 1rem;
}

.verify-card h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.65rem;
  color: #1f2433;
}

.verify-subtitle {
  margin: 0;
  font-size: 0.92rem;
  color: #667086;
}

.verify-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.verify-field-group label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2433;
}

.verify-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 12px;
  padding: 0.8rem 0.95rem;
  background: linear-gradient(180deg, #aeb1bb 0%, #9ea3ae 100%);
  color: #ffffff;
  font-size: 0.95rem;
}

.verify-input::placeholder {
  color: #e8ebf2;
}

.verify-primary-button {
  border: none;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  background: var(--ok-gradient, linear-gradient(180deg, #82d14d 0%, #629d3a 100%));
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(98, 157, 58, 0.3);
}

.verify-primary-button:disabled {
  opacity: 0.66;
  cursor: not-allowed;
}

.verify-footnote {
  margin: 0;
  font-size: 0.9rem;
  color: #667086;
}

.verify-footnote a {
  color: #6fb63e;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 900px) {
  .verify-shell {
    grid-template-columns: 1fr;
  }

  .verify-brand-card {
    padding: 1.6rem;
  }

  .verify-brand-card h1 {
    font-size: 1.8rem;
  }
}
</style>
