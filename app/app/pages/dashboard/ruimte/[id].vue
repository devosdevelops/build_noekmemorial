<template>
  <DashboardLayout :showSidebar="false" :showBackButton="true" backTo="/dashboard" backLabel="Ga terug">
    <div class="room-details-page">
      <section class="top-actions">
        <div class="top-actions-left">
          <NuxtLink class="action-btn action-btn-primary" to="/editor">
            <img src="/icons/edit.svg" alt="" class="btn-icon" aria-hidden="true" />
            Open Ruimte in Editor
          </NuxtLink>

          <button class="action-btn-segmented" type="button">
            <span class="action-segment-icon" aria-hidden="true">
              <img src="/icons/settings_white.svg" alt="" class="btn-icon" />
            </span>
            <span class="action-segment-text">Instelling van Herdenkingsruimte Aanpassen</span>
          </button>
        </div>

        <button class="action-btn-segmented action-btn-url" type="button" @click="copyRoomUrl">
          <span class="action-segment-icon" aria-hidden="true">
            <img src="/icons/copy.svg" alt="" class="btn-icon" />
          </span>
          <span class="action-segment-text">{{ roomUrl }}</span>
        </button>
      </section>

      <div class="details-grid">
        <section class="left-column">
          <Card class="details-card">
            <h2 class="card-title">Ruimte Informatie</h2>
            <div class="info-grid">
              <div>
                <p class="label">Naam van ruimte</p>
                <p class="value">{{ room.title }}</p>
              </div>
              <div>
                <p class="label">Naam overledene</p>
                <p class="value">{{ room.deceasedName }}</p>
              </div>
              <div>
                <p class="label">Beheerd door</p>
                <p class="value">{{ room.owner }}</p>
              </div>
              <div>
                <p class="label">Zichtbaarheid</p>
                <p class="status-chip">Publiek</p>
              </div>
            </div>
            <div class="updated-row">
              <p class="label">Laatst bewerkt</p>
              <p class="value">12 oktober 2025 om 14:30 door {{ room.owner }}</p>
            </div>
          </Card>

          <Card class="details-card moderation-card">
            <div class="card-title-row">
              <h2 class="card-title">Inhoudsmoderatie</h2>
              <span class="pending-chip">4 wachtend</span>
            </div>

            <div class="moderation-list">
              <article v-for="item in moderationItems" :key="item.id" class="moderation-item">
                <div class="item-left">
                  <span class="item-icon" :class="`item-icon-${item.type}`">{{ item.icon }}</span>
                  <div>
                    <p class="item-name">{{ item.name }}</p>
                    <p class="item-meta">{{ item.content }}</p>
                    <p class="item-time">{{ item.time }}</p>
                  </div>
                </div>
                <div class="item-actions">
                  <button type="button" class="mini-btn mini-btn-ok">✓</button>
                  <button type="button" class="mini-btn mini-btn-cancel">×</button>
                </div>
              </article>
            </div>

            <div class="approval-settings">
              <h3>Goedkeuringsinstellingen</h3>
              <label>
                <input v-model="approvalMode" type="radio" value="manual" />
                Handmatige goedkeuring (aanbevolen)
              </label>
              <label>
                <input v-model="approvalMode" type="radio" value="automatic" />
                Automatische goedkeuring
              </label>
            </div>
          </Card>
        </section>

        <aside class="right-column">
          <Card class="details-card">
            <div class="card-title-row">
              <h2 class="card-title">Samenwerkers</h2>
              <button type="button" class="link-action" @click="isCollaboratorModalOpen = true">+ Toevoegen</button>
            </div>
            <div class="collaborators-list">
              <div class="collaborator-item" v-for="person in collaborators" :key="person.id">
                <div class="avatar">{{ person.initials }}</div>
                <div>
                  <p class="item-name">{{ person.name }}</p>
                  <p class="item-time">{{ person.role }}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card class="details-card">
            <h2 class="card-title">Delen & Zichtbaarheid</h2>
            <div class="visibility-row">
              <label><input v-model="visibility" type="radio" value="public" /> Publiek</label>
              <label><input v-model="visibility" type="radio" value="private" /> Afgeschermd</label>
            </div>
            <p class="helper-text">
              Als hij publiek is, kan iedereen de herdenkingsruimte bezoeken die de link heeft.
              Als hij afgeschermd is, kunnen enkel mensen met de pincode of speciale QR code hem bezoeken.
            </p>
            <button class="share-btn" type="button" @click="copyRoomUrl">Kopieer link</button>
            <button class="share-btn" type="button">Stuur via e-mail</button>
            <div v-if="visibility === 'private'" class="pin-field">
              <input
                v-model="roomPinCode"
                :type="isPinHidden ? 'password' : 'text'"
                class="pin-input"
                readonly
                aria-label="Pincode"
              />
              <button
                type="button"
                class="pin-toggle"
                :aria-label="isPinHidden ? 'Toon pincode' : 'Verberg pincode'"
                @click="isPinHidden = !isPinHidden"
              >
                <img :src="isPinHidden ? '/icons/eye_hide.svg' : '/icons/eye.svg'" alt="" aria-hidden="true" />
              </button>
            </div>
            <div class="qr-box" aria-hidden="true">
              <div class="qr-grid"></div>
            </div>
            <button class="download-btn" type="button">Download QR Code</button>
          </Card>

          <Card class="details-card">
            <h2 class="card-title">Recente Activiteit</h2>
            <div class="activity-list">
              <article v-for="item in recentActivityItems" :key="item.id" class="activity-item">
                <span class="activity-icon" :class="`activity-icon--${item.variant}`" aria-hidden="true"></span>
                <div class="activity-copy">
                  <p class="activity-title">{{ item.title }}</p>
                  <p class="activity-time">{{ item.time }}</p>
                </div>
              </article>
            </div>
          </Card>
        </aside>
      </div>

      <div
        v-if="isCollaboratorModalOpen"
        class="collaborator-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collaborator-modal-title"
        @click.self="closeCollaboratorModal"
      >
        <Card class="collaborator-modal-card">
          <div class="collaborator-modal-header">
            <h2 id="collaborator-modal-title">Collaborator Toevoegen</h2>
            <button
              type="button"
              class="collaborator-modal-close"
              aria-label="Sluiten"
              @click="closeCollaboratorModal"
            >
              ×
            </button>
          </div>

          <div class="collaborator-modal-field">
            <label for="collaborator-email">E-mail</label>
            <input
              id="collaborator-email"
              v-model="collaboratorEmail"
              type="email"
              class="collaborator-modal-input"
              placeholder="naam@mail.com"
            />
          </div>

          <button type="button" class="collaborator-modal-submit" @click="sendCollaboratorInvite">
            Verzend Uitnodiging
          </button>
        </Card>
      </div>

      <transition name="copy-toast">
        <div v-if="isCopyToastVisible" class="copy-toast" role="status" aria-live="polite">
          <span class="copy-toast-icon" aria-hidden="true">✓</span>
          <span>Link gekopieerd naar klipbord</span>
        </div>
      </transition>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout.vue'
