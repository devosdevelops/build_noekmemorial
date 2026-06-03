<template>
  <div class="auth-page">
    <div class="auth-shell">
      <section class="auth-brand-card">
        <img src="/logo-white.png" alt="Columba" class="auth-logo" />
        <h1>Welkom terug</h1>
        <p>Log in om je herdenkingsruimtes, samenwerkingen en instellingen te beheren.</p>
      </section>

      <Card class="auth-card">
        <h2>Log in</h2>
        <p class="auth-subtitle">Gebruik je e-mailadres en wachtwoord om verder te gaan.</p>

        <form class="auth-form" @submit.prevent="submitLogin">
          <div class="field-group">
            <label for="login-email">E-mail</label>
            <input id="login-email" v-model="email" type="email" class="auth-input" placeholder="naam@mail.com" />
          </div>

          <div class="field-group">
            <label for="login-password">Wachtwoord</label>
            <div class="password-field-row">
              <input
                id="login-password"
                v-model="password"
                :type="isPasswordVisible ? 'text' : 'password'"
                class="auth-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="isPasswordVisible ? 'Verberg wachtwoord' : 'Toon wachtwoord'"
                @click="isPasswordVisible = !isPasswordVisible"
              >
                <img :src="isPasswordVisible ? '/icons/eye_hide.svg' : '/icons/eye.svg'" alt="" />
              </button>
            </div>
          </div>

          <button type="submit" class="auth-primary-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Bezig...' : 'Log in' }}
          </button>
        </form>

        <p v-if="loginError" class="error-text">{{ loginError }}</p>

        <p class="auth-footnote">
          Nog geen account?
          <NuxtLink to="/auth/signup">Maak een account aan</NuxtLink>
        </p>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from '../../components/ui/Card.vue'
import { useAuth } from '../../composables/useAuth'

definePageMeta({
  layout: false
})

const { signIn } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const isPasswordVisible = ref(false)
const loginError = ref('')
const isSubmitting = ref(false)
async function submitLogin() {
  loginError.value = ''
  isSubmitting.value = true
  try {
    await signIn({ email: email.value.trim(), password: password.value })
    router.push('/dashboard')
  } catch (err) {
    loginError.value = err.message || 'Inloggen mislukt. Controleer je gegevens en probeer opnieuw.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, #f3f2ee 0%, #edf0e8 52%, #e7eddf 100%);
  font-family: var(--font-sans);
}

.auth-shell {
  max-width: 1100px;
  margin: 0 auto;
  min-height: calc(100vh - 4rem);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 1.5rem;
  align-items: center;
}

.auth-brand-card {
  border-radius: 16px;
  padding: 2.2rem;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
  box-shadow: 0 10px 30px rgba(40, 50, 31, 0.18);
}

.auth-logo {
  height: 68px;
  width: auto;
  margin-bottom: 1.5rem;
}

.auth-brand-card h1 {
  margin: 0 0 0.65rem;
  font-family: var(--font-display);
  font-size: 2.2rem;
  line-height: 1.1;
}

.auth-brand-card p {
  margin: 0;
  max-width: 28rem;
  font-size: 0.98rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);
}

.auth-card {
  padding: 1.7rem;
}

.auth-card h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.7rem;
  color: #1f2433;
}

.auth-subtitle {
  margin: 0.35rem 0 1.35rem;
  font-size: 0.92rem;
  color: #667086;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.password-field {
  display: contents;
}

.password-field-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.2rem;
  gap: 0.65rem;
  align-items: center;
}

.field-group label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2433;
}

.auth-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 12px;
  padding: 0.8rem 0.95rem;
  background: linear-gradient(180deg, #aeb1bb 0%, #9ea3ae 100%);
  color: #ffffff;
  font-size: 0.95rem;
}

.auth-input::placeholder {
  color: #e8ebf2;
}

.password-toggle {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid rgba(124, 138, 110, 0.22);
  padding: 0;
  border-radius: 0.5rem;
  background: linear-gradient(180deg, #fbfcfa 0%, #edf2e7 100%);
  box-shadow: 0 2px 8px rgba(62, 73, 49, 0.14);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.password-toggle:hover {
  border-color: rgba(101, 124, 74, 0.32);
  background: linear-gradient(180deg, #ffffff 0%, #e7f0dc 100%);
}

.password-toggle:focus-visible {
  outline: 2px solid rgba(90, 116, 60, 0.72);
  outline-offset: 2px;
}

.password-toggle img {
  width: 1rem;
  height: 1rem;
}

.auth-primary-button {
  margin-top: 0.4rem;
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

.auth-footnote {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: #667086;
}

.auth-footnote a {
  color: #6fb63e;
  font-weight: 700;
  text-decoration: none;
}

.error-text {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #c0392b;
}

@media (max-width: 900px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-brand-card {
    padding: 1.6rem;
  }

  .auth-brand-card h1 {
    font-size: 1.8rem;
  }
}
</style>
