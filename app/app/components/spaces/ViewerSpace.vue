<template>
  <section class="viewer-space">
    <ViewerSceneViewport
      v-if="hasEnteredViewer"
      :active-mode="activeMode"
      @element-selected="handleSceneElementSelection"
    />

    <div v-else class="viewer-space__canvas" role="img" :aria-label="`Viewer canvas voor ${roomName}`" />

    <ViewerEntryGate
      v-if="showEntryGate"
      :room-name="roomName"
      :is-authenticated="isAuthenticated"
      :account-label="accountLabel"
      @login="goToLogin"
      @signup="goToSignup"
      @continue-auth="continueAsAuthenticated"
      @continue-guest="continueAsGuest"
    />

    <section v-else-if="showAccessError" class="viewer-access-error" role="alert" aria-live="assertive">
      <div class="viewer-access-error__card">
        <h1>{{ accessErrorTitle }}</h1>
        <p>{{ accessErrorMessage }}</p>
        <button type="button" class="viewer-access-error__retry" @click="retryRoomAccess">Opnieuw proberen</button>
      </div>
    </section>

    <div v-if="showPinPrompt" class="viewer-space__prompt-backdrop" @click="closePinPrompt">
      <form class="viewer-space__prompt" @submit.prevent="submitAccessPin" @click.stop>
        <h2>Toegangscode vereist</h2>
        <p class="viewer-space__prompt-copy">
          Deze herdenkingsruimte is afgeschermd. Vul de 6-cijferige pincode in om verder te gaan.
        </p>
        <input
          v-model="pendingAccessPin"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="Bijv. 123456"
          @input="normalizePendingAccessPin"
        />
        <p v-if="pinError" class="viewer-space__prompt-error">{{ pinError }}</p>
        <div class="viewer-space__prompt-actions">
          <button type="button" @click="closePinPrompt">Annuleer</button>
          <button type="submit" :disabled="isSubmittingPin">
            {{ isSubmittingPin ? 'Controleren...' : 'Verdergaan' }}
          </button>
        </div>
      </form>
    </div>

    <template v-if="hasEnteredViewer">
      <ViewerTopBar
        v-if="!isUiHidden"
        :is-authenticated="isAuthenticated"
        :account-label="accountLabel"
        :guest-name="guestName"
        @edit-guest-name="openGuestNamePrompt"
        @sign-out="handleSignOut"
      />

      <ViewerLeftPanel
        v-if="!isUiHidden && isPanelOpen"
        :active-panel="activePanel"
        :can-post-media="canPostMedia"
        :selected-element="selectedElement"
        :is-submitting="submitStatus === 'submitting'"
        :submit-error="submitError"
        :submit-success-message="submitSuccessMessage"
        @close="closePanel"
        @quick-action="handlePanelQuickAction"
        @submit-message="handleMessageSubmit"
        @submit-candle="handleCandleSubmit"
        @submit-media="handleMediaSubmit"
      />

      <ViewerBottomDock
        v-if="!isUiHidden"
        @open-add="openPanel('add')"
        @open-message="openPanel('message')"
        @open-candle="openPanel('candle')"
      />

      <ViewerRightRail
        :is-ui-hidden="isUiHidden"
        :active-mode="activeMode"
        @toggle-ui="toggleUi"
        @set-mode="setMode"
      />

      <div v-if="isGuestNamePromptOpen" class="viewer-space__prompt-backdrop" @click="isGuestNamePromptOpen = false">
        <form class="viewer-space__prompt" @submit.prevent="submitGuestName" @click.stop>
          <h2>Gastnaam wijzigen</h2>
          <input v-model="pendingGuestName" type="text" maxlength="60" placeholder="Bijv. Anna" />
          <p v-if="guestNameError" class="viewer-space__prompt-error">{{ guestNameError }}</p>
          <div class="viewer-space__prompt-actions">
            <button type="button" @click="isGuestNamePromptOpen = false">Annuleer</button>
            <button type="submit">Opslaan</button>
          </div>
        </form>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ViewerSceneViewport from '../scene/ViewerSceneViewport.client.vue'
