<template>
  <section ref="viewerSpaceRoot" class="viewer-space">
    <ViewerSceneViewport
      v-if="hasEnteredViewer"
      ref="viewerViewportRef"
      :active-mode="activeMode"
      :scene-document="viewerSceneDocument"
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
        :contributions="contributions"
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
        :is-music-on="isMusicOn"
        @toggle-music="toggleMusic"
        @toggle-ui="toggleUi"
        @reset-view="handleResetView"
      />

      <div
        v-if="isMediaCarouselOpen"
        class="viewer-media-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Media weergave"
        @click="closeMediaCarousel"
      >
        <section
          class="viewer-media-overlay__card"
          @click.stop
          @mousedown="beginCarouselSwipe"
          @mouseup="endCarouselSwipe"
          @touchstart="beginCarouselSwipe"
          @touchend="endCarouselSwipe"
        >
          <header class="viewer-media-overlay__header">
            <p>
              {{ mediaCarouselItems.length ? `${mediaCarouselIndex + 1} / ${mediaCarouselItems.length}` : 'Geen bijdragen' }}
            </p>
            <button type="button" @click="closeMediaCarousel">Sluiten</button>
          </header>

          <article v-if="activeCarouselItem" class="viewer-media-overlay__content">
            <template v-if="mediaCarouselKind === 'message'">
              <div class="viewer-media-overlay__message-paper">
                <p>{{ excerptFromContribution(activeCarouselItem) || 'Geen berichttekst opgegeven.' }}</p>
              </div>
              <p class="viewer-media-overlay__meta">{{ posterNameFromContribution(activeCarouselItem) }}</p>
            </template>

            <template v-else-if="mediaCarouselKind === 'image-video'">
              <img
                v-if="String(activeCarouselItem?.content?.media_type || '').toLowerCase() === 'image'"
                :src="mediaUrlFromContribution(activeCarouselItem)"
                :alt="activeCarouselItem?.title || 'Herinneringsfoto'"
              >
              <video
                v-else
                :src="mediaUrlFromContribution(activeCarouselItem)"
                controls
                playsinline
                preload="metadata"
              />
              <p class="viewer-media-overlay__meta">Geplaatst door {{ posterNameFromContribution(activeCarouselItem) }}</p>
            </template>

            <template v-else>
              <button type="button" class="viewer-media-overlay__audio-toggle" @click="toggleCarouselAudio">
                {{ carouselAudio ? 'Stop audio' : 'Speel audio' }}
              </button>
              <p class="viewer-media-overlay__meta">Geplaatst door {{ posterNameFromContribution(activeCarouselItem) }}</p>
            </template>

            <div class="viewer-media-overlay__reactions" role="group" aria-label="Reageer op bijdrage">
              <button
                v-for="reaction in REACTION_TYPES"
                :key="reaction.id"
                type="button"
                class="viewer-media-overlay__reaction-button"
                :disabled="activeReactionType === reaction.id"
                :aria-label="`Reageer met ${reaction.label}`"
                @click="handleContributionReaction(reaction.id)"
              >
                <img :src="reaction.icon" alt="" aria-hidden="true" class="viewer-media-overlay__reaction-icon" />
                <span class="viewer-media-overlay__reaction-count">{{ reactionCountFor(activeCarouselItem, reaction.id) }}</span>
              </button>
            </div>
          </article>

          <article v-else class="viewer-media-overlay__empty">
            Voor dit media-object zijn nog geen bijdragen beschikbaar.
          </article>

          <footer class="viewer-media-overlay__nav">
            <button type="button" @click="previousCarouselItem" :disabled="!mediaCarouselItems.length">Vorige</button>
            <button type="button" @click="nextCarouselItem" :disabled="!mediaCarouselItems.length">Volgende</button>
          </footer>
        </section>
      </div>

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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ViewerSceneViewport from '../scene/ViewerSceneViewport.client.vue'
import ViewerEntryGate from '../viewer/ViewerEntryGate.vue'
import ViewerTopBar from '../viewer/ViewerTopBar.vue'
import ViewerBottomDock from '../viewer/ViewerBottomDock.vue'
import ViewerRightRail from '../viewer/ViewerRightRail.vue'
import ViewerLeftPanel from '../viewer/ViewerLeftPanel.vue'
import { AUDIO_TRACKS } from '../../config/audioLibrary.js'
import { useViewerSession } from '../../composables/useViewerSession'
import { useViewerUiState } from '../../composables/useViewerUiState'
import { useViewerAuthGate } from '../../composables/useViewerAuthGate'
import { useViewerInteraction } from '../../composables/useViewerInteraction'
import { useViewerContributions } from '../../composables/useViewerContributions'
import { useUiClickSound } from '../../composables/useUiClickSound.js'

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
  isMusicOn,
  isPanelOpen,
  openPanel,
  closePanel,
  toggleUi,
  toggleMusic,
  setMusicOn
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
  scene,
  contributions,
  submitStatus,
  submitError,
  roomLoading,
  roomError,
  roomErrorStatusCode,
  roomRequiresPin,
  loadRoomBySlug,
  submitMessage,
  submitCandle,
  submitMedia,
  submitReaction
} = useViewerContributions()