import Card from '../../../components/ui/Card.vue'

definePageMeta({
  layout: false
})

const route = useRoute()

const roomMap = {
  'room-1': {
    title: 'In liefdevolle herinnering aan Maria de Vries',
    deceasedName: 'Maria de Vries',
    owner: 'Jan Jansen',
    slug: 'jane-doe-herdenking.noek.be'
  },
  'room-2': {
    title: 'In liefdevolle herinnering aan Johannes Bakker',
    deceasedName: 'Johannes Bakker',
    owner: 'Jan Jansen',
    slug: 'johannes-bakker-herdenking.noek.be'
  }
}

const room = computed(() => roomMap[route.params.id] || roomMap['room-1'])
const roomUrl = computed(() => `https://${room.value.slug}`)

const visibility = ref('public')
const approvalMode = ref('manual')
const roomPinCode = ref('8391')
const isPinHidden = ref(true)
const isCollaboratorModalOpen = ref(false)
const collaboratorEmail = ref('')
const isCopyToastVisible = ref(false)

let copyToastTimer = null

const collaborators = ref([
  { id: 1, initials: 'J', name: 'Jan Jansen', role: 'Eigenaar' },
  { id: 2, initials: 'S', name: 'Sophie de Boer', role: 'Beheerder' }
])

const moderationItems = ref([
  { id: 1, name: 'Anna Bakker', content: 'Condoleance bericht', time: '2 uur geleden', type: 'message', icon: '💬' },
  { id: 2, name: 'Pieter de Vries', content: 'Foto toegevoegd', time: '5 uur geleden', type: 'photo', icon: '🖼' },
  { id: 3, name: 'Lotte Veenstra', content: 'Geluidspost toegevoegd', time: '1 dag geleden', type: 'audio', icon: '♪' },
  { id: 4, name: 'Daan Meijer', content: 'Video herinnering', time: '2 dagen geleden', type: 'video', icon: '▶' }
])

const recentActivityItems = ref([
  { id: 1, title: 'Anna liet een bericht achter', time: '2 uur geleden', variant: 'message' },
  { id: 2, title: '12 mensen brandden een kaarsje', time: 'Afgelopen maand', variant: 'candle' },
  { id: 3, title: '45 mensen reageerden', time: 'Afgelopen maand', variant: 'heart' }
])

