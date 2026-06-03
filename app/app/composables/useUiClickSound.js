import { onBeforeUnmount, onMounted, unref } from 'vue'

const CLICK_SOUND_URL = '/audio/sound_effects/click.mp3'
const DEFAULT_CLICK_VOLUME = 0.16
const MIN_PLAYBACK_INTERVAL_MS = 45

let lastPlaybackTime = 0
let sharedClickAudio = null

function getSharedClickAudio() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!sharedClickAudio) {
    const audio = new Audio(CLICK_SOUND_URL)
    audio.preload = 'auto'
    sharedClickAudio = audio
  }

  return sharedClickAudio
}

function isEventInsideContainer(event, containerRef) {
  const container = unref(containerRef)

  if (!container || typeof container.contains !== 'function') {
    return true
  }

  const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : null

  if (Array.isArray(eventPath) && eventPath.length > 0) {
    return eventPath.includes(container)
  }

  return container.contains(event.target)
}

export function useUiClickSound(options = {}) {
  const {
    containerRef = null,
    volume = DEFAULT_CLICK_VOLUME
  } = options

  function playClickSound() {
    const baseAudio = getSharedClickAudio()

    if (!baseAudio) {
      return
    }

    const now = Date.now()

    if (now - lastPlaybackTime < MIN_PLAYBACK_INTERVAL_MS) {
      return
    }

    lastPlaybackTime = now

    const clickAudio = baseAudio.cloneNode(true)
    clickAudio.volume = Math.min(1, Math.max(0, Number(volume) || DEFAULT_CLICK_VOLUME))
    clickAudio.currentTime = 0
    clickAudio.play().catch(() => {
      // Ignore autoplay or transient playback errors.
    })
  }

  function handleClick(event) {
    if (!event?.isTrusted) {
      return
    }

    if (!isEventInsideContainer(event, containerRef)) {
      return
    }

    playClickSound()
  }

  onMounted(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('click', handleClick, { capture: true, passive: true })
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('click', handleClick, { capture: true })
  })

  return {
    playClickSound
  }
}