const REACTION_TYPES = [
  { id: 'heart', label: 'Liefde', icon: '/icons/heart.svg' },
  { id: 'hug', label: 'Knuffel', icon: '/icons/hug.svg' },
  { id: 'sad', label: 'Medeleven', icon: '/icons/sad.svg' }
]

const viewerSceneDocument = computed(() => {
  const sceneRow = scene.value

  if (!sceneRow || typeof sceneRow !== 'object') {
    return null
  }

  if (!sceneRow.scene_data || typeof sceneRow.scene_data !== 'object') {
    return null
  }

  return sceneRow.scene_data
})

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
const viewerSpaceRoot = ref(null)
const viewerViewportRef = ref(null)
const viewerMusicAudio = ref(null)
const carouselAudio = ref(null)
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
const isMediaCarouselOpen = ref(false)
const mediaCarouselKind = ref('')
const mediaCarouselIndex = ref(0)
const swipeStartX = ref(0)
const swipeIsActive = ref(false)
const activeReactionType = ref('')

const { playClickSound } = useUiClickSound({
  containerRef: viewerSpaceRoot
})

const showEntryGate = computed(() => {
  return !hasEnteredViewer.value && !hasFatalRoomAccessError.value && !isPinPromptOpen.value && !roomLoading.value
})

const viewerMusicTrackUrl = computed(() => {
  const sceneObjects = Array.isArray(viewerSceneDocument.value?.objects)
    ? viewerSceneDocument.value.objects
    : []

  const sceneMusicObjects = sceneObjects.filter((objectState) => {
    return objectState?.kind === 'audio'
      && typeof objectState?.assetRef === 'string'
      && objectState.assetRef.length
  })

  for (const objectState of sceneMusicObjects) {
    const fromLibrary = AUDIO_TRACKS.find((track) => track.id === objectState.assetRef)
    if (fromLibrary?.url && fromLibrary.categoryId === 'music') {
      return fromLibrary.url
    }

    if (objectState.assetRef.startsWith('/audio/') || objectState.assetRef.startsWith('http')) {
      return objectState.assetRef
    }
  }

  const fallbackMusicTrack = AUDIO_TRACKS.find((track) => track.categoryId === 'music')
  return fallbackMusicTrack?.url || ''
})