import ViewerEntryGate from '../viewer/ViewerEntryGate.vue'
import ViewerTopBar from '../viewer/ViewerTopBar.vue'
import ViewerBottomDock from '../viewer/ViewerBottomDock.vue'
import ViewerRightRail from '../viewer/ViewerRightRail.vue'
import ViewerLeftPanel from '../viewer/ViewerLeftPanel.vue'
import { useViewerSession } from '../../composables/useViewerSession'
import { useViewerUiState } from '../../composables/useViewerUiState'
import { useViewerAuthGate } from '../../composables/useViewerAuthGate'
import { useViewerInteraction } from '../../composables/useViewerInteraction'
import { useViewerContributions } from '../../composables/useViewerContributions'

const props = defineProps({
  slug: {
    type: String,
    required: true
  }
})

const {
  session,
  isAuthenticated,
  canPostMedia,
  guestName,
  accountLabel,
  initializeAuth,
  setGuestName,
  signOut
} = useViewerSession()

const {
  isUiHidden,
  activePanel,
  activeMode,
  isPanelOpen,
  openPanel,
  closePanel,
  toggleUi,
  setMode
} = useViewerUiState()

const { hasEnteredViewer, enterViewer, resetViewerGate } = useViewerAuthGate()
const {
  selectedElement,
  pointerWorldPosition,
  setSelectedElement,
  setPointerWorldPosition,
  clearSelection
} = useViewerInteraction()

const {
  room,
  submitStatus,
  submitError,
  roomLoading,
  roomError,
  roomErrorStatusCode,
  roomRequiresPin,
  loadRoomBySlug,
  submitMessage,
  submitCandle,
  submitMedia
} = useViewerContributions()

const roomName = computed(() => {
  if (room.value?.name) {
    return room.value.name
  }

  if (!props.slug || !props.slug.length) {
    return 'Herdenkingsruimte'
  }

  return props.slug.replace(/-/g, ' ')
})

const isGuestNamePromptOpen = ref(false)
const pendingGuestName = ref('')
const guestNameError = ref('')
const submitSuccessMessage = ref('')
const accessErrorTitle = ref('')
const accessErrorMessage = ref('')
const hasFatalRoomAccessError = ref(false)
const isPinPromptOpen = ref(false)
const pendingAccessPin = ref('')
const acceptedAccessPin = ref('')
const pinError = ref('')
const isSubmittingPin = ref(false)

const showEntryGate = computed(() => {
  return !hasEnteredViewer.value && !hasFatalRoomAccessError.value && !isPinPromptOpen.value && !roomLoading.value
})

const showAccessError = computed(() => !hasEnteredViewer.value && hasFatalRoomAccessError.value)
const showPinPrompt = computed(() => !hasEnteredViewer.value && isPinPromptOpen.value)

onMounted(async () => {
  resetViewerGate()
  await initializeAuth()
  await resolveRoomAccess()
})

async function resolveRoomAccess(accessPin = '') {
  hasFatalRoomAccessError.value = false
  accessErrorTitle.value = ''
  accessErrorMessage.value = ''
  pinError.value = ''

  const response = await loadRoomBySlug(props.slug, accessPin)
  if (response?.room) {
    if (response.room.visibility === 'private' && !accessPin.length) {
      isPinPromptOpen.value = true
      return
    }

    acceptedAccessPin.value = accessPin
    isPinPromptOpen.value = false

    if (isAuthenticated.value) {
      submitSuccessMessage.value = ''
      clearSelection()
      enterViewer()
    }

    return
  }

  if (roomRequiresPin.value) {
    if (isAuthenticated.value) {
      isPinPromptOpen.value = true
    }
    return
  }

  if (roomErrorStatusCode.value === 404) {
    hasFatalRoomAccessError.value = true
    accessErrorTitle.value = 'Herdenkingsruimte niet gevonden'
    accessErrorMessage.value = 'Deze herdenkingsruimte bestaat niet.'
    return
  }

  if (roomErrorStatusCode.value === 403) {
    hasFatalRoomAccessError.value = true
    accessErrorTitle.value = 'Ruimte offline'
    accessErrorMessage.value = roomError.value || 'Deze ruimte is offline gehaald door de eigenaar of nog niet gepubliceerd.'
    return
  }

  hasFatalRoomAccessError.value = true
  accessErrorTitle.value = 'Ruimte laden mislukt'
  accessErrorMessage.value = roomError.value || 'Er ging iets mis bij het laden van de ruimte.'
}

