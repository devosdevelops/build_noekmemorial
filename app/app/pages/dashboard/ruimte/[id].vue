<template>
  <DashboardLayout :showSidebar="false" :showBackButton="true" backTo="/dashboard" backLabel="Ga terug">
    <div class="room-details-page">
      <Card v-if="isLoading" class="details-card room-state-card">
        <p class="room-state-title">Herdenkingsruimte laden...</p>
        <p class="room-state-text">Even geduld terwijl we de workspace uit Supabase ophalen.</p>
      </Card>

      <Card v-else-if="roomErrorMessage" class="details-card room-state-card">
        <p class="room-state-title">Kon de herdenkingsruimte niet laden</p>
        <p class="room-state-text">{{ roomErrorMessage }}</p>
        <button type="button" class="share-btn room-state-action" @click="refreshRoom">Opnieuw proberen</button>
      </Card>

      <Card v-else-if="!room" class="details-card room-state-card">
        <p class="room-state-title">Herdenkingsruimte niet gevonden</p>
        <p class="room-state-text">Deze ruimte bestaat niet of je hebt er geen toegang toe.</p>
        <NuxtLink class="share-btn room-state-action room-state-link" to="/dashboard">Terug naar dashboard</NuxtLink>
      </Card>

      <template v-else>
        <section class="top-actions">
          <div class="top-actions-left">
            <NuxtLink class="action-btn action-btn-primary" :to="`/editor?workspaceId=${room.id}`">
              <img src="/icons/edit.svg" alt="" class="btn-icon" aria-hidden="true" />
              Open Ruimte in Editor
            </NuxtLink>

            <button class="action-btn-segmented" type="button" @click="openRoomSettings">
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
                  <p class="status-chip">{{ room.visibilityLabel }}</p>
                </div>
              </div>
              <div class="updated-row">
                <p class="label">Laatst bewerkt</p>
                <p class="value">{{ room.updatedAtLabel }} door {{ room.owner }}</p>
              </div>
            </Card>

            <Card class="details-card moderation-card">
              <div class="card-title-row">
                <h2 class="card-title">Inhoudsmoderatie</h2>
                <span class="pending-chip">0 wachtend</span>
              </div>

              <p class="empty-message empty-message-compact">Er staan nog geen bijdragen klaar voor moderatie.</p>

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

              <div v-if="ownerPerson" class="collaborator-item collaborator-item-owner">
                <div class="avatar">{{ ownerPerson.initials }}</div>
                <div>
                  <p class="item-name">{{ ownerPerson.name }}</p>
                  <p class="item-time">Eigenaar</p>
                </div>
              </div>

              <p v-if="collaborators.length === 0" class="empty-message empty-message-compact">
                Er zijn nog geen samenwerkers toegevoegd.
              </p>

              <div v-else class="collaborators-list">
                <div class="collaborator-item" v-for="person in collaborators" :key="person.id">
                  <div class="avatar">{{ person.initials }}</div>
                  <div>
                    <p class="item-name">{{ person.name }}</p>
                    <p class="item-time">{{ collaboratorRoleLabel(person.role) }}</p>
                  </div>
                  <button
                    type="button"
                    class="collaborator-remove"
                    :disabled="isRemovingCollaboratorId === person.id"
                    @click="removeCollaborator(person)"
                  >
                    {{ isRemovingCollaboratorId === person.id ? 'Bezig...' : 'Verwijder' }}
                  </button>
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
              <p class="empty-message empty-message-compact">Er is nog geen recente activiteit beschikbaar.</p>
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

            <p v-if="collaboratorError" class="helper-text collaborator-feedback collaborator-feedback-error">
              {{ collaboratorError }}
            </p>
            <p v-if="collaboratorSuccess" class="helper-text collaborator-feedback collaborator-feedback-success">
              {{ collaboratorSuccess }}
            </p>

            <button
              type="button"
              class="collaborator-modal-submit"
              :disabled="isInvitingCollaborator"
              @click="sendCollaboratorInvite"
            >
              {{ isInvitingCollaborator ? 'Bezig...' : 'Verzend Uitnodiging' }}
            </button>
          </Card>
        </div>

        <div
          v-if="isRoomSettingsOpen"
          class="room-settings-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-settings-title"
          @click.self="closeRoomSettings"
        >
          <Card class="room-settings-card">
            <div class="room-settings-header">
              <h2 id="room-settings-title">Ruimte Instellingen</h2>
              <button
                type="button"
                class="room-settings-close"
                aria-label="Sluiten"
                @click="closeRoomSettings"
              >
                ×
              </button>
            </div>

            <div class="room-settings-field">
              <label for="room-settings-name">Naam van Ruimte</label>
              <input id="room-settings-name" v-model="roomSettingsName" type="text" class="room-settings-input" />
            </div>

            <div class="room-settings-field">
              <label>Naam Overledene</label>
              <div class="room-settings-name-row">
                <input v-model="roomSettingsFirstName" type="text" class="room-settings-input" />
                <input v-model="roomSettingsLastName" type="text" class="room-settings-input" />
              </div>
            </div>

            <div class="room-settings-field">
              <label class="room-settings-section-title">Zichtbaarheids Instellingen</label>
              <div class="room-settings-radio-row">
                <label class="room-settings-radio-item">
                  <input v-model="roomSettingsVisibility" type="radio" value="public" />
                  <span>Publiek</span>
                </label>
                <label class="room-settings-radio-item">
                  <input v-model="roomSettingsVisibility" type="radio" value="private" />
                  <span>Afgeschermd</span>
                </label>
              </div>
            </div>

            <div class="room-settings-field">
              <label class="room-settings-section-title">Bijdrage goedkeuringsinstellingen</label>
              <div class="room-settings-radio-stack">
                <label class="room-settings-radio-item">
                  <input v-model="roomSettingsApprovalMode" type="radio" value="manual" />
                  <span>Handmatige goedkeuring (aanbevolen)</span>
                </label>
                <label class="room-settings-radio-item">
                  <input v-model="roomSettingsApprovalMode" type="radio" value="automatic" />
                  <span>Automatische goedkeuring</span>
                </label>
              </div>
            </div>

            <p v-if="saveError" class="helper-text">{{ saveError }}</p>

            <button type="button" class="room-settings-save" :disabled="isSavingRoomSettings" @click="saveRoomSettings">
              {{ isSavingRoomSettings ? 'Bezig...' : 'Veranderingen Opslaan' }}
            </button>
          </Card>
        </div>

        <transition name="copy-toast">
          <div v-if="isCopyToastVisible" class="copy-toast" role="status" aria-live="polite">
            <span class="copy-toast-icon" aria-hidden="true">✓</span>
            <span>Link gekopieerd naar klipbord</span>
          </div>
        </transition>

        <transition name="save-toast">
          <div v-if="isSaveToastVisible" class="save-toast" role="status" aria-live="polite">
            <span class="save-toast-icon" aria-hidden="true">✓</span>
            <span>Veranderingen opgeslagen</span>
          </div>
        </transition>

        <transition name="invite-toast">
          <div v-if="isInviteToastVisible" class="invite-toast" role="status" aria-live="polite">
            <span class="invite-toast-icon" aria-hidden="true">!</span>
            <span>{{ inviteToastMessage }}</span>
          </div>
        </transition>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout.vue'