function copyRoomUrl() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(roomUrl.value)
    triggerCopyToast()
  }
}

function triggerCopyToast() {
  if (copyToastTimer) {
    clearTimeout(copyToastTimer)
  }

  isCopyToastVisible.value = true
  copyToastTimer = setTimeout(() => {
    isCopyToastVisible.value = false
    copyToastTimer = null
  }, 2200)
}

function closeCollaboratorModal() {
  isCollaboratorModalOpen.value = false
}

function sendCollaboratorInvite() {
  if (!collaboratorEmail.value.trim()) {
    return
  }

  closeCollaboratorModal()
  collaboratorEmail.value = ''
}

onUnmounted(() => {
  if (copyToastTimer) {
    clearTimeout(copyToastTimer)
  }
})
</script>

<style scoped>
.room-details-page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-actions {
  display: grid;
  grid-template-columns: 5fr 3fr;
  gap: 0.75rem;
}

.top-actions-left {
  display: grid;
  grid-template-columns: 1.15fr 2fr;
  gap: 0.75rem;
}

.action-btn {
  border-radius: 8px;
  min-height: 2.55rem;
  padding: 0.5rem 0.8rem;
  border: none;
  font-size: 0.92rem;
  font-weight: 600;
  font-family: var(--font-sans);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  text-decoration: none;
  color: #ffffff;
  background: var(--ok-gradient, linear-gradient(180deg, #82d14d 0%, #629d3a 100%));
  box-shadow: 0 2px 6px rgba(89, 130, 51, 0.28);
}

.action-btn-primary {
  justify-content: center;
}

.action-btn-segmented {
  min-height: 2.55rem;
  border: 4px solid #909f7a;
  border-radius: 14px;
  background: #ffffff;
  padding: 0;
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  font-family: var(--font-display);
  text-align: left;
  color: #1d2030;
  width: 100%;
}

.action-segment-icon {
  width: 3.1rem;
  background: linear-gradient(180deg, #a1ae88 0%, #8f9c7a 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-segment-text {
  flex: 1;
  display: inline-flex;
  align-items: center;
  padding: 0 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1c1f2e;
  white-space: nowrap;
}

.action-btn-url .action-segment-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.action-btn-primary .btn-icon {
  filter: brightness(0) invert(1);
}

.details-grid {
  display: grid;
  grid-template-columns: 5fr 3fr;
  gap: 1rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.details-card {
  padding: 0.85rem;
}

.card-title {
  margin: 0 0 0.7rem;
  font-size: 1.03rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: #1f2433;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem 1rem;
  margin-bottom: 0.75rem;
}

.label {
  margin: 0 0 0.1rem;
  font-size: 0.74rem;
  color: #687086;
}

.value {
  margin: 0;
  font-size: 0.89rem;
  color: #1f2533;
  font-weight: 600;
}

.status-chip {
  margin: 0;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #387145;
  background: #dff3e4;
}

.updated-row {
  border-top: 1px solid #e6e9e3;
  padding-top: 0.55rem;
}

.pending-chip {
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  background: #f8d78e;
  color: #6d4e12;
  font-size: 0.65rem;
  font-weight: 700;
}

.moderation-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.moderation-item {
  border: 1px solid #e1e5dd;
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-icon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #273041;
}

.item-icon-message {
  background: #dff3e4;
}

.item-icon-photo {
  background: #deebff;
}

.item-icon-audio {
  background: #ffeecf;
}

.item-icon-video {
  background: #efe3ff;
}

.item-name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1f2433;
}

.item-meta,
.item-time {
  margin: 0;
  font-size: 0.7rem;
  color: #71798d;
}

.item-actions {
  display: flex;
  gap: 0.35rem;
}

.mini-btn {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 5px;
  border: 1px solid #e4e8e1;
  background: #fff;
  cursor: pointer;
}

.mini-btn-ok {
  color: #78b352;
}

.mini-btn-cancel {
  color: #dd7057;
}

.approval-settings {
  margin-top: 0.75rem;
  border-top: 1px solid #e6e9e3;
  padding-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.approval-settings h3 {
  margin: 0 0 0.3rem;
  font-size: 0.76rem;
  color: #1f2433;
}

.approval-settings label,
.visibility-row label {
  font-size: 0.84rem;
  color: #1f2533;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.approval-settings input,
.visibility-row input {
  accent-color: #9189c7;
}

.link-action {
  border: none;
  background: transparent;
  color: #6fb63e;
  font-size: 0.75rem;
  cursor: pointer;
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.collaborator-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
}

.avatar {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 6px;
  background: #dfe6f0;
  color: #6b7489;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.visibility-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.45rem;
}

.helper-text {
  margin: 0 0 0.6rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #5c657b;
}

.share-btn {
  width: 100%;
  border: 1px solid #d1d7cf;
  border-radius: 7px;
  background: #fafcf9;
  color: #364055;
  font-size: 0.8rem;
  padding: 0.42rem 0.6rem;
  margin-bottom: 0.45rem;
}

.pin-field {
  margin: 0.15rem 0 0.55rem;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.4rem;
}

.pin-input {
  width: 100%;
  border: 1px solid #d1d7cf;
  border-radius: 7px;
  background: #fafcf9;
  color: #364055;
  font-size: 0.8rem;
  padding: 0.45rem 0.6rem;
  box-sizing: border-box;
}

.pin-toggle {
  width: 2rem;
  height: 2rem;
  border: 1px solid #d1d7cf;
  border-radius: 7px;
  background: #fafcf9;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pin-toggle img {
  width: 1rem;
  height: 1rem;
}

.qr-box {
  display: flex;
  justify-content: center;
  margin: 0.25rem 0 0.6rem;
}

.qr-grid {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #d5dbd2;
  background:
    linear-gradient(90deg, #10131a 10px, transparent 10px) 0 0/20px 20px,
    linear-gradient(#10131a 10px, transparent 10px) 0 0/20px 20px,
    #fff;
}

.download-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 0.62rem;
  background: linear-gradient(180deg, #a6b58f 0%, #8b9c77 100%);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 600;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.activity-icon {
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  position: relative;
}

.activity-icon--message {
  background: #e4f2df;
  color: #7d9663;
}

.activity-icon--candle {
  background: #ffe7bf;
}

.activity-icon--heart {
  background: #edf0e8;
}

.activity-icon--message::before {
  content: '';
  width: 0.58rem;
  height: 0.42rem;
  border: 1.5px solid currentColor;
  border-radius: 0.16rem;
  position: absolute;
  top: 0.36rem;
  left: 0.32rem;
  background: transparent;
}

.activity-icon--message::after {
  content: '';
  width: 0.22rem;
  height: 0.22rem;
  border-left: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  position: absolute;
  bottom: 0.18rem;
  left: 0.28rem;
  transform: rotate(45deg);
  background: #e4f2df;
}

.activity-icon--candle::before {
  content: '';
  width: 0.3rem;
  height: 0.82rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #ff8a00 0%, #f26e00 100%);
}

.activity-icon--heart::before {
  content: '♡';
  color: #8b9b77;
  font-size: 0.96rem;
  font-weight: 700;
}

.activity-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.activity-title {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 600;
  color: #2c3850;
  line-height: 1.25;
}

.activity-time {
  margin: 0;
  font-size: 0.77rem;
  color: #9aa9c6;
  line-height: 1.2;
}

.collaborator-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(23, 28, 23, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 250;
}

.collaborator-modal-card {
  width: min(100%, 470px);
  padding: 1.65rem 1.8rem;
}

.collaborator-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.collaborator-modal-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: #232635;
}

.collaborator-modal-close {
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

.collaborator-modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1.1rem;
}

.collaborator-modal-field label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2433;
}

.collaborator-modal-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 10px;
  padding: 0.56rem 0.7rem;
  background: linear-gradient(180deg, #a6abb8 0%, #9ba0ad 100%);
  color: #ffffff;
  font-size: 0.92rem;
}

.collaborator-modal-input::placeholder {
  color: #e7ebf3;
}

.collaborator-modal-submit {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 0.72rem 1rem;
  background: var(--ok-gradient, linear-gradient(180deg, #82d14d 0%, #629d3a 100%));
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  cursor: pointer;
}

.copy-toast {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  min-width: min(88vw, 650px);
  border-radius: 12px;
  padding: 1.15rem 1.4rem;
  background: var(--ok-gradient, linear-gradient(180deg, #82d14d 0%, #629d3a 100%));
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 0.96rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  z-index: 260;
  box-shadow: 0 22px 36px rgba(44, 78, 29, 0.35);
}

.copy-toast-icon {
  font-size: 2rem;
  line-height: 1;
}

.copy-toast-enter-active,
.copy-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.copy-toast-enter-from,
.copy-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% + 8px));
}

@media (max-width: 980px) {
  .top-actions {
    grid-template-columns: 1fr;
  }

  .top-actions-left {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .copy-toast {
    min-width: calc(100vw - 1.5rem);
    font-size: 0.86rem;
    padding: 0.9rem 1rem;
  }

  .copy-toast-icon {
    font-size: 1.5rem;
  }
}
</style>
