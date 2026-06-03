<script setup>
import { computed, onMounted, ref } from 'vue'
import CloseIconButton from '../ui/CloseIconButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import { POLY_PIZZA_LISTS, POLY_PIZZA_LIST_CATEGORY } from '../../config/polypizza.js'

const emit = defineEmits(['close', 'select-model'])
const MIN_LOADING_SPINNER_MS = 1000

async function fetchList(listConfig) {
  const listId = listConfig?.id

  if (typeof listId !== 'string' || !listId.length) {
    return []
  }

  const res = await fetch(`/api/polypizza/list/${encodeURIComponent(listId)}`)
  if (!res.ok) {
    throw new Error(`Lijst "${listId}" kon niet worden opgehaald: ${res.status}`)
  }
  const data = await res.json()
  const category = typeof listConfig?.category === 'string' && listConfig.category.length
    ? listConfig.category
    : POLY_PIZZA_LIST_CATEGORY.MODEL

  return Array.isArray(data?.Models)
    ? data.Models.map((model) => ({
        ...model,
        libraryCategory: category
      }))
    : []
}

function mergeAndDeduplicate(arrays) {
  const seen = new Set()
  const result = []
  for (const models of arrays) {
    for (const model of models) {
      if (!model?.ID) {
        continue
      }

      if (!seen.has(model.ID)) {
        seen.add(model.ID)
        result.push(model)
        continue
      }

      const existingIndex = result.findIndex((entry) => entry?.ID === model.ID)
      if (existingIndex < 0) {
        continue
      }

      const existing = result[existingIndex]
      const existingCategory = existing?.libraryCategory
      const nextCategory = model?.libraryCategory
      const shouldPromoteCategory =
        existingCategory === POLY_PIZZA_LIST_CATEGORY.MODEL
        && nextCategory
        && nextCategory !== POLY_PIZZA_LIST_CATEGORY.MODEL

      if (shouldPromoteCategory) {
        result[existingIndex] = {
          ...existing,
          libraryCategory: nextCategory
        }
      }
    }
  }
  return result
}

const models = ref([])
const isLoading = ref(false)
const loadError = ref(null)
const searchQuery = ref('')

function normalizeSearch(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function buildModelSearchText(model) {
  const tags = Array.isArray(model?.Tags) ? model.Tags.join(' ') : ''
  const creatorName = model?.Creator?.Username ?? ''
  return normalizeSearch(`${model?.Title ?? ''} ${model?.Category ?? ''} ${tags} ${creatorName}`)
}

const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)
const filteredModels = computed(() => {
  const query = normalizeSearch(searchQuery.value)
  if (!query.length) {
    return models.value
  }
  return models.value.filter((model) => buildModelSearchText(model).includes(query))
})

async function loadModels() {
  if (!POLY_PIZZA_LISTS.length) return
  const loadStartTime = Date.now()
  isLoading.value = true
  loadError.value = null
  try {
    const results = await Promise.all(POLY_PIZZA_LISTS.map(fetchList))
    models.value = mergeAndDeduplicate(results)
  } catch (err) {
    loadError.value = err.message ?? 'Modellen konden niet worden geladen.'
  } finally {
    const elapsedMs = Date.now() - loadStartTime
    const remainingMs = Math.max(0, MIN_LOADING_SPINNER_MS - elapsedMs)
    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs))
    }
    isLoading.value = false
  }
}

onMounted(loadModels)

function handleClose() {
  emit('close')
}

function handleSelectModel(model) {
  const category = typeof model?.libraryCategory === 'string' && model.libraryCategory.length
    ? model.libraryCategory
    : POLY_PIZZA_LIST_CATEGORY.MODEL

  emit('select-model', {
    id: model.ID,
    title: model.Title,
    downloadUrl: model.Download,
    attribution: model.Attribution ?? '',
    licence: model.Licence ?? '',
    libraryCategory: category,
    isSpecialMediaObject: category !== POLY_PIZZA_LIST_CATEGORY.MODEL
  })
}
</script>