import Card from '../../../components/ui/Card.vue'
import { useAuth } from '../../../composables/useAuth'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const { init, session } = useAuth()

const workspaceId = computed(() => {
  const value = route.params.id
  return Array.isArray(value) ? value[0] : value
})

const {
  data: roomResponse,
  pending: isLoading,
  error: roomError,
  refresh: refreshRoom
} = await useAsyncData(
  () => `workspace-detail-${workspaceId.value || 'missing'}`,
  async () => {
    if (!workspaceId.value) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Werkruimte-ID ontbreekt.'
      })
    }

    return await $fetch(`/api/workspaces/${workspaceId.value}`)
  },
  {
    watch: [workspaceId]
  }
)

await init()

const roomErrorMessage = computed(() => {
  const error = roomError.value

  if (!error) return ''
  if (error?.statusCode === 404 || error?.status === 404) {
    return 'Deze herdenkingsruimte kon niet worden gevonden.'
  }

  return error?.data?.statusMessage || error?.statusMessage || error?.message || 'De herdenkingsruimte kon niet worden geladen.'
})

const workspace = computed(() => roomResponse.value?.workspace ?? null)
const owner = computed(() => roomResponse.value?.owner ?? null)

function formatDisplayName(firstName, lastName, fallback = 'Onbekend') {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || fallback
}

