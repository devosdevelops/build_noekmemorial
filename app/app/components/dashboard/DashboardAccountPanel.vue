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
      <button class="settings-button">
        <img src="/icons/SettingsInline.svg" alt="Settings" class="settings-icon" />
        Accountinstellingen
      </button>
      <button class="settings-button">
        <img src="/icons/Support.svg" alt="Support" class="settings-icon" />
        Klantenservice
      </button>
    </Card>

    <!-- Logout Button -->
    <button class="logout-button">Logout</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from '../ui/Card.vue'
import IconAccount from '../icons/IconAccount.vue'

const userName = ref('Jan Jansen')
const userEmail = ref('jan.jansen@voorbeeld.nl')
const subscriptionPrice = ref('€ 45,00')
const roomsUsed = ref(0)
const roomsLimit = ref(1)
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
</style>