const mediaCarouselItems = computed(() => {
  const source = Array.isArray(contributions.value) ? contributions.value : []
  const kind = mediaCarouselKind.value

  if (!kind.length) {
    return []
  }

  return source.filter((entry) => {
    const entryType = String(entry?.type || '').toLowerCase()
    const mediaType = String(entry?.content?.media_type || '').toLowerCase()
    const hasVoiceUrl = typeof entry?.content?.voice_url === 'string' && entry.content.voice_url.trim().length > 0

    if (kind === 'message') {
      return entryType === 'message' || entryType === 'post'
    }

    if (kind === 'image-video') {
      return mediaType === 'image' || mediaType === 'video' || entryType === 'image' || entryType === 'video'
    }

    if (kind === 'audio') {
      return mediaType === 'audio' || entryType === 'audio' || hasVoiceUrl
    }

    return false
  })
})

const activeCarouselItem = computed(() => {
  if (!mediaCarouselItems.value.length) {
    return null
  }

  const safeIndex = Math.min(Math.max(mediaCarouselIndex.value, 0), mediaCarouselItems.value.length - 1)
  return mediaCarouselItems.value[safeIndex] || null
})

const showAccessError = computed(() => !hasEnteredViewer.value && hasFatalRoomAccessError.value)
const showPinPrompt = computed(() => !hasEnteredViewer.value && isPinPromptOpen.value)

onMounted(async () => {
  resetViewerGate()
  await initializeAuth()
  await resolveRoomAccess()
})

onBeforeUnmount(() => {
  stopViewerMusic()
  stopCarouselAudio()
  window.removeEventListener('keydown', onCarouselKeydown)
})

watch(
  () => [isMusicOn.value, viewerMusicTrackUrl.value, hasEnteredViewer.value],
  async () => {
    await syncViewerMusicPlayback()
  },
  { immediate: true }
)

watch(
  () => isMediaCarouselOpen.value,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', onCarouselKeydown)
      return
    }

    window.removeEventListener('keydown', onCarouselKeydown)
    stopCarouselAudio()
  }
)

watch(
  () => mediaCarouselItems.value.length,
  (nextLength) => {
    if (!nextLength) {
      mediaCarouselIndex.value = 0
      return
    }

    mediaCarouselIndex.value = Math.min(mediaCarouselIndex.value, nextLength - 1)
  }
)

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
    isPinPromptOpen.value = true
    return
  }

  if (roomErrorStatusCode.value === 404) {
    hasFatalRoomAccessError.value = true
    accessErrorTitle.value = 'Herdenkingsruimte niet gevonden'
    accessErrorMessage.value = 'Deze herdenkingsruimte bestaat niet.'
    return
  }

  if (roomErrorStatusCode.value === 403) {
    const errorCopy = String(roomError.value || '').toLowerCase()
    const looksLikePrivateRoom = roomRequiresPin.value || errorCopy.includes('toegangscode') || errorCopy.includes('pincode')

    if (looksLikePrivateRoom) {
      hasFatalRoomAccessError.value = false
      accessErrorTitle.value = ''
      accessErrorMessage.value = ''
      isPinPromptOpen.value = true
      return
    }

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
  setMusicOn(false)
  hasEnteredViewer.value = false
  closePanel()
  isGuestNamePromptOpen.value = false
  submitSuccessMessage.value = ''
  clearSelection()
  closeMediaCarousel()
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
    closeMediaCarousel()
    return
  }

  const elementId = typeof element.id === 'string' ? element.id : ''
  const isGroundPlane = elementId === 'ground' || elementId === 'ground-plane'

  if (!isGroundPlane) {
    playClickSound()
  }

  const worldPosition = Array.isArray(element.worldPosition) ? element.worldPosition : null
  setSelectedElement({
    id: element.id,
    kind: element.kind || '',
    title: element.title || 'Scene element',
    description: element.description || '',
    interaction: element.interaction ?? null
  })
  setPointerWorldPosition(worldPosition)

  if (worldPosition && viewerViewportRef.value?.focusCameraOnPosition) {
    viewerViewportRef.value.focusCameraOnPosition(worldPosition)
  }

  closeMediaCarousel()
  openPanel('element')
}

