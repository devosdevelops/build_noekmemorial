<template>
  <div class="section" :class="{ 'section-busy': isLoading || isPurchasingSlot }">
    <!-- Title Card -->
    <Card class="title-card">
      <h2>Herdenkingsruimtes</h2>
      <p class="section-subtitle">Beheer de memorial pagina's die je hebt aangemaakt.</p>
    </Card>

    <!-- Empty State or Rooms List Card -->
    <Card v-if="isLoading" class="content-card">
      <p class="empty-message">Herdenkingsruimtes worden geladen...</p>
    </Card>

    <Card v-else-if="loadError" class="content-card">
      <p class="empty-message">{{ loadError }}</p>
    </Card>

    <Card v-else-if="rooms.length === 0" class="content-card">
      <p class="empty-message">Je hebt nog geen ruimte aangemaakt. Klik op de knop hieronder om te starten, of laat je toevoegen als samenwerker bij een bestaande ruimte.</p>
    </Card>

    <div v-else class="rooms-group-list">
      <section v-if="ownedRooms.length > 0" class="rooms-group">
        <h3 class="rooms-group-title">Jouw Herdenkingsruimtes</h3>
        <div class="rooms-list">
          <Card v-for="room in ownedRooms" :key="room.id" class="room-card">
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
              <NuxtLink class="btn-primary" :to="`/editor?workspaceId=${room.id}`">
                <img src="/icons/edit.svg" alt="" class="action-icon" aria-hidden="true" />
                Open in Editor
              </NuxtLink>
            </div>
          </Card>
        </div>
      </section>

      <section v-if="collaboratorRooms.length > 0" class="rooms-group">
        <h3 class="rooms-group-title">Ruimtes Waar Je Samenwerkt</h3>
        <div class="rooms-list">
          <Card v-for="room in collaboratorRooms" :key="room.id" class="room-card room-card-collaborator">
            <div class="room-header">
              <h3>{{ room.title }}</h3>
              <div class="room-meta">
                <span class="meta-date">Laatst bewerkt: {{ formatDate(room.lastUpdated) }}</span>
              </div>
            </div>

            <div class="room-actions">
              <NuxtLink class="btn-secondary" :to="`/dashboard/ruimte/${room.id}`">
                <img src="/icons/eye.svg" alt="" class="action-icon" aria-hidden="true" />
                Bekijk Details
              </NuxtLink>
              <NuxtLink class="btn-primary" :to="`/editor?workspaceId=${room.id}`">
                <img src="/icons/edit.svg" alt="" class="action-icon" aria-hidden="true" />
                Open in Editor
              </NuxtLink>
            </div>
          </Card>
        </div>
      </section>
    </div>

    <!-- Action Button -->
    <div class="button-wrapper">
      <NuxtLink
        v-if="hasFreeSlot"
        class="btn-primary btn-large btn-ok-gradient create-room-link"
        to="/dashboard/new-room"
      >
        <span class="btn-icon">+</span>
        {{ ownedRooms.length === 0 ? 'Nieuwe Ruimte' : 'Ruimte Aanmaken' }}
      </NuxtLink>

      <button
        v-else
        type="button"
        class="btn-primary btn-large btn-ok-gradient create-room-link"
        @click="openBuySlotsModal"
      >
        <span class="btn-icon">+</span>
        Nieuwe Ruimte Aankopen
      </button>
    </div>

    <div
      v-if="isBuySlotsModalOpen"
      class="buy-slots-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-slots-modal-title"
      @click.self="closeBuySlotsModal"
    >
      <Card class="buy-slots-modal-card">
        <div class="buy-slots-modal-header">
          <h3 id="buy-slots-modal-title">Extra Ruimte Aankopen</h3>
          <button
            type="button"
            class="buy-slots-modal-close"
            aria-label="Sluiten"
            :disabled="isPurchasingSlot"
            @click="closeBuySlotsModal"
          >
            ×
          </button>
        </div>

        <p class="buy-slots-modal-description">
          Je huidige limiet is bereikt. Voeg 1 extra ruimteslot toe om een nieuwe herdenkingsruimte te kunnen maken.
        </p>

        <div class="buy-slots-summary">
          <div class="buy-slots-row">
            <span>Eenmalige kost</span>
            <strong>{{ formatPrice(upfrontPriceCents) }}</strong>
          </div>
          <div class="buy-slots-row">
            <span>Extra onderhoud per jaar</span>
            <strong>{{ formatPrice(yearlyMaintenancePerSlotCents) }}</strong>
          </div>
          <div class="buy-slots-row">
            <span>Nieuw onderhoud totaal per jaar</span>
            <strong>{{ formatPrice(nextYearlyMaintenanceCents) }}</strong>
          </div>
          <div class="buy-slots-row">
            <span>Ruimtes na aankoop</span>
            <strong>{{ roomsLimit + 1 }}</strong>
          </div>
        </div>

        <p v-if="purchaseError" class="buy-slots-error">{{ purchaseError }}</p>

        <div class="buy-slots-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="isPurchasingSlot"
            @click="closeBuySlotsModal"
          >
            Annuleren
          </button>
          <button
            type="button"
            class="btn-primary btn-ok-gradient"
            :disabled="isPurchasingSlot"
            @click="confirmBuySlot"
          >
            {{ isPurchasingSlot ? 'Aankoop verwerken...' : 'Bevestig Aankoop' }}
          </button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Card from '../ui/Card.vue'
