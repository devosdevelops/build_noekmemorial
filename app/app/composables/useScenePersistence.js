import { ref } from 'vue'
import { useAuth } from './useAuth'

export function useScenePersistence() {
  const persistenceStatus = ref('idle')
  const persistenceError = ref('')
  const lastSavedSceneId = ref('')
  const latestLoadedScene = ref(null)
  const workspaceId = ref('')

  async function buildAuthHeaders() {
    const { init, session } = useAuth()
    await init()

    const token = session.value?.access_token
    if (!token) {
      throw new Error('Je sessie is verlopen. Log opnieuw in om de editor op te slaan.')
    }

    return {
      authorization: `Bearer ${token}`
    }
  }

  async function saveSceneDocument(sceneDocument) {
    persistenceStatus.value = 'saving'
    persistenceError.value = ''

    try {
      if (!workspaceId.value || !workspaceId.value.length) {
        throw new Error('Werkruimte-ID ontbreekt. Open de editor vanuit een ruimte in je dashboard.')
      }

      const headers = await buildAuthHeaders()

      const response = await $fetch('/api/scenes/save', {
        method: 'POST',
        headers,
        body: {
          sceneDocument,
          sceneId: lastSavedSceneId.value || null,
          workspaceId: workspaceId.value
        }
      })

      const savedId = typeof response?.scene?.id === 'string' ? response.scene.id : ''
      if (savedId) {
        lastSavedSceneId.value = savedId
      }

      persistenceStatus.value = 'saved'
      return response
    } catch (error) {
      persistenceStatus.value = 'error'
      persistenceError.value = error?.data?.statusMessage || error?.message || 'Opslaan van de scène is mislukt.'
      return null
    }
  }

  async function loadSceneDocument(sceneId = '') {
    persistenceStatus.value = 'loading'
    persistenceError.value = ''

    try {
      if (!workspaceId.value || !workspaceId.value.length) {
        throw new Error('Werkruimte-ID ontbreekt. Open de editor vanuit een ruimte in je dashboard.')
      }

      const headers = await buildAuthHeaders()

      const endpoint = sceneId && sceneId.length
        ? `/api/scenes/${encodeURIComponent(sceneId)}`
        : '/api/scenes/latest'

      const query = sceneId && sceneId.length
        ? undefined
        : { workspaceId: workspaceId.value }

      const response = await $fetch(endpoint, { headers, query })
      latestLoadedScene.value = response?.scene?.scene_data ?? null

      if (typeof response?.scene?.id === 'string') {
        lastSavedSceneId.value = response.scene.id
      }

      persistenceStatus.value = 'idle'
      return response
    } catch (error) {
      persistenceStatus.value = 'error'
      persistenceError.value = error?.data?.statusMessage || error?.message || 'Laden van de scène is mislukt.'
      return null
    }
  }

  return {
    persistenceStatus,
    persistenceError,
    lastSavedSceneId,
    latestLoadedScene,
    workspaceId,
    saveSceneDocument,
    loadSceneDocument
  }
}
