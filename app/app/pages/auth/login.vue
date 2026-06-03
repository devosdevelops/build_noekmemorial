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
            <input id="login-password" v-model="password" type="password" class="auth-input" placeholder="••••••••" />
          </div>

          <button type="submit" class="auth-primary-button">Log in</button>
        </form>

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

definePageMeta({
  layout: false
})

const email = ref('')
const password = ref('')

function submitLogin() {
  // UI-only screen for now.
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
