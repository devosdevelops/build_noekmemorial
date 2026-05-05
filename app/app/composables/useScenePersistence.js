import { ref } from 'vue'

export function useScenePersistence() {
  const persistenceStatus = ref('idle')
  const persistenceError = ref('')
  const lastSavedSceneId = ref('')
  const latestLoadedScene = ref(null)

  async function saveSceneDocument(sceneDocument) {
    persistenceStatus.value = 'saving'
    persistenceError.value = ''

    try {
      const response = await $fetch('/api/scenes/save', {
        method: 'POST',
        body: {
          sceneDocument,
          sceneId: lastSavedSceneId.value || null
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
      persistenceError.value = error?.data?.statusMessage || error?.message || 'Failed to save scene.'
      return null
    }
  }

  async function loadSceneDocument(sceneId = '') {
    persistenceStatus.value = 'loading'
    persistenceError.value = ''

    try {
      const endpoint = sceneId && sceneId.length
        ? `/api/scenes/${encodeURIComponent(sceneId)}`
        : '/api/scenes/latest'

      const response = await $fetch(endpoint)
      latestLoadedScene.value = response?.scene?.scene_data ?? null

      if (typeof response?.scene?.id === 'string') {
        lastSavedSceneId.value = response.scene.id
      }

      persistenceStatus.value = 'idle'
      return response
    } catch (error) {
      persistenceStatus.value = 'error'
      persistenceError.value = error?.data?.statusMessage || error?.message || 'Failed to load scene.'
      return null
    }
  }

  return {
    persistenceStatus,
    persistenceError,
    lastSavedSceneId,
    latestLoadedScene,
    saveSceneDocument,
    loadSceneDocument
  }
}
