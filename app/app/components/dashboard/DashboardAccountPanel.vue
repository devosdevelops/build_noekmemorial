<template>
  <Card class="account-panel">
    <div class="panel-header">
      <IconAccount class="panel-icon" />
      <h2>Accountoverzicht</h2>
    </div>
    <p class="panel-subtitle">Welkom terug,</p>

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

    <nav class="account-nav">
      <button class="nav-button">
        <IconSettings class="nav-icon" />
        Accountinstellingen
      </button>
      <button class="nav-button">
        <IconService class="nav-icon" />
        Klantenservice
      </button>
    </nav>

    <button class="logout-button">Logout</button>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import Card from '../ui/Card.vue'
import IconAccount from '../icons/IconAccount.vue'
import IconSettings from '../icons/IconSettings.vue'
import IconService from '../icons/IconService.vue'

const userName = ref('Jan Jansen')
const userEmail = ref('jan.jansen@voorbeeld.nl')
const subscriptionPrice = ref('€ 45,00')
const roomsUsed = ref(0)
const roomsLimit = ref(1)
</script>

<style scoped>
.account-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.panel-icon {
  width: 24px;
  height: 24px;
  color: #7a9b7e;
}

.panel-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.panel-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #1a1a1a;
  font-weight: 600;
}

.account-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-button:hover {
  background: #f0f0f0;
  color: #1a1a1a;
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.logout-button {
  padding: 0.75rem 1rem;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-button:hover {
  background: #b71c1c;
}
</style>
