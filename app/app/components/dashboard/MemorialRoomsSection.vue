<template>
  <div class="section">
    <!-- Title Card -->
    <Card class="title-card">
      <h2>Herdenkingsruimtes</h2>
      <p class="section-subtitle">Beheer de memorial pagina's die je hebt aangemaakt.</p>
    </Card>

    <!-- Empty State or Rooms List Card -->
    <Card v-if="rooms.length === 0" class="content-card">
      <p class="empty-message">Je hebt nog geen ruimte aangemaakt. Klik de onderstaande knop om aan de slag te gaan.</p>
    </Card>

    <div v-else class="rooms-list">
      <Card v-for="room in rooms" :key="room.id" class="room-card">
        <div class="room-header">
          <h3>{{ room.title }}</h3>
          <div class="room-meta">
            <span class="meta-date">Laatst bewerkt: {{ formatDate(room.lastUpdated) }}</span>
            <span v-if="room.pendingCount > 0" class="meta-status">
              {{ room.pendingCount }} {{ room.pendingCount === 1 ? 'bericht' : 'berichten' }} in afwachting
            </span>
          </div>
        </div>

        <div class="room-actions">
          <NuxtLink class="btn-secondary" :to="`/dashboard/ruimte/${room.id}`">
            <img src="/icons/eye.svg" alt="" class="action-icon" aria-hidden="true" />
            Bekijk Details
          </NuxtLink>
          <NuxtLink class="btn-primary" to="/editor">
            <img src="/icons/edit.svg" alt="" class="action-icon" aria-hidden="true" />
            Open in Editor
          </NuxtLink>
        </div>
      </Card>
    </div>

    <!-- Action Button -->
    <div class="button-wrapper">
      <NuxtLink class="btn-primary btn-large btn-ok-gradient create-room-link" to="/dashboard/new-room">
        <span class="btn-icon">+</span>
        {{ rooms.length === 0 ? 'Nieuwe Ruimte' : 'Nieuwe Ruimte Aankopen' }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from '../ui/Card.vue'

const rooms = ref([
  // Demo rooms - will be replaced with real data
  {
    id: 'room-1',
    title: 'In liefdevolle herinnering aan Maria de Vries',
    lastUpdated: new Date('2025-10-12'),
    pendingCount: 3
  },
  {
    id: 'room-2',
    title: 'In liefdevolle herinnering aan Johannes Bakker',
    lastUpdated: new Date('2025-09-05'),
    pendingCount: 0
  }
])

function formatDate(date) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

</script>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: var(--font-sans);
}

.title-card {
  padding: 1.5rem;
}

.title-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  font-family: var(--font-display);
  color: #1a1a1a;
}

.section-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.content-card {
  padding: 1.5rem;
  text-align: left;
}

.empty-message {
  margin: 0;
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-card {
  padding: 1.35rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.15rem;
}

.room-header {
  flex: 1;
  min-width: 0;
}

.room-header h3 {
  margin: 0 0 0.65rem;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: #1a1a1a;
}

.room-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
}

.meta-date,
.meta-status {
  font-size: 0.82rem;
  color: #8f93a3;
  display: flex;
  align-items: center;
  gap: 0.34rem;
}

.meta-date::before {
  content: '◷';
  font-size: 0.8rem;
  color: #a2a7bc;
}

.meta-status {
  color: #635c32;
  font-weight: 500;
  border: 1px solid #d8ca78;
  border-radius: 8px;
  background: linear-gradient(180deg, #fbf7df 0%, #f7f0c7 100%);
  padding: 0.14rem 0.5rem;
}

.meta-status::before {
  content: '';
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
  background: #2f2d39;
  flex-shrink: 0;
}

.room-actions {
  display: flex;
  width: 100%;
  gap: 0.8rem;
}

/* Button styles */
.btn-primary,
.btn-secondary {
  flex: 1;
  justify-content: center;
  padding: 0.65rem 1rem;
  border-radius: 9px;
  font-size: 0.98rem;
  font-weight: 600;
  font-family: var(--font-display);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-primary {
  border: 1px solid #92a084;
  background: linear-gradient(180deg, #a6b58f 0%, #8b9c77 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(97, 118, 82, 0.22);
}

.btn-primary:hover {
  background: linear-gradient(180deg, #9eae87 0%, #839471 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(97, 118, 82, 0.28);
}

.btn-secondary {
  background: #fbfcfb;
  border: 3px solid #8b9c77;
  color: #292b35;
}

.btn-secondary:hover {
  background: #f8faf7;
  border-color: #7e8f6d;
  color: #1a1a1a;
}

.btn-large {
  padding: 0.875rem 1.5rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-ok-gradient {
  background: var(--ok-gradient, linear-gradient(180deg, #82D14D 0%, #629D3A 100%));
  border: none;
  box-shadow: 0 3px 10px rgba(98, 157, 58, 0.35);
}

.btn-ok-gradient:hover {
  background: var(--ok-gradient, linear-gradient(180deg, #82D14D 0%, #629D3A 100%));
  filter: brightness(0.95);
}

.btn-full-width {
  width: 100%;
}

.button-wrapper {
  display: flex;
  width: 100%;
}

.create-room-link {
  text-decoration: none;
  width: 100%;
}

.btn-icon {
  font-size: 0.92em;
  line-height: 1;
}

.action-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .room-card {
    flex-direction: column;
  }

  .room-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