function handlePanelQuickAction(action) {
  closeMediaCarousel()

  if (action === 'message') {
    openPanel('message')
    return
  }

  if (action === 'candle') {
    openPanel('candle')
    return
  }

  if (action === 'view-media') {
    if (
      selectedElement.value?.interaction?.type === 'media-carousel'
      && typeof selectedElement.value?.interaction?.mediaKind === 'string'
      && selectedElement.value.interaction.mediaKind.length
    ) {
      openMediaCarousel(selectedElement.value.interaction.mediaKind)
    }
    return
  }

  if (action === 'add') {
    openPanel('add')
  }
}

function handleResetView() {
  viewerViewportRef.value?.resetCameraView?.()
}

function openMediaCarousel(mediaKind) {
  mediaCarouselKind.value = mediaKind
  mediaCarouselIndex.value = 0
  isMediaCarouselOpen.value = true
  closePanel()
  isUiHidden.value = false
}

function closeMediaCarousel() {
  isMediaCarouselOpen.value = false
  mediaCarouselKind.value = ''
  mediaCarouselIndex.value = 0
}

function nextCarouselItem() {
  if (!mediaCarouselItems.value.length) {
    return
  }

  mediaCarouselIndex.value = (mediaCarouselIndex.value + 1) % mediaCarouselItems.value.length
  stopCarouselAudio()
}

function previousCarouselItem() {
  if (!mediaCarouselItems.value.length) {
    return
  }

  mediaCarouselIndex.value = (mediaCarouselIndex.value - 1 + mediaCarouselItems.value.length) % mediaCarouselItems.value.length
  stopCarouselAudio()
}

function onCarouselKeydown(event) {
  if (!isMediaCarouselOpen.value) {
    return
  }

  if (event.key === 'Escape') {
    closeMediaCarousel()
    return
  }

  if (event.key === 'ArrowRight') {
    nextCarouselItem()
    return
  }

  if (event.key === 'ArrowLeft') {
    previousCarouselItem()
  }
}

function beginCarouselSwipe(event) {
  const clientX = event?.touches?.[0]?.clientX ?? event?.clientX
  if (!Number.isFinite(clientX)) {
    return
  }

  swipeStartX.value = clientX
  swipeIsActive.value = true
}

function endCarouselSwipe(event) {
  if (!swipeIsActive.value) {
    return
  }

  const clientX = event?.changedTouches?.[0]?.clientX ?? event?.clientX
  if (!Number.isFinite(clientX)) {
    swipeIsActive.value = false
    return
  }

  const delta = clientX - swipeStartX.value
  swipeIsActive.value = false

  if (Math.abs(delta) < 38) {
    return
  }

  if (delta < 0) {
    nextCarouselItem()
    return
  }

  previousCarouselItem()
}

function posterNameFromContribution(entry) {
  const guestName = typeof entry?.content?.guest_name === 'string' ? entry.content.guest_name.trim() : ''
  if (guestName.length) {
    return guestName
  }

  const title = typeof entry?.title === 'string' ? entry.title : ''
  const titleMatch = title.match(/van\s+(.+)$/i)
  if (titleMatch?.[1]) {
    return titleMatch[1].trim()
  }

  return 'Bezoeker'
}

function excerptFromContribution(entry) {
  const message = typeof entry?.content?.message === 'string' ? entry.content.message.trim() : ''
  if (message.length) {
    return message
  }

  const excerpt = typeof entry?.excerpt === 'string' ? entry.excerpt.trim() : ''
  return excerpt
}

function mediaUrlFromContribution(entry) {
  if (typeof entry?.mediaUrl === 'string' && entry.mediaUrl.trim().length) {
    return entry.mediaUrl.trim()
  }

  const voiceUrl = typeof entry?.content?.voice_url === 'string' ? entry.content.voice_url.trim() : ''
  return voiceUrl
}

