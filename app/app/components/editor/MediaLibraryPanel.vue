<script setup>
import { computed, onMounted, ref } from 'vue'
import CloseIconButton from '../ui/CloseIconButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import { POLY_PIZZA_LISTS, POLY_PIZZA_LIST_CATEGORY } from '../../config/polypizza.js'

const emit = defineEmits(['close', 'select-model'])
const MIN_LOADING_SPINNER_MS = 1000

const MEDIA_CATEGORIES = [
  POLY_PIZZA_LIST_CATEGORY.MESSAGE,
  POLY_PIZZA_LIST_CATEGORY.IMAGE_VIDEO,
  POLY_PIZZA_LIST_CATEGORY.AUDIO
]

const mediaCategoryLabel = {
  [POLY_PIZZA_LIST_CATEGORY.MESSAGE]: 'Bericht-objecten',
  [POLY_PIZZA_LIST_CATEGORY.IMAGE_VIDEO]: 'Foto / Video objecten',
  [POLY_PIZZA_LIST_CATEGORY.AUDIO]: 'Audio objecten'
}

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
      }
    }
  }

  return result
}

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

const models = ref([])
const isLoading = ref(false)
const loadError = ref(null)
const searchQuery = ref('')

const mediaListConfigs = computed(() => {
  return POLY_PIZZA_LISTS.filter((entry) => MEDIA_CATEGORIES.includes(entry.category))
})

const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)

const filteredModels = computed(() => {
  const query = normalizeSearch(searchQuery.value)
  if (!query.length) {
    return models.value
  }

  return models.value.filter((model) => buildModelSearchText(model).includes(query))
})

const groupedModels = computed(() => {
  const groups = MEDIA_CATEGORIES.map((category) => ({
    category,
    label: mediaCategoryLabel[category] || category,
    items: filteredModels.value.filter((model) => model.libraryCategory === category)
  }))

  return groups.filter((group) => group.items.length > 0)
})

async function loadModels() {
  if (!mediaListConfigs.value.length) {
    return
  }

  const loadStartTime = Date.now()
  isLoading.value = true
  loadError.value = null

  try {
    const results = await Promise.all(mediaListConfigs.value.map(fetchList))
    models.value = mergeAndDeduplicate(results)
  } catch (err) {
    loadError.value = err.message ?? 'Media objecten konden niet worden geladen.'
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
  const tags = Array.isArray(model?.Tags)
    ? model.Tags.filter((tag) => typeof tag === 'string' && tag.trim().length).map((tag) => tag.trim())
    : []

  emit('select-model', {
    id: model.ID,
    title: model.Title,
    downloadUrl: model.Download,
    attribution: model.Attribution ?? '',
    licence: model.Licence ?? '',
    libraryCategory: category,
    tags,
    isSpecialMediaObject: true
  })
}
</script>

<template>
  <OverlayCard class="media-library" aria-label="Mediabibliotheek">
    <header class="library-header">
      <div class="library-heading">
        <h2 class="library-title">Media</h2>
      </div>
      <CloseIconButton @click="handleClose" />
    </header>

    <div v-if="isLoading" class="library-status library-status--loading" role="status" aria-live="polite">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>Mediabibliotheek wordt geladen...</span>
    </div>
    <p v-else-if="loadError" class="library-status library-status--error">{{ loadError }}</p>
    <p v-else-if="!models.length" class="library-status">Geen media objecten beschikbaar.</p>

    <template v-else>
      <label class="library-search" for="media-search-input">
        <span class="search-icon-wrap" aria-hidden="true">
          <span class="search-icon"></span>
        </span>
        <input
          id="media-search-input"
          v-model="searchQuery"
          class="library-search-input"
          type="search"
          placeholder="Zoeken..."
          autocomplete="off"
        />
      </label>

      <p v-if="hasSearchQuery && !groupedModels.length" class="library-status">
        Geen media objecten gevonden voor "{{ searchQuery.trim() }}".
      </p>

      <div v-else class="media-groups">
        <section v-for="group in groupedModels" :key="group.category" class="media-group">
          <h3 class="media-group-title">{{ group.label }}</h3>
          <div class="models-grid">
            <button
              v-for="model in group.items"
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
        </section>
      </div>
    </template>
  </OverlayCard>
</template>

<style scoped>
.media-library {
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

.media-groups {
  display: grid;
  gap: 0.9rem;
}

.media-group {
  display: grid;
  gap: 0.5rem;
}

.media-group-title {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 800;
  color: #4e5b41;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  max-height: 10.8rem;
  overflow-y: auto;
  padding-right: 0.1rem;
}

.model-card {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(124, 138, 110, 0.35);
  border-radius: 0.62rem;
  background: linear-gradient(180deg, #ffffff, #f4f8ef);
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}

.model-card:hover {
  border-color: rgba(93, 117, 77, 0.78);
}

.model-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 900px) {
  .media-library {
    top: auto;
    bottom: 6.4rem;
    left: 0.8rem;
    width: min(19.4rem, calc(100vw - 1.6rem));
    transform: none;
  }
}
</style>