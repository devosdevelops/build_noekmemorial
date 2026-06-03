<template>
  <section class="entry-gate" role="dialog" aria-modal="true" aria-label="Kies hoe je wilt doorgaan">
    <div class="entry-gate__card">
      <img src="/logo-white.png" alt="Columba" class="entry-gate__logo" />
      <p class="entry-gate__label">Herdenkingsruimte</p>
      <h1 class="entry-gate__title">{{ roomName }}</h1>
      <p class="entry-gate__subtitle">Kies hoe je de ruimte wilt betreden.</p>

      <div class="entry-gate__actions">
        <button type="button" class="entry-gate__button entry-gate__button--secondary" @click="$emit('login')">
          Log in
        </button>
        <button type="button" class="entry-gate__button entry-gate__button--secondary" @click="$emit('signup')">
          Account maken
        </button>
        <button type="button" class="entry-gate__button entry-gate__button--primary" @click="showGuestForm = true">
          Verder als gast
        </button>
      </div>

      <form v-if="showGuestForm" class="entry-gate__guest-form" @submit.prevent="submitGuestName">
        <label for="guest-display-name">Jouw naam in deze ruimte</label>
        <input
          id="guest-display-name"
          v-model="guestDisplayName"
          class="entry-gate__input"
          type="text"
          maxlength="60"
          placeholder="Bijv. Anna"
        />
        <p v-if="guestNameError" class="entry-gate__error">{{ guestNameError }}</p>
        <button type="submit" class="entry-gate__button entry-gate__button--primary">Ruimte betreden</button>
      </form>

      <button
        v-if="isAuthenticated"
        type="button"
        class="entry-gate__continue-auth"
        @click="$emit('continue-auth')"
      >
        Verder als {{ accountLabel }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  roomName: {
    type: String,
    default: 'Herdenkingsruimte'
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  accountLabel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['login', 'signup', 'continue-auth', 'continue-guest'])

const showGuestForm = ref(false)
const guestDisplayName = ref('')
const guestNameError = ref('')

function submitGuestName() {
  const trimmedName = guestDisplayName.value.trim()

  if (!trimmedName.length) {
    guestNameError.value = 'Kies eerst een naam om als gast door te gaan.'
    return
  }

  guestNameError.value = ''
  emit('continue-guest', trimmedName)
}
</script>

<style scoped>
.entry-gate {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(6, 9, 13, 0.62);
  backdrop-filter: blur(8px);
}

.entry-gate__card {
  width: min(30rem, 100%);
  border-radius: 18px;
  padding: 1.25rem;
  background: linear-gradient(160deg, rgba(30, 39, 55, 0.96) 0%, rgba(20, 25, 35, 0.96) 100%);
  border: 1px solid rgba(215, 232, 247, 0.18);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  color: #eff7ff;
}

.entry-gate__logo {
  height: 2.5rem;
  width: auto;
}

.entry-gate__label {
  margin: 0.8rem 0 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(231, 243, 255, 0.75);
}

.entry-gate__title {
  margin: 0.2rem 0;
  font-family: var(--font-display);
  font-size: 1.55rem;
  line-height: 1.2;
}

.entry-gate__subtitle {
  margin: 0 0 1rem;
  color: rgba(231, 243, 255, 0.8);
}

.entry-gate__actions {
  display: grid;
  gap: 0.65rem;
}

.entry-gate__button {
  border: 0;
  border-radius: 12px;
  min-height: 2.7rem;
  padding: 0 0.95rem;
  font-family: var(--font-display);
  font-weight: 600;
  cursor: pointer;
}

.entry-gate__button--secondary {
  background: rgba(230, 241, 252, 0.12);
  color: #eff7ff;
}

.entry-gate__button--primary {
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
}

.entry-gate__guest-form {
  margin-top: 0.8rem;
  display: grid;
  gap: 0.55rem;
}

.entry-gate__guest-form label {
  font-size: 0.87rem;
  color: rgba(231, 243, 255, 0.9);
}

.entry-gate__input {
  border: 1px solid rgba(229, 240, 252, 0.35);
  border-radius: 10px;
  min-height: 2.55rem;
  padding: 0 0.75rem;
  background: rgba(14, 20, 29, 0.65);
  color: #ffffff;
}

.entry-gate__error {
  margin: 0;
  font-size: 0.85rem;
  color: #ffcbc2;
}

.entry-gate__continue-auth {
  margin-top: 0.75rem;
  border: 0;
  background: none;
  padding: 0;
  color: #cee8ff;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
}
</style>
