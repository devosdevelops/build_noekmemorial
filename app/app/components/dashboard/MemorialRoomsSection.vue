<template>
  <div class="section">
    <div class="section-header">
      <div>
        <h2>Herdenkingsruimtes</h2>
        <p class="section-subtitle">Beheer de memorial pagina's die je hebt aangemaakt.</p>
      </div>
    </div>

    <div v-if="rooms.length === 0" class="empty-state">
      <p class="empty-message">Je hebt nog geen ruimte aangemaakt. Klik de onderstaande knop om aan de slag te gaan.</p>
      <button class="btn-primary btn-large">
        <span class="btn-icon">+</span>
        Nieuwe Ruimte
      </button>
    </div>

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
          <button class="btn-secondary">
            <span class="btn-icon">👁️</span>
            Bekijk Details
          </button>
          <button class="btn-primary">
            <span class="btn-icon">✏️</span>
            Open in Editor
          </button>
        </div>
      </Card>

      <button class="btn-primary btn-large btn-full-width">
        <span class="btn-icon">+</span>
        Nieuwe Ruimte Aankopen
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from '../ui/Card.vue'

const rooms = ref([
  // Demo rooms - will be replaced with real data
  // {
  //   id: 'room-1',
  //   title: 'In liefdevolle herinnering aan Maria de Vries',
  //   lastUpdated: new Date('2025-10-12'),
  //   pendingCount: 3
  // }
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
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-message {
  margin: 0;
  font-size: 0.95rem;
  color: #666;
  max-width: 400px;
  line-height: 1.5;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.room-header {
  flex: 1;
  min-width: 0;
}

.room-header h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}

.room-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-date,
.meta-status {
  font-size: 0.8rem;
  color: #999;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.meta-status {
  color: #7a9b7e;
  font-weight: 500;
}

.meta-status::before {
  content: '●';
  font-size: 0.6rem;
}

.room-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Button styles */
.btn-primary,
.btn-secondary {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.btn-primary {
  background: #7a9b7e;
  color: white;
}

.btn-primary:hover {
  background: #6b8a6f;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(122, 155, 126, 0.3);
}

.btn-secondary {
  background: transparent;
  border: 1.5px solid #999;
  color: #666;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #666;
  color: #1a1a1a;
}

.btn-large {
  padding: 0.875rem 1.5rem;
  font-size: 0.95rem;
  width: 100%;
  justify-content: center;
}

.btn-full-width {
  width: 100%;
}

.btn-icon {
  font-size: 1.1em;
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
