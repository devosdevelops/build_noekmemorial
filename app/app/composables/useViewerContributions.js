import { ref } from 'vue'

export function useViewerContributions() {
  const room = ref(null)
  const scene = ref(null)
  const contributions = ref([])

  const roomLoading = ref(false)
  const roomError = ref('')

  const submitStatus = ref('idle')
  const submitError = ref('')

  async function loadRoomBySlug(slug, accessPin = '') {
    roomLoading.value = true
    roomError.value = ''

    try {
      const response = await $fetch(`/api/viewer/room/${encodeURIComponent(slug)}`, {
        query: accessPin.length
          ? { accessPin }
          : undefined
      })

      room.value = response?.room || null
      scene.value = response?.scene || null
      contributions.value = Array.isArray(response?.contributions)
        ? response.contributions
        : []

      return response
    } catch (error) {
      roomError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Ruimte laden is mislukt.'
      return null
    } finally {
      roomLoading.value = false
    }
  }

  async function submitMessage({
    slug,
    message,
    voiceUrl = '',
    guestName = '',
    selectedElementId = null,
    worldPosition = null,
    accessPin = '',
    accessToken = ''
  }) {
    submitStatus.value = 'submitting'
    submitError.value = ''

    try {
      const headers = accessToken.length
        ? { authorization: `Bearer ${accessToken}` }
        : undefined

      const response = await $fetch('/api/viewer/contributions/message', {
        method: 'POST',
        headers,
        body: {
          slug,
          message,
          voiceUrl,
          guestName,
          elementId: selectedElementId,
          worldPosition,
          accessPin
        }
      })

      submitStatus.value = 'success'
      return response
    } catch (error) {
      submitStatus.value = 'error'
      submitError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Bericht versturen is mislukt.'
      return null
    }
  }

  async function submitCandle({
    slug,
    dedication = '',
    candleStyle = 'Klassiek',
    guestName = '',
    selectedElementId = null,
    worldPosition = null,
    accessPin = '',
    accessToken = ''
  }) {
    submitStatus.value = 'submitting'
    submitError.value = ''

    try {
      const headers = accessToken.length
        ? { authorization: `Bearer ${accessToken}` }
        : undefined

      const response = await $fetch('/api/viewer/contributions/candle', {
        method: 'POST',
        headers,
        body: {
          slug,
          dedication,
          candleStyle,
          guestName,
          elementId: selectedElementId,
          worldPosition,
          accessPin
        }
      })

      submitStatus.value = 'success'
      return response
    } catch (error) {
      submitStatus.value = 'error'
      submitError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Kaars plaatsen is mislukt.'
      return null
    }
  }

  async function submitMedia({
    slug,
    mediaType,
    mediaUrl,
    title = '',
    caption = '',
    selectedElementId = null,
    worldPosition = null,
    accessPin = '',
    accessToken = ''
  }) {
    submitStatus.value = 'submitting'
    submitError.value = ''

    try {
      const headers = accessToken.length
        ? { authorization: `Bearer ${accessToken}` }
        : undefined

      const response = await $fetch('/api/viewer/contributions/media', {
        method: 'POST',
        headers,
        body: {
          slug,
          mediaType,
          mediaUrl,
          title,
          caption,
          elementId: selectedElementId,
          worldPosition,
          accessPin
        }
      })

      submitStatus.value = 'success'
      return response
    } catch (error) {
      submitStatus.value = 'error'
      submitError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Media plaatsen is mislukt.'
      return null
    }
  }

  return {
    room,
    scene,
    contributions,
    roomLoading,
    roomError,
    submitStatus,
    submitError,
    loadRoomBySlug,
    submitMessage,
    submitCandle,
    submitMedia
  }
}