<template>
  <OverlayCard class="models-library" aria-label="Modellenbibliotheek">
    <header class="library-header">
      <div class="library-heading">
        <h2 class="library-title">Modellen</h2>
        <button
          type="button"
          class="library-info"
          aria-label="Modellen uitleg"
          data-tooltip="Kies een 3D-model om aan de scene toe te voegen. Zoektermen werken momenteel in het Engels."
        />
      </div>
      <CloseIconButton @click="handleClose" />
    </header>

    <div v-if="isLoading" class="library-status library-status--loading" role="status" aria-live="polite">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>Modellenbibliotheek wordt geladen...</span>
    </div>
    <p v-else-if="loadError" class="library-status library-status--error">{{ loadError }}</p>
    <p v-else-if="!models.length" class="library-status">Geen modellen beschikbaar.</p>

    <template v-else>
      <label class="library-search" for="models-search-input">
        <span class="search-icon-wrap" aria-hidden="true">
          <span class="search-icon"></span>
        </span>
        <input
          id="models-search-input"
          v-model="searchQuery"
          class="library-search-input"
          type="search"
          placeholder="Zoeken..."
          autocomplete="off"
        />
      </label>

      <p v-if="hasSearchQuery && !filteredModels.length" class="library-status">
        Geen modellen gevonden voor "{{ searchQuery.trim() }}".
      </p>

      <div v-else class="models-grid">
        <button
          v-for="model in filteredModels"
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
        </button>
      </div>
    </template>
  </OverlayCard>
</template>

<style scoped>
.models-library {
  top: 28%;
  left: calc(14.2rem + 0.8rem);
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

.library-heading {
  display: flex;
  align-items: center;
  gap: 0.44rem;
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

.library-info {
  position: relative;
  width: 1.14rem;
  height: 1.14rem;
  border: 1px solid transparent;
  border-radius: 0.46rem;
  background-color: transparent;
  background-image: url('/icons/info.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 0.88rem 0.88rem;
  cursor: help;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.library-info:hover,
.library-info:focus-visible {
  border-color: rgba(124, 138, 110, 0.22);
  background-color: rgba(124, 138, 110, 0.08);
}

.library-info::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.58rem);
  transform: translateX(-50%);
  min-width: 13rem;
  max-width: 15rem;
  padding: 0.44rem 0.56rem;
  border-radius: 0.7rem;
  background: rgba(106, 106, 110, 0.97);
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.3;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 130ms ease;
  z-index: 4;
}

.library-info::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.22rem);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 0.34rem solid transparent;
  border-right: 0.34rem solid transparent;
  border-top: 0.38rem solid rgba(106, 106, 110, 0.97);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 130ms ease;
  z-index: 4;
}

.library-info:hover::after,
.library-info:hover::before,
.library-info:focus-visible::after,
.library-info:focus-visible::before {
  opacity: 1;
  visibility: visible;
}

.library-search {
  display: flex;
  align-items: stretch;
  width: 100%;
  margin-top: 0.62rem;
  margin-bottom: 0.72rem;
  border: 2px solid rgba(124, 138, 110, 0.68);
  border-radius: 0.95rem;
  background: rgba(249, 251, 245, 0.94);
  overflow: hidden;
}

.search-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  flex: 0 0 2.4rem;
  background: linear-gradient(180deg, #a6b88d, #8ea175);
}

.search-icon {
  position: relative;
  width: 0.74rem;
  height: 0.74rem;
  border: 2px solid #f8fbf2;
  border-radius: 999px;
}

.search-icon::after {
  content: '';
  position: absolute;
  width: 0.4rem;
  height: 2px;
  background: #f8fbf2;
  bottom: -0.22rem;
  right: -0.26rem;
  transform: rotate(45deg);
  border-radius: 999px;
}

.library-search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.56rem 0.72rem;
  color: #4e5b41;
  font-size: 1.02rem;
  font-weight: 600;
}

.library-search-input::placeholder {
  color: rgba(78, 91, 65, 0.48);
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

.library-status--loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  color: #4e5b41;
  font-weight: 700;
}

.loading-spinner {
  width: 0.95rem;
  height: 0.95rem;
  border: 2px solid rgba(78, 91, 65, 0.2);
  border-top-color: #4e5b41;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}

.library-status--error {
  color: #b94040;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

@media (max-width: 900px) {
  .models-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>