function formatDateTime(dateValue) {
  if (!dateValue) return 'Onbekend'

  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateValue))
}

const room = computed(() => {
  if (!workspace.value) return null

  const deceasedName = formatDisplayName(
    workspace.value.deceased_first_name,
    workspace.value.deceased_last_name,
    workspace.value.name
  )

  return {
    id: workspace.value.id,
    title: workspace.value.name || `In liefdevolle herinnering aan ${deceasedName}`,
    deceasedName,
    owner: formatDisplayName(owner.value?.first_name, owner.value?.last_name, owner.value?.email),
    slug: workspace.value.slug,
    visibility: workspace.value.visibility,
    visibilityLabel: workspace.value.visibility === 'private' ? 'Afgeschermd' : 'Publiek',
    approvalMode: workspace.value.approval_mode,
    accessPin: workspace.value.access_pin,
    updatedAtLabel: formatDateTime(workspace.value.updated_at)
  }
})

const roomUrl = computed(() => (room.value?.slug ? `https://${room.value.slug}` : '—'))
const collaborators = computed(() => roomResponse.value?.collaborators ?? [])

const ownerPerson = computed(() => {
  if (!owner.value) return null

  const name = formatDisplayName(owner.value.first_name, owner.value.last_name, owner.value.email)
  const source = name || owner.value.email || 'E'

  return {
    id: owner.value.id,
    name,
    initials: source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || source.slice(0, 2).toUpperCase()
  }
})

const visibility = ref('public')
const approvalMode = ref('manual')
const isRoomSettingsOpen = ref(false)
const roomSettingsName = ref('')
const roomSettingsFirstName = ref('')
const roomSettingsLastName = ref('')
const roomSettingsVisibility = ref('public')
const roomSettingsApprovalMode = ref('manual')
const roomPinCode = ref('')
const isPinHidden = ref(true)
const isCollaboratorModalOpen = ref(false)
const collaboratorEmail = ref('')
const collaboratorError = ref('')
const collaboratorSuccess = ref('')
const isInvitingCollaborator = ref(false)
const isRemovingCollaboratorId = ref('')
const isInviteToastVisible = ref(false)
const inviteToastMessage = ref('')
const isCopyToastVisible = ref(false)
const isSaveToastVisible = ref(false)
const isSavingRoomSettings = ref(false)
const saveError = ref('')

let copyToastTimer = null
let saveToastTimer = null
let inviteToastTimer = null

watch(
  room,
  (nextRoom) => {
    if (!nextRoom) return

    visibility.value = nextRoom.visibility
    approvalMode.value = nextRoom.approvalMode
    roomSettingsName.value = workspace.value?.name || nextRoom.title
    roomSettingsFirstName.value = workspace.value?.deceased_first_name || ''
    roomSettingsLastName.value = workspace.value?.deceased_last_name || ''
    roomSettingsVisibility.value = nextRoom.visibility
    roomSettingsApprovalMode.value = nextRoom.approvalMode
    roomPinCode.value = nextRoom.accessPin || ''
  },
  { immediate: true }
)

function openRoomSettings() {
  if (!room.value) return

  roomSettingsName.value = workspace.value?.name || room.value.title
  roomSettingsFirstName.value = workspace.value?.deceased_first_name || ''
  roomSettingsLastName.value = workspace.value?.deceased_last_name || ''
  roomSettingsVisibility.value = visibility.value
  roomSettingsApprovalMode.value = approvalMode.value
  saveError.value = ''
  isRoomSettingsOpen.value = true
}