function normalizePendingAccessPin() {
  pendingAccessPin.value = pendingAccessPin.value.replace(/\D/g, '').slice(0, 6)
}

function closePinPrompt() {
  isPinPromptOpen.value = false
  pinError.value = ''
}

async function submitAccessPin() {
  normalizePendingAccessPin()

  if (!/^\d{6}$/.test(pendingAccessPin.value)) {
    pinError.value = 'Vul een geldige pincode van 6 cijfers in.'
    return
  }

  isSubmittingPin.value = true
  pinError.value = ''

  try {
    const response = await loadRoomBySlug(props.slug, pendingAccessPin.value)

    if (!response?.room) {
      pinError.value = roomError.value || 'De pincode is ongeldig.'
      return
    }

    acceptedAccessPin.value = pendingAccessPin.value
    isPinPromptOpen.value = false

    if (isAuthenticated.value) {
      submitSuccessMessage.value = ''
      clearSelection()
      enterViewer()
      return
    }

    if (guestName.value.length) {
      submitSuccessMessage.value = ''
      clearSelection()
      enterViewer()
    }
  } finally {
    isSubmittingPin.value = false
  }
}

async function retryRoomAccess() {
  await resolveRoomAccess(acceptedAccessPin.value)
}

function goToLogin() {
  navigateTo(`/auth/login?redirect=${encodeURIComponent(`/viewer/${props.slug}`)}`)
}

function goToSignup() {
  navigateTo(`/auth/signup?redirect=${encodeURIComponent(`/viewer/${props.slug}`)}`)
}

function continueAsAuthenticated() {
  if (isPinPromptOpen.value) {
    return
  }

  if (room.value?.visibility === 'private') {
    isPinPromptOpen.value = true
    return
  }

  if (roomRequiresPin.value) {
    isPinPromptOpen.value = true
    return
  }

  submitSuccessMessage.value = ''
  clearSelection()
  enterViewer()
}

function continueAsGuest(name) {
  setGuestName(name)
  pendingGuestName.value = name

  if (room.value?.visibility === 'private') {
    isPinPromptOpen.value = true
    return
  }

  submitSuccessMessage.value = ''
  clearSelection()
  enterViewer()
}

function openGuestNamePrompt() {
  if (isAuthenticated.value) {
    return
  }

  pendingGuestName.value = guestName.value
  guestNameError.value = ''
  isGuestNamePromptOpen.value = true
}

async function handleSignOut() {
  await signOut()
  hasEnteredViewer.value = false
  closePanel()
  isGuestNamePromptOpen.value = false
  submitSuccessMessage.value = ''
  clearSelection()
}

function submitGuestName() {
  const nextName = setGuestName(pendingGuestName.value)

  if (!nextName.length) {
    guestNameError.value = 'Vul een naam in om als gast berichten achter te laten.'
    return
  }

  guestNameError.value = ''
  isGuestNamePromptOpen.value = false
}

function handleSceneElementSelection(element) {
  if (!element) {
    clearSelection()
    if (activePanel.value === 'element') {
      closePanel()
    }
    return
  }

  const worldPosition = Array.isArray(element.worldPosition) ? element.worldPosition : null
  setSelectedElement({
    id: element.id,
    title: element.title || 'Scene element',
    description: element.description || '',
    interaction: element.interaction ?? null
  })
  setPointerWorldPosition(worldPosition)
  openPanel('element')
}

function handlePanelQuickAction(action) {
  if (action === 'message') {
    openPanel('message')
    return
  }

  if (action === 'candle') {
    openPanel('candle')
    return
  }

  if (action === 'add') {
    openPanel('add')
  }
}

async function handleMessageSubmit(payload) {
  submitSuccessMessage.value = ''

  const response = await submitMessage({
    slug: props.slug,
    message: payload?.message || '',
    voiceUrl: payload?.voiceUrl || '',
    guestName: isAuthenticated.value ? '' : guestName.value,
    selectedElementId: selectedElement.value?.id || null,
    worldPosition: pointerWorldPosition.value,
    accessToken: session.value?.access_token || '',
    accessPin: acceptedAccessPin.value
  })

  if (!response?.ok) {
    return
  }

  submitSuccessMessage.value = response?.contribution?.status === 'published'
    ? 'Je bericht is geplaatst.'
    : 'Je bericht is ontvangen en wacht op goedkeuring.'
}