function normalizeReactions(rawReactions) {
  const source = rawReactions && typeof rawReactions === 'object' ? rawReactions : {}

  return {
    heart: Number.isFinite(source.heart) ? Math.max(0, Math.floor(source.heart)) : 0,
    hug: Number.isFinite(source.hug) ? Math.max(0, Math.floor(source.hug)) : 0,
    sad: Number.isFinite(source.sad) ? Math.max(0, Math.floor(source.sad)) : 0
  }
}

function reactionCountFor(entry, reactionType) {
  const reactions = normalizeReactions(entry?.content?.reactions)
  return reactions[reactionType] ?? 0
}

async function handleContributionReaction(reactionType) {
  if (!activeCarouselItem.value || typeof activeCarouselItem.value.id !== 'string' || !activeCarouselItem.value.id.length) {
    return
  }

  activeReactionType.value = reactionType

  try {
    const response = await submitReaction({
      slug: props.slug,
      contributionId: activeCarouselItem.value.id,
      reactionType,
      accessPin: acceptedAccessPin.value,
      accessToken: session.value?.access_token || ''
    })

    if (!response?.ok || !response?.contributionId) {
      return
    }

    const contributionIndex = contributions.value.findIndex((entry) => entry?.id === response.contributionId)
    if (contributionIndex < 0) {
      return
    }

    const existingContribution = contributions.value[contributionIndex]
    const existingContent = existingContribution?.content && typeof existingContribution.content === 'object'
      ? existingContribution.content
      : {}

    const nextContribution = {
      ...existingContribution,
      content: {
        ...existingContent,
        reactions: normalizeReactions(response.reactions)
      }
    }

    const nextContributions = [...contributions.value]
    nextContributions.splice(contributionIndex, 1, nextContribution)
    contributions.value = nextContributions
  } finally {
    activeReactionType.value = ''
  }
}

function toggleCarouselAudio() {
  const mediaUrl = mediaUrlFromContribution(activeCarouselItem.value)
  if (!mediaUrl.length || !process.client) {
    return
  }

  if (carouselAudio.value) {
    stopCarouselAudio()
    return
  }

  const nextAudio = new Audio(mediaUrl)
  nextAudio.preload = 'auto'
  nextAudio.volume = 0.9
  nextAudio.onended = () => {
    if (carouselAudio.value === nextAudio) {
      carouselAudio.value = null
    }
  }

  carouselAudio.value = nextAudio
  nextAudio.play().catch(() => {
    if (carouselAudio.value === nextAudio) {
      carouselAudio.value = null
    }
  })
}

function stopCarouselAudio() {
  if (!carouselAudio.value) {
    return
  }

  carouselAudio.value.pause()
  carouselAudio.value.currentTime = 0
  carouselAudio.value = null
}

async function syncViewerMusicPlayback() {
  if (!process.client) {
    return
  }

  if (!hasEnteredViewer.value || !isMusicOn.value || !viewerMusicTrackUrl.value.length) {
    stopViewerMusic()
    return
  }

  if (!viewerMusicAudio.value || viewerMusicAudio.value.src !== new URL(viewerMusicTrackUrl.value, window.location.origin).href) {
    stopViewerMusic()
    const nextAudio = new Audio(viewerMusicTrackUrl.value)
    nextAudio.loop = true
    nextAudio.volume = 0.32
    nextAudio.preload = 'auto'
    viewerMusicAudio.value = nextAudio
  }

  try {
    await viewerMusicAudio.value.play()
  } catch {
    setMusicOn(false)
  }
}

function stopViewerMusic() {
  if (!viewerMusicAudio.value) {
    return
  }

  viewerMusicAudio.value.pause()
  viewerMusicAudio.value.currentTime = 0
  viewerMusicAudio.value = null
}

