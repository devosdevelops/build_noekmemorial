<template>
  <div class="auth-page">
    <div class="auth-shell">
      <section class="auth-brand-card">
        <img src="/logo-white.png" alt="Columba" class="auth-logo" />
        <h1>Maak een account</h1>
        <p>Stel je gegevens in en begin direct met het beheren van een herdenkingsruimte.</p>
      </section>

      <Card class="auth-card">
        <h2>Sign up</h2>
        <p class="auth-subtitle">Vul je gegevens in en kies een sterk wachtwoord.</p>

        <form class="auth-form" @submit.prevent="submitSignup">
          <div class="name-grid">
            <div class="field-group">
              <label for="signup-first-name">Voornaam</label>
              <input id="signup-first-name" v-model="firstName" type="text" class="auth-input" placeholder="Voornaam" />
            </div>

            <div class="field-group">
              <label for="signup-last-name">Naam</label>
              <input id="signup-last-name" v-model="lastName" type="text" class="auth-input" placeholder="Naam" />
            </div>
          </div>

          <div class="field-group">
            <label for="signup-email">E-mail</label>
            <input id="signup-email" v-model="email" type="email" class="auth-input" placeholder="naam@mail.com" />
          </div>

          <div class="field-group">
            <label for="signup-password">Wachtwoord</label>
            <div class="password-field-row">
              <input
                id="signup-password"
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

          <div class="field-group">
            <label for="signup-repeat-password">Herhaal wachtwoord</label>
            <div class="password-field-row">
              <input
                id="signup-repeat-password"
                v-model="repeatPassword"
                :type="isRepeatPasswordVisible ? 'text' : 'password'"
                class="auth-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="isRepeatPasswordVisible ? 'Verberg wachtwoord' : 'Toon wachtwoord'"
                @click="isRepeatPasswordVisible = !isRepeatPasswordVisible"
              >
                <img :src="isRepeatPasswordVisible ? '/icons/eye_hide.svg' : '/icons/eye.svg'" alt="" />
              </button>
            </div>
          </div>

          <div class="rule-box">
            <p>Je wachtwoord moet:</p>
            <ul>
              <li :class="{ ok: passwordRules.minLength }">Minstens 8 tekens bevatten</li>
              <li :class="{ ok: passwordRules.uppercase }">Minstens 1 hoofdletter bevatten</li>
              <li :class="{ ok: passwordRules.lowercase }">Minstens 1 kleine letter bevatten</li>
              <li :class="{ ok: passwordRules.number }">Minstens 1 cijfer bevatten</li>
              <li :class="{ ok: passwordsMatch }">Beide wachtwoorden moeten overeenkomen</li>
            </ul>
          </div>

          <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
          <p v-if="submitError" class="error-text">{{ submitError }}</p>

          <button type="submit" class="auth-primary-button" :disabled="!canSubmit || isSubmitting">
            {{ isSubmitting ? 'Bezig...' : 'Account aanmaken' }}
          </button>
        </form>

        <p class="auth-footnote">
          Al een account?
          <NuxtLink to="/auth/login">Log in</NuxtLink>
        </p>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Card from '../../components/ui/Card.vue'
import { useAuth } from '../../composables/useAuth'

definePageMeta({
  layout: false
})

const { signUp } = useAuth()
const router = useRouter()
const route = useRoute()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const repeatPassword = ref('')
const isPasswordVisible = ref(false)
const isRepeatPasswordVisible = ref(false)
const submitError = ref('')
const isSubmitting = ref(false)

const passwordRules = computed(() => {
  const value = password.value
  return {
    minLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value)
  }
})

const passwordsMatch = computed(() => password.value === repeatPassword.value && repeatPassword.value.length > 0)

const canSubmit = computed(() => {
  return (
    firstName.value.trim().length > 0 &&
    lastName.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    passwordRules.value.minLength &&
    passwordRules.value.uppercase &&
    passwordRules.value.lowercase &&
    passwordRules.value.number &&
    passwordsMatch.value
  )
})

const passwordError = computed(() => {
  if (!password.value && !repeatPassword.value) {
    return ''
  }

  if (!passwordRules.value.minLength) {
    return 'Wachtwoord moet minstens 8 tekens bevatten.'
  }

  if (!passwordRules.value.uppercase) {
    return 'Wachtwoord moet minstens 1 hoofdletter bevatten.'
  }

  if (!passwordRules.value.lowercase) {
    return 'Wachtwoord moet minstens 1 kleine letter bevatten.'
  }

  if (!passwordRules.value.number) {
    return 'Wachtwoord moet minstens 1 cijfer bevatten.'
  }

  if (!passwordsMatch.value) {
    return 'Wachtwoorden komen niet overeen.'
  }

  return ''
})

async function submitSignup() {
  submitError.value = ''
  isSubmitting.value = true
  try {
    const result = await signUp({
      email: email.value.trim(),
      password: password.value,
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim()
    })
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.length
      ? route.query.redirect
      : '/dashboard'

    if (result.session) {
      router.push(redirect)
      return
    }

    router.push(`/auth/login?registered=1&redirect=${encodeURIComponent(redirect)}`)
  } catch (err) {
    submitError.value = err.message || 'Er is een fout opgetreden. Probeer opnieuw.'
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
  margin: 0.35rem 0 1.1rem;
  font-size: 0.92rem;
  color: #667086;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
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

.rule-box {
  margin-top: 0.1rem;
  padding: 0.85rem 0.95rem;
  border-radius: 12px;
  background: #f7f8f6;
  border: 1px solid #dfe4da;
}

.rule-box p {
  margin: 0 0 0.35rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #1f2433;
}

.rule-box ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.2rem;
}

.rule-box li {
  font-size: 0.82rem;
  color: #738092;
}

.rule-box li.ok {
  color: #4e7f31;
}

.error-text {
  margin: -0.2rem 0 0;
  font-size: 0.84rem;
  color: #b63e2e;
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

.auth-primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

  .name-grid {
    grid-template-columns: 1fr;
  }
}
</style>
