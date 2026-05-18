<script setup>
import { onMounted, ref } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import { POLY_PIZZA_LIST_IDS } from '../../config/polypizza.js'

const emit = defineEmits(['close', 'select-model'])

async function fetchList(listId) {
  const res = await fetch(`/api/polypizza/list/${encodeURIComponent(listId)}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch list "${listId}": ${res.status}`)
  }
  const data = await res.json()
  return Array.isArray(data?.Models) ? data.Models : []
}

function mergeAndDeduplicate(arrays) {
  const seen = new Set()
  const result = []
  for (const models of arrays) {
    for (const model of models) {
      if (model?.ID && !seen.has(model.ID)) {
        seen.add(model.ID)
        result.push(model)
      }
    }
  }
  return result
}

const models = ref([])
const isLoading = ref(false)
const loadError = ref(null)

async function loadModels() {
  if (!POLY_PIZZA_LIST_IDS.length) return
  isLoading.value = true
  loadError.value = null
  try {
    const results = await Promise.all(POLY_PIZZA_LIST_IDS.map(fetchList))
    models.value = mergeAndDeduplicate(results)
  } catch (err) {
    loadError.value = err.message ?? 'Failed to load models.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadModels)

function handleClose() {
  emit('close')
}

function handleSelectModel(model) {
  emit('select-model', {
    id: model.ID,
    title: model.Title,
    downloadUrl: model.Download,
    attribution: model.Attribution ?? '',
    licence: model.Licence ?? ''
  })
}
</script>

<template>
  <OverlayCard class="models-library" aria-label="Models library">
    <header class="library-header">
      <h2 class="library-title">Models</h2>
      <OverlayButton class="close-button" label="Close" @click="handleClose" />
    </header>

    <p class="library-subtitle">Pick a 3D model to add to the scene.</p>

    <p v-if="isLoading" class="library-status">Loading models…</p>
    <p v-else-if="loadError" class="library-status library-status--error">{{ loadError }}</p>
    <p v-else-if="!models.length" class="library-status">No models available.</p>

    <div v-else class="models-grid">
      <button
        v-for="model in models"
        :key="model.ID"
        type="button"
        class="model-card"
        :title="model.Title"
        @click="handleSelectModel(model)"
      >
        <img
          v-if="model.Thumbnail"
          :src="model.Thumbnail"
          :alt="model.Title"
          class="model-thumbnail"
          loading="lazy"
        />
        <span class="model-label">{{ model.Title }}</span>
      </button>
    </div>
  </OverlayCard>
</template>

<style scoped>
.models-library {
  top: 28%;
  left: calc(1.5rem + 10.2rem + 16px);
  z-index: 3;
  width: min(22rem, calc(100vw - 2rem));
  padding: 0.9rem;
  border-radius: 0.9rem;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.library-title {
  margin: 0;
  color: #4e5b41;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.close-button {
  padding: 0.42rem 0.62rem;
  font-size: 0.84rem;
}

.library-subtitle {
  margin: 0.66rem 0 0.72rem;
  color: rgba(68, 80, 56, 0.82);
  font-size: 0.88rem;
}

.library-placeholder {
  margin: 0;
  color: rgba(68, 80, 56, 0.5);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem 0;
}

.library-status {
  margin: 0;
  color: rgba(68, 80, 56, 0.5);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem 0;
}

.library-status--error {
  color: #b94040;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  max-height: 22rem;
  overflow-y: auto;
}

.model-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem;
  border: 1px solid rgba(124, 138, 110, 0.28);
  border-radius: 0.6rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease;
  text-align: center;
}

.model-card:hover {
  border-color: rgba(114, 131, 98, 0.55);
  box-shadow: 0 2px 8px rgba(73, 88, 60, 0.12);
}

.model-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.4rem;
  background: rgba(68, 80, 56, 0.06);
}

.model-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #4e5b41;
  line-height: 1.2;
  word-break: break-word;
}

@media (max-width: 900px) {
  .models-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>
