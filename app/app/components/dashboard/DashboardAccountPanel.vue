<template>
  <div class="account-section">
    <!-- Account Overview Card -->
    <Card class="overview-card">
      <div class="overview-header">
        <div class="overview-icon">
          <IconAccount />
        </div>
        <div class="overview-text">
          <h2>Accountoverzicht</h2>
          <p class="overview-subtitle">Welkom terug,</p>
        </div>
      </div>

      <div class="account-info">
        <div class="info-row">
          <span class="info-label">Naam</span>
          <span class="info-value">{{ userName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail</span>
          <span class="info-value">{{ userEmail }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Onderhoud</span>
          <span class="info-value">{{ subscriptionPrice }}/jaar</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ruimtes</span>
          <span class="info-value">{{ roomsUsed }} van de {{ roomsLimit }}</span>
        </div>
      </div>
    </Card>

    <!-- Settings Card -->
    <Card class="settings-card">
      <button class="settings-button" type="button" @click="isAccountSettingsOpen = true">
        <img src="/icons/SettingsInline.svg" alt="Settings" class="settings-icon" />
        Accountinstellingen
      </button>
      <button class="settings-button" type="button" @click="isSupportPopupOpen = true">
        <img src="/icons/Support.svg" alt="Support" class="settings-icon" />
        Klantenservice
      </button>
    </Card>

    <!-- Logout Button -->
    <button class="logout-button">Logout</button>

    <div
      v-if="isAccountSettingsOpen"
      class="account-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      @click.self="isAccountSettingsOpen = false"
    >
      <div class="account-modal-card">
        <div class="account-modal-header">
          <h2 id="account-modal-title">Mijn Gegevens</h2>
          <button
            type="button"
            class="account-modal-close"
            aria-label="Sluiten"
            @click="isAccountSettingsOpen = false"
          >
            ×
          </button>
        </div>

        <div class="account-modal-field">
          <label for="account-first-name">Naam</label>
          <div class="account-modal-name-row">
            <input id="account-first-name" v-model="accountFirstName" type="text" class="account-modal-input" />
            <input v-model="accountLastName" type="text" class="account-modal-input" />
          </div>
        </div>

        <div class="account-modal-field">
          <label for="account-email">E-mail</label>
          <input id="account-email" v-model="accountEmail" type="email" class="account-modal-input" />
        </div>

        <div class="account-modal-field">
          <label for="account-card">Bankaart</label>
          <input id="account-card" v-model="accountCard" type="text" class="account-modal-input" />
        </div>

        <button type="button" class="account-modal-save" @click="saveAccountSettings">
          Veranderingen Opslaan
        </button>
      </div>
    </div>

    <transition name="save-toast">
      <div v-if="isSaveToastVisible" class="save-toast" role="status" aria-live="polite">
        <span class="save-toast__icon" aria-hidden="true">✓</span>
        <span class="save-toast__text">Veranderingen opgeslagen</span>
      </div>
    </transition>

    <div
      v-if="isSupportPopupOpen"
      class="support-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-popup-title"
      @click.self="isSupportPopupOpen = false"
    >
      <Card class="support-popup-card">
        <div class="support-popup-header">
          <h3 id="support-popup-title">Klantenservice</h3>
          <button
            type="button"
            class="support-popup-close"
            aria-label="Sluiten"
            @click="isSupportPopupOpen = false"
          >
            ×
          </button>
        </div>

        <div class="support-popup-content">
          <p><strong>E-mail:</strong> info@noekmemorial.be</p>
          <p><strong>Bel:</strong> +32 2 555 01 42</p>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue'
import Card from '../ui/Card.vue'
import IconAccount from '../icons/IconAccount.vue'

const userName = ref('Jan Jansen')
const userEmail = ref('jan.jansen@voorbeeld.nl')
const subscriptionPrice = ref('€ 45,00')
const roomsUsed = ref(0)
const roomsLimit = ref(1)

const isAccountSettingsOpen = ref(false)
const accountFirstName = ref('Jan')
const accountLastName = ref('Jansens')
const accountEmail = ref('janjansens@bedrijf.be')
const accountCard = ref('BE123456790')
const isSaveToastVisible = ref(false)
const isSupportPopupOpen = ref(false)

let saveToastTimer = null

function saveAccountSettings() {
  userName.value = `${accountFirstName.value} ${accountLastName.value}`.trim()
  userEmail.value = accountEmail.value
  isAccountSettingsOpen.value = false

  if (saveToastTimer) {
    clearTimeout(saveToastTimer)
  }

  isSaveToastVisible.value = true
  saveToastTimer = setTimeout(() => {
    isSaveToastVisible.value = false
    saveToastTimer = null
  }, 2600)
}

onUnmounted(() => {
  if (saveToastTimer) {
    clearTimeout(saveToastTimer)
  }
})
</script>

<style scoped>
.account-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.overview-card {
  padding: 1.5rem;
}

.overview-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.overview-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(145deg, #f2f5fa 0%, #e8edf4 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a7c8e;
  flex-shrink: 0;
}

.overview-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.overview-text {
  flex: 1;
}

.overview-text h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: #1a1a1a;
}

.overview-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #999;
  font-weight: 400;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #999;
  font-size: 0.875rem;
  font-weight: 500;
}

.info-value {
  color: #1a1a1a;
  font-size: 0.875rem;
  font-weight: 600;
}

.settings-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  justify-content: flex-start;
}