import { useAuth } from '../../composables/useAuth'
import { useDashboardWorkspaces } from '../../composables/useDashboardWorkspaces'

const { appUser, init, addRoomSlots } = useAuth()
const { workspaces: rooms, isLoading, loadError, loadWorkspaces } = useDashboardWorkspaces()
const ownedRooms = computed(() => rooms.value.filter((room) => room.isOwned))
const collaboratorRooms = computed(() => rooms.value.filter((room) => !room.isOwned))
const roomsLimit = computed(() => Number(appUser.value?.rooms_limit ?? 1))
const yearlyMaintenanceCents = computed(() => Number(appUser.value?.maintenance_yearly_price_cents ?? 0))
const hasFreeSlot = computed(() => ownedRooms.value.length < roomsLimit.value)

const upfrontPriceCents = 9900
const yearlyMaintenancePerSlotCents = 1800

const isBuySlotsModalOpen = ref(false)
const isPurchasingSlot = ref(false)
const purchaseError = ref('')

const nextYearlyMaintenanceCents = computed(() => yearlyMaintenanceCents.value + yearlyMaintenancePerSlotCents)

onMounted(async () => {
  await init()
  await loadWorkspaces()
})

function formatDate(date) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function formatPrice(cents) {
  const amount = Number(cents || 0) / 100
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount)
}

function openBuySlotsModal() {
  purchaseError.value = ''
  isBuySlotsModalOpen.value = true
}

function closeBuySlotsModal() {
  if (isPurchasingSlot.value) return
  isBuySlotsModalOpen.value = false
  purchaseError.value = ''
}

async function confirmBuySlot() {
  if (isPurchasingSlot.value) return

  isPurchasingSlot.value = true
  purchaseError.value = ''

  try {
    await addRoomSlots({
      slots: 1,
      yearlyMaintenanceIncreaseCents: yearlyMaintenancePerSlotCents
    })
    isBuySlotsModalOpen.value = false
  } catch (error) {
    purchaseError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Aankoop van extra ruimteslot is mislukt.'
  } finally {
    isPurchasingSlot.value = false
  }
}

</script>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: var(--font-sans);
}

.section-busy,
.section-busy * {
  cursor: wait !important;
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

.rooms-group-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.rooms-group {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.rooms-group-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: #2f3547;
}

.room-card-collaborator {
  border: 1px solid #d7ddd1;
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

.buy-slots-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(19, 24, 34, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  padding: 1rem;
}

.buy-slots-modal-card {
  width: min(100%, 30rem);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.buy-slots-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.buy-slots-modal-header h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2534;
}

.buy-slots-modal-close {
  border: 0;
  background: transparent;
  color: #687089;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.buy-slots-modal-description {
  margin: 0;
  color: #4f576d;
  font-size: 0.92rem;
}

.buy-slots-summary {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  border: 1px solid #d8dde9;
  border-radius: 10px;
  padding: 0.85rem;
  background: #f9fbff;
}

.buy-slots-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
  color: #3d4457;
}

.buy-slots-row strong {
  font-weight: 700;
  color: #1f2534;
}

.buy-slots-error {
  margin: 0;
  border-radius: 8px;
  border: 1px solid #f2b6b6;
  background: #fff2f2;
  color: #a23636;
  font-size: 0.88rem;
  padding: 0.5rem 0.65rem;
}

.buy-slots-actions {
  display: flex;
  gap: 0.7rem;
}

.buy-slots-actions .btn-primary,
.buy-slots-actions .btn-secondary {
  flex: 1;
}

.buy-slots-actions button:disabled,
.buy-slots-modal-close:disabled {
  opacity: 0.62;
  cursor: not-allowed;
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

  .buy-slots-actions {
    flex-direction: column;
  }
}
</style>
