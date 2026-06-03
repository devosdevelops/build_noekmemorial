<template>
  <section class="viewer-space">
    <ViewerSceneViewport
      v-if="hasEnteredViewer"
      :active-mode="activeMode"
      @element-selected="handleSceneElementSelection"
    />

    <div v-else class="viewer-space__canvas" role="img" :aria-label="`Viewer canvas voor ${roomName}`" />

    <ViewerEntryGate
      v-if="!hasEnteredViewer"
      :room-name="roomName"
      :is-authenticated="isAuthenticated"
      :account-label="accountLabel"
      @login="goToLogin"
      @signup="goToSignup"
      @continue-auth="continueAsAuthenticated"
      @continue-guest="continueAsGuest"
    />

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

const { hasEnteredViewer, enterViewer } = useViewerAuthGate()
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

onMounted(async () => {
  await initializeAuth()
  await loadRoomBySlug(props.slug)
})

function goToLogin() {
  navigateTo(`/auth/login?redirect=${encodeURIComponent(`/viewer/${props.slug}`)}`)
}

function goToSignup() {
  navigateTo(`/auth/signup?redirect=${encodeURIComponent(`/viewer/${props.slug}`)}`)
}

function continueAsAuthenticated() {
  submitSuccessMessage.value = ''
  clearSelection()
  enterViewer()
}

function continueAsGuest(name) {
  setGuestName(name)
  pendingGuestName.value = name
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
    description: element.description || ''
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
    accessToken: session.value?.access_token || ''
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
    accessToken: session.value?.access_token || ''
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
    accessToken: session.value?.access_token || ''
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

@media (max-width: 700px) {
}
</style>