function copyRoomUrl() {
  if (typeof navigator !== 'undefined' && navigator.clipboard && roomUrl.value && roomUrl.value !== '—') {
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
  collaboratorError.value = ''
  collaboratorSuccess.value = ''
}

function triggerInviteWarningToast(message) {
  inviteToastMessage.value = message

  if (inviteToastTimer) {
    clearTimeout(inviteToastTimer)
  }

  isInviteToastVisible.value = true
  inviteToastTimer = setTimeout(() => {
    isInviteToastVisible.value = false
    inviteToastTimer = null
  }, 3000)
}

function closeRoomSettings() {
  isRoomSettingsOpen.value = false
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function collaboratorRoleLabel(role) {
  if (role === 'collaborator') return 'Samenwerker'
  return role || 'Samenwerker'
}

async function sendCollaboratorInvite() {
  collaboratorError.value = ''
  collaboratorSuccess.value = ''

  const email = collaboratorEmail.value.trim().toLowerCase()
  if (!email) {
    collaboratorError.value = 'Geef een e-mailadres op.'
    return
  }

  if (!isValidEmail(email)) {
    collaboratorError.value = 'Geef een geldig e-mailadres op.'
    return
  }

  const accessToken = session.value?.access_token
  if (!accessToken) {
    collaboratorError.value = 'Je sessie is verlopen. Log opnieuw in.'
    return
  }

  isInvitingCollaborator.value = true

  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/invite`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      body: {
        email
      }
    })

    collaboratorSuccess.value = 'Uitnodiging verstuurd en collaborator toegevoegd.'
    collaboratorEmail.value = ''
    await refreshRoom()
  } catch (error) {
    collaboratorError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Uitnodiging versturen is mislukt.'
    triggerInviteWarningToast(collaboratorError.value)
  } finally {
    isInvitingCollaborator.value = false
  }
}

async function removeCollaborator(person) {
  if (!person?.id || !workspaceId.value) {
    return
  }

  const confirmed = typeof window === 'undefined'
    ? true
    : window.confirm(`Wil je ${person.name || 'deze collaborator'} verwijderen?`)

  if (!confirmed) {
    return
  }

  const accessToken = session.value?.access_token
  if (!accessToken) {
    const message = 'Je sessie is verlopen. Log opnieuw in.'
    collaboratorError.value = message
    triggerInviteWarningToast(message)
    return
  }

  collaboratorError.value = ''
  collaboratorSuccess.value = ''
  isRemovingCollaboratorId.value = person.id

  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/collaborators/${person.id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    collaboratorSuccess.value = `${person.name || 'Collaborator'} werd verwijderd.`
    await refreshRoom()
  } catch (error) {
    collaboratorError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Collaborator verwijderen is mislukt.'
    triggerInviteWarningToast(collaboratorError.value)
  } finally {
    isRemovingCollaboratorId.value = ''
  }
}

async function saveRoomSettings() {
  if (!workspaceId.value) return

  saveError.value = ''
  isSavingRoomSettings.value = true

  try {
    const response = await $fetch(`/api/workspaces/${workspaceId.value}`, {
      method: 'PUT',
      body: {
        name: roomSettingsName.value.trim(),
        deceasedFirstName: roomSettingsFirstName.value.trim(),
        deceasedLastName: roomSettingsLastName.value.trim(),
        visibility: roomSettingsVisibility.value,
        approvalMode: roomSettingsApprovalMode.value
      }
    })

    roomResponse.value = response
    closeRoomSettings()
    triggerSaveToast()
  } catch (error) {
    saveError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Opslaan van de herdenkingsruimte is mislukt.'
  } finally {
    isSavingRoomSettings.value = false
  }
}

function triggerSaveToast() {
  if (saveToastTimer) {
    clearTimeout(saveToastTimer)
  }

  isSaveToastVisible.value = true
  saveToastTimer = setTimeout(() => {
    isSaveToastVisible.value = false
    saveToastTimer = null
  }, 2200)
}

onUnmounted(() => {
  if (copyToastTimer) {
    clearTimeout(copyToastTimer)
  }

  if (saveToastTimer) {
    clearTimeout(saveToastTimer)
  }

  if (inviteToastTimer) {
    clearTimeout(inviteToastTimer)
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

.room-state-card {
  max-width: 780px;
  margin: 0 auto;
}

.room-state-title {
  margin: 0 0 0.45rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2433;
}

.room-state-text {
  margin: 0;
  font-size: 0.9rem;
  color: #5c657b;
}

.room-state-action {
  margin-top: 0.8rem;
  margin-bottom: 0;
}

.room-state-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.collaborator-item-owner {
  padding-bottom: 0.55rem;
  margin-bottom: 0.35rem;
  border-bottom: 1px solid #e6e9e3;
}

.collaborator-remove {
  margin-left: auto;
  border: 1px solid #e3c4bc;
  border-radius: 7px;
  background: #fff8f6;
  color: #b44b3a;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.28rem 0.52rem;
  cursor: pointer;
}

.collaborator-remove:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.empty-message {
  margin: 0;
  color: #5c657b;
}

.empty-message-compact {
  font-size: 0.8rem;
  line-height: 1.4;
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

.collaborator-feedback {
  margin-bottom: 0.8rem;
}

.collaborator-feedback-error {
  color: #b53d2c;
}

.collaborator-feedback-success {
  color: #3f7b2d;
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

.collaborator-modal-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.save-toast {
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

.save-toast-icon {
  font-size: 2rem;
  line-height: 1;
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

.invite-toast {
  position: fixed;
  left: 50%;
  top: calc(50% + 84px);
  transform: translate(-50%, -50%);
  min-width: min(88vw, 650px);
  border-radius: 12px;
  padding: 1rem 1.2rem;
  background: linear-gradient(180deg, #f4bf57 0%, #d79a2f 100%);
  color: #3b2b0d;
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  z-index: 261;
  box-shadow: 0 16px 28px rgba(119, 84, 20, 0.28);
}

.invite-toast-icon {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  background: rgba(59, 43, 13, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  line-height: 1;
}

.invite-toast-enter-active,
.invite-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.invite-toast-enter-from,
.invite-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% + 8px));
}

.room-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(24, 24, 22, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 255;
}

.room-settings-card {
  width: min(100%, 760px);
  padding: 1.7rem 1.85rem 1.75rem;
  border-radius: 14px;
}

.room-settings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
}

.room-settings-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2.05rem;
  font-weight: 700;
  color: #232635;
}

.room-settings-close {
  border: none;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 7px;
  background: linear-gradient(180deg, #e55a3c 0%, #cf482e 100%);
  color: #ffffff;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.room-settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
}

.room-settings-field label,
.room-settings-section-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: #232635;
}

.room-settings-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 13px;
  padding: 0.72rem 1rem;
  background: #aeb1bb;
  color: #ffffff;
  font-size: 0.95rem;
}

.room-settings-name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.room-settings-radio-row {
  display: flex;
  gap: 1.8rem;
  margin-top: 0.1rem;
}

.room-settings-radio-stack {
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  margin-top: 0.1rem;
}

.room-settings-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #26293a;
}

.room-settings-radio-item input {
  accent-color: #8b86c9;
}

.room-settings-help-text {
  margin: 0.65rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #3d4353;
}

.room-settings-save {
  width: 100%;
  border: none;
  border-radius: 13px;
  padding: 0.95rem 1rem;
  background: var(--ok-gradient, linear-gradient(180deg, #82d14d 0%, #629d3a 100%));
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(98, 157, 58, 0.28);
}

.room-settings-save:hover {
  filter: brightness(0.98);
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

  .room-settings-card {
    width: min(100%, 620px);
    padding: 1.3rem;
  }

  .room-settings-header h2 {
    font-size: 1.7rem;
  }

  .room-settings-name-row {
    grid-template-columns: 1fr;
  }

  .room-settings-radio-row {
    gap: 1.1rem;
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