async function handleCandleSubmit(payload) {
  submitSuccessMessage.value = ''

  const response = await submitCandle({
    slug: props.slug,
    dedication: payload?.dedication || '',
    candleStyle: payload?.candleStyle || 'Klassiek',
    guestName: isAuthenticated.value ? '' : guestName.value,
    selectedElementId: selectedElement.value?.id || null,
    worldPosition: pointerWorldPosition.value,
    accessToken: session.value?.access_token || '',
    accessPin: acceptedAccessPin.value
  })

  if (!response?.ok) {
    return
  }

  submitSuccessMessage.value = response?.contribution?.status === 'published'
    ? 'Je kaars is aangestoken.'
    : 'Je kaars is ontvangen en wacht op goedkeuring.'
}

async function handleMediaSubmit(payload) {
  submitSuccessMessage.value = ''

  const response = await submitMedia({
    slug: props.slug,
    mediaType: payload?.mediaType || 'image',
    mediaUrl: payload?.mediaUrl || '',
    title: payload?.title || '',
    caption: payload?.caption || '',
    selectedElementId: selectedElement.value?.id || null,
    worldPosition: pointerWorldPosition.value,
    accessToken: session.value?.access_token || '',
    accessPin: acceptedAccessPin.value
  })

  if (!response?.ok) {
    return
  }

  submitSuccessMessage.value = response?.contribution?.status === 'published'
    ? 'Je media is geplaatst.'
    : 'Je media is ontvangen en wacht op goedkeuring.'
}
</script>

<style scoped>
.viewer-space {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #070b10;
  font-family: var(--font-sans);
}

.viewer-space__canvas {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 18%, rgba(222, 181, 113, 0.19), transparent 30%),
    radial-gradient(circle at 82% 78%, rgba(163, 177, 138, 0.22), transparent 30%),
    linear-gradient(180deg, #1a2433 0%, #0a1118 65%, #05080d 100%);
}

.viewer-space__prompt-backdrop {
  position: absolute;
  inset: 0;
  z-index: 35;
  background: rgba(0, 0, 0, 0.52);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.viewer-space__prompt {
  width: min(24rem, 100%);
  border-radius: 14px;
  padding: 1rem;
  background: linear-gradient(160deg, rgba(30, 39, 55, 0.96) 0%, rgba(20, 25, 35, 0.96) 100%);
  color: #eff7ff;
  display: grid;
  gap: 0.55rem;
}

.viewer-space__prompt h2 {
  margin: 0;
  font-size: 1.05rem;
  font-family: var(--font-display);
}

.viewer-space__prompt-copy {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(236, 244, 252, 0.86);
}

.viewer-space__prompt input {
  min-height: 2.4rem;
  border-radius: 10px;
  border: 1px solid rgba(224, 238, 248, 0.2);
  background: rgba(11, 17, 25, 0.88);
  color: #eff7ff;
  padding: 0 0.65rem;
}

.viewer-space__prompt-error {
  margin: 0;
  color: #fbd0bf;
  font-size: 0.85rem;
}

.viewer-space__prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.viewer-space__prompt-actions button {
  border: 0;
  border-radius: 8px;
  min-height: 2.1rem;
  padding: 0 0.85rem;
  cursor: pointer;
}

.viewer-space__prompt-actions button[type='submit'] {
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
}

.viewer-access-error {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(6, 9, 13, 0.62);
  backdrop-filter: blur(8px);
}

.viewer-access-error__card {
  width: min(30rem, 100%);
  border-radius: 18px;
  padding: 1.25rem;
  background: linear-gradient(160deg, rgba(30, 39, 55, 0.96) 0%, rgba(20, 25, 35, 0.96) 100%);
  border: 1px solid rgba(215, 232, 247, 0.18);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  color: #eff7ff;
}

.viewer-access-error__card h1 {
  margin: 0 0 0.45rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.viewer-access-error__card p {
  margin: 0;
  font-size: 0.92rem;
  color: rgba(231, 243, 255, 0.82);
}

.viewer-access-error__retry {
  margin-top: 0.9rem;
  border: 0;
  border-radius: 12px;
  min-height: 2.7rem;
  padding: 0 0.95rem;
  font-family: var(--font-display);
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
}

@media (max-width: 700px) {
}
</style>