.settings-button:hover {
  background: linear-gradient(180deg, #f8fbf7 0%, #f1f5ef 100%);
  color: #1a1a1a;
}

.settings-icon {
  width: 20px;
  height: 20px;
  color: #7a9b7e;
  flex-shrink: 0;
}

.logout-button {
  padding: 1rem;
  background: var(--danger-gradient, linear-gradient(180deg, #E54E34 0%, #E54E34 50%, #892F1F 100%));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
  width: 100%;
}

.logout-button:hover {
  background: var(--danger-gradient, linear-gradient(180deg, #E54E34 0%, #E54E34 50%, #892F1F 100%));
  filter: brightness(0.95);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(211, 47, 47, 0.4);
}

.account-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 220;
}

.account-modal-card {
  width: min(100%, 640px);
  background: #f6f6f4;
  border-radius: 10px;
  padding: 1.85rem;
  box-shadow: 0 24px 60px rgba(10, 14, 10, 0.25);
}

.account-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.account-modal-header h2 {
  margin: 0;
  color: #232334;
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 700;
}

.account-modal-close {
  border: none;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 8px;
  background: linear-gradient(180deg, #e55a3c 0%, #cf482e 100%);
  color: #ffffff;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
}

.account-modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 1.2rem;
}

.account-modal-field label {
  color: #272736;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}

.account-modal-name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.account-modal-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 12px;
  padding: 0.62rem 1rem;
  background: linear-gradient(180deg, #a5a9b6 0%, #9da2ae 100%);
  color: #ffffff;
  font-size: 0.98rem;
}

.account-modal-input:focus {
  outline: 2px solid rgba(122, 155, 126, 0.45);
  outline-offset: 1px;
}

.account-modal-save {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 0.78rem 1.2rem;
  background: var(--ok-gradient, linear-gradient(180deg, #82D14D 0%, #629D3A 100%));
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.save-toast {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  min-width: min(86vw, 430px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border-radius: 12px;
  padding: 1rem 1.3rem;
  background: var(--ok-gradient, linear-gradient(180deg, #82D14D 0%, #629D3A 100%));
  color: #ffffff;
  box-shadow: 0 18px 34px rgba(52, 90, 34, 0.36);
  z-index: 240;
}

.save-toast__icon {
  font-size: 1.65rem;
  line-height: 1;
  font-weight: 700;
}

.save-toast__text {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
}

.save-toast-enter-active,
.save-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.save-toast-enter-from,
.save-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% + 8px));
}

.support-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 230;
}

.support-popup-card {
  width: min(100%, 460px);
  padding: 1.2rem;
}

.support-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.support-popup-header h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.support-popup-close {
  border: none;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 6px;
  background: linear-gradient(180deg, #e55a3c 0%, #cf482e 100%);
  color: #ffffff;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.support-popup-content p {
  margin: 0.3rem 0;
  color: #4a5161;
  font-size: 0.92rem;
}

@media (max-width: 768px) {
  .account-modal-card {
    padding: 1.25rem;
  }

  .account-modal-header h2 {
    font-size: 1.9rem;
  }

  .account-modal-name-row {
    grid-template-columns: 1fr;
  }

  .save-toast {
    min-width: calc(100vw - 2rem);
  }

  .save-toast__text {
    font-size: 0.9rem;
  }
}
</style>