async function handleMessageSubmit(payload) {
  submitSuccessMessage.value = ''

  const selectedElementId = selectedElement.value?.kind === 'floor'
    ? null
    : (selectedElement.value?.id || null)

  const response = await submitMessage({
    slug: props.slug,
    message: payload?.message || '',
    voiceUrl: payload?.voiceUrl || '',
    guestName: isAuthenticated.value ? '' : guestName.value,
    selectedElementId,
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

  const selectedElementId = selectedElement.value?.kind === 'floor'
    ? null
    : (selectedElement.value?.id || null)

  let candleWorldPosition = pointerWorldPosition.value
  let candleAnchorElementId = selectedElementId

  const placement = viewerViewportRef.value?.placeVisitorCandle
    ? viewerViewportRef.value.placeVisitorCandle({
        candleStyle: payload?.candleStyle || 'Klassiek',
        candleModel: payload?.candleModel || null
      })
    : null

  const resolvedPlacement = placement && typeof placement.then === 'function'
    ? await placement
    : placement

  if (resolvedPlacement?.worldPosition && Array.isArray(resolvedPlacement.worldPosition)) {
    candleWorldPosition = resolvedPlacement.worldPosition
    candleAnchorElementId = resolvedPlacement.anchorObjectId || null
    setPointerWorldPosition(candleWorldPosition)
  }

  const response = await submitCandle({
    slug: props.slug,
    dedication: payload?.dedication || '',
    candleStyle: payload?.candleStyle || 'Klassiek',
    guestName: isAuthenticated.value ? '' : guestName.value,
    selectedElementId: candleAnchorElementId,
    worldPosition: candleWorldPosition,
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

  const selectedElementId = selectedElement.value?.kind === 'floor'
    ? null
    : (selectedElement.value?.id || null)

  const response = await submitMedia({
    slug: props.slug,
    mediaType: payload?.mediaType || 'image',
    mediaUrl: payload?.mediaUrl || '',
    title: payload?.title || '',
    caption: payload?.caption || '',
    selectedElementId,
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
  background: #e8dcc0;
  font-family: var(--font-sans);
}

.viewer-space__canvas {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 14% 20%, rgba(224, 202, 155, 0.35), transparent 32%),
    radial-gradient(circle at 80% 76%, rgba(188, 202, 165, 0.28), transparent 34%),
    linear-gradient(180deg, #efe5cf 0%, #e7dbc0 68%, #ddcfb2 100%);
}

.viewer-space__prompt-backdrop {
  position: absolute;
  inset: 0;
  z-index: 35;
  background: rgba(58, 52, 34, 0.38);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.viewer-space__prompt {
  width: min(24rem, 100%);
  border-radius: 14px;
  padding: 1rem;
  background: linear-gradient(160deg, rgba(252, 253, 249, 0.97) 0%, rgba(244, 248, 238, 0.96) 100%);
  color: #273122;
  display: grid;
  gap: 0.55rem;
  border: 1px solid rgba(162, 174, 143, 0.38);
  box-shadow: 0 16px 34px rgba(44, 37, 21, 0.22);
}

.viewer-space__prompt h2 {
  margin: 0;
  font-size: 1.05rem;
  font-family: var(--font-display);
}

.viewer-space__prompt-copy {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(54, 68, 46, 0.86);
}

.viewer-space__prompt input {
  min-height: 2.4rem;
  border-radius: 10px;
  border: 1px solid rgba(171, 184, 151, 0.65);
  background: rgba(255, 255, 255, 0.92);
  color: #253022;
  padding: 0 0.65rem;
}

.viewer-space__prompt-error {
  margin: 0;
  color: #b2452c;
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

.viewer-media-overlay {
  position: absolute;
  inset: 0;
  z-index: 34;
  background: rgba(73, 66, 44, 0.34);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.viewer-media-overlay__card {
  width: min(40rem, 100%);
  border-radius: 16px;
  border: 1px solid rgba(162, 174, 143, 0.35);
  background: linear-gradient(165deg, rgba(252, 253, 249, 0.97) 0%, rgba(242, 247, 236, 0.96) 100%);
  box-shadow: 0 20px 46px rgba(36, 30, 18, 0.25);
  padding: 0.85rem;
  display: grid;
  gap: 0.75rem;
  color: #253022;
}

.viewer-media-overlay__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.viewer-media-overlay__header p {
  margin: 0;
  font-size: 0.86rem;
  color: rgba(67, 82, 57, 0.84);
}

.viewer-media-overlay__header button {
  border: 0;
  border-radius: 9px;
  min-height: 2rem;
  padding: 0 0.75rem;
  cursor: pointer;
  background: rgba(231, 238, 223, 0.95);
  color: #2a3527;
  border: 1px solid rgba(145, 158, 126, 0.55);
}

.viewer-media-overlay__content {
  display: grid;
  gap: 0.65rem;
}

.viewer-media-overlay__content img,
.viewer-media-overlay__content video {
  width: 100%;
  border-radius: 12px;
  max-height: min(54vh, 30rem);
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
}

.viewer-media-overlay__message-paper {
  min-height: 10rem;
  border-radius: 12px;
  padding: 1rem;
  background: linear-gradient(180deg, #f6edd6 0%, #efe0b8 100%);
  color: #2d2b25;
  border: 1px solid rgba(55, 45, 20, 0.1);
}

.viewer-media-overlay__message-paper p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.viewer-media-overlay__meta {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(67, 82, 57, 0.88);
}

.viewer-media-overlay__reactions {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  flex-wrap: wrap;
}

.viewer-media-overlay__reaction-button {
  border: 0;
  border-radius: 999px;
  min-height: 2.2rem;
  padding: 0.3rem 0.5rem;
  background: rgba(238, 245, 223, 0.94);
  color: #25310f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.viewer-media-overlay__reaction-button:disabled {
  opacity: 0.65;
  cursor: default;
}

.viewer-media-overlay__reaction-icon {
  width: 1.15rem;
  height: 1.15rem;
  object-fit: contain;
}

.viewer-media-overlay__reaction-count {
  min-width: 1.3rem;
  min-height: 1.3rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: #f9f1cf;
  color: #3f3717;
}

.viewer-media-overlay__audio-toggle {
  border: 0;
  border-radius: 11px;
  min-height: 2.6rem;
  padding: 0 1rem;
  cursor: pointer;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
  font-weight: 600;
}

.viewer-media-overlay__empty {
  min-height: 8rem;
  border-radius: 12px;
  display: grid;
  place-items: center;
  padding: 1rem;
  text-align: center;
  background: rgba(232, 241, 221, 0.78);
  color: rgba(67, 82, 57, 0.9);
}

.viewer-media-overlay__nav {
  display: flex;
  justify-content: space-between;
  gap: 0.55rem;
}

.viewer-media-overlay__nav button {
  border: 0;
  border-radius: 11px;
  min-height: 2.35rem;
  padding: 0 1rem;
  cursor: pointer;
  background: rgba(231, 238, 223, 0.95);
  color: #2a3527;
  border: 1px solid rgba(145, 158, 126, 0.55);
}

.viewer-media-overlay__nav button:disabled {
  cursor: default;
  opacity: 0.45;
}

.viewer-access-error {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(58, 52, 34, 0.38);
  backdrop-filter: blur(8px);
}

.viewer-access-error__card {
  width: min(30rem, 100%);
  border-radius: 18px;
  padding: 1.25rem;
  background: linear-gradient(160deg, rgba(252, 253, 249, 0.97) 0%, rgba(244, 248, 238, 0.96) 100%);
  border: 1px solid rgba(162, 174, 143, 0.36);
  box-shadow: 0 16px 40px rgba(44, 37, 21, 0.22);
  color: #273122;
}

.viewer-access-error__card h1 {
  margin: 0 0 0.45rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.viewer-access-error__card p {
  margin: 0;
  font-size: 0.92rem;
  color: rgba(54, 68, 46, 0.86);
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
