<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import { AUDIO_CATEGORIES, AUDIO_TRACKS } from '../../config/audioLibrary.js'

const props = defineProps({
  addedTrackIds: {
    type: Array,
    default: () => []
  },
  selectedTrackId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'add-track', 'select-track'])

const selectedCategoryIds = ref(AUDIO_CATEGORIES.map((category) => category.id))
const currentTrackId = ref(null)
const activeAudio = ref(null)

const filteredTracks = computed(() => {
  const enabledCategories = new Set(selectedCategoryIds.value)

  return AUDIO_TRACKS.filter((track) => {
    if (!enabledCategories.has(track.categoryId)) {
      return false
    }

    return true
  })
})

const addedTrackIdSet = computed(() => new Set(props.addedTrackIds))

function handleClose() {
  stopActiveTrack()
  emit('close')
}

function isCategoryEnabled(categoryId) {
  return selectedCategoryIds.value.includes(categoryId)
}

function toggleCategory(categoryId) {
  const hasCategory = isCategoryEnabled(categoryId)

  if (!hasCategory) {
    selectedCategoryIds.value = [...selectedCategoryIds.value, categoryId]
    return
  }

  if (selectedCategoryIds.value.length <= 1) {
    return
  }

  selectedCategoryIds.value = selectedCategoryIds.value.filter((id) => id !== categoryId)
}

function stopActiveTrack() {
  if (!activeAudio.value) {
    currentTrackId.value = null
    return
  }

  activeAudio.value.pause()
  activeAudio.value.currentTime = 0
  activeAudio.value = null
  currentTrackId.value = null
}

function handleToggleTrack(track) {
  if (!track?.url) {
    return
  }

  if (currentTrackId.value === track.id) {
    stopActiveTrack()
    return
  }

  stopActiveTrack()

  const audio = new Audio(track.url)
  audio.onended = () => {
    currentTrackId.value = null
    activeAudio.value = null
  }

  activeAudio.value = audio
  currentTrackId.value = track.id
  audio.play().catch(() => {
    stopActiveTrack()
  })
}

function isTrackAdded(trackId) {
  return addedTrackIdSet.value.has(trackId)
}

function isTrackSelected(trackId) {
  return props.selectedTrackId === trackId
}

function handleAddTrack(track) {
  emit('add-track', track)
}

function handleSelectTrack(trackId) {
  if (!isTrackAdded(trackId)) {
    return
  }

  emit('select-track', trackId)
}

onBeforeUnmount(() => {
  stopActiveTrack()
})
</script>

<template>
  <OverlayCard class="sounds-library" aria-label="Geluidenbibliotheek">
    <header class="library-header">
      <div class="library-heading">
        <h2 class="library-title">Geluiden</h2>
        <button
          type="button"
          class="library-info"
          aria-label="Geluiden uitleg"
          data-tooltip="Filter op ambient, muziek of allebei en klik op een track om te luisteren."
        >
          i
        </button>
      </div>
      <OverlayButton class="close-button" label="Sluiten" @click="handleClose" />
    </header>

    <div class="category-filters" role="group" aria-label="Categorieën filteren">
      <button
        v-for="category in AUDIO_CATEGORIES"
        :key="category.id"
        type="button"
        class="category-chip"
        :class="{ 'category-chip--active': isCategoryEnabled(category.id) }"
        @click="toggleCategory(category.id)"
      >
        {{ category.label }}
      </button>
    </div>

    <p v-if="!filteredTracks.length" class="library-status">
      Geen resultaten voor de gekozen filter.
    </p>

    <div v-else class="tracks-list">
      <article
        v-for="track in filteredTracks"
        :key="track.id"
        class="track-row"
        :class="{
          'track-row--previewing': currentTrackId === track.id,
          'track-row--selected': isTrackSelected(track.id)
        }"
      >
        <button
          type="button"
          class="track-meta"
          :class="{ 'track-meta--clickable': isTrackAdded(track.id) }"
          :title="isTrackAdded(track.id) ? 'Selecteer toegevoegd geluid' : ''"
          @click="handleSelectTrack(track.id)"
        >
          <span class="track-title">{{ track.label }}</span>
          <span class="track-category">{{ track.categoryId === 'ambient' ? 'Ambient' : 'Muziek' }}</span>
        </button>

        <div class="track-actions">
          <button
            type="button"
            class="track-action-button"
            :class="{ 'track-action-button--active': currentTrackId === track.id }"
            @click="handleToggleTrack(track)"
          >
            {{ currentTrackId === track.id ? 'Stop' : 'Beluister' }}
          </button>
          <button
            type="button"
            class="track-action-button"
            :class="{ 'track-action-button--active': isTrackAdded(track.id) }"
            @click="handleAddTrack(track)"
          >
            {{ isTrackAdded(track.id) ? 'Toegevoegd' : 'Voeg toe' }}
          </button>
        </div>
      </article>
    </div>
  </OverlayCard>
</template>

<style scoped>
.sounds-library {
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
  border: 1px solid rgba(88, 103, 72, 0.45);
  border-radius: 999px;
  background: rgba(246, 247, 252, 0.86);
  color: #4e5b41;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
  cursor: help;
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

.category-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.38rem;
  margin-top: 0.84rem;
  margin-bottom: 0.62rem;
}

.category-chip {
  padding: 0.46rem 0.56rem;
  border-radius: 0.58rem;
  border: 1px solid rgba(124, 138, 110, 0.38);
  background: #f2f5ea;
  color: rgba(68, 80, 56, 0.92);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 130ms ease, border-color 130ms ease, color 130ms ease;
}

.category-chip--active {
  background: linear-gradient(180deg, #9fb383, #8a9e70);
  border-color: rgba(96, 115, 71, 0.82);
  color: #f8fbf2;
}

.library-status {
  margin: 0;
  color: rgba(68, 80, 56, 0.76);
  font-size: 0.84rem;
  text-align: center;
  padding: 0.68rem 0;
}

.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 0.34rem;
  max-height: min(18.5rem, calc(100vh - 15rem));
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 0.7rem;
  scrollbar-gutter: stable;
}

.track-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  padding: 0.48rem 0.56rem;
  border: 1px solid rgba(124, 138, 110, 0.3);
  border-radius: 0.58rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  text-align: left;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.track-row:hover {
  border-color: rgba(114, 131, 98, 0.55);
  box-shadow: 0 2px 8px rgba(73, 88, 60, 0.12);
}

.track-row--previewing,
.track-row--selected {
  border-color: rgba(97, 118, 72, 0.84);
  box-shadow: 0 0 0 2px rgba(150, 170, 128, 0.2) inset;
}

.track-meta {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 0;
  flex: 1;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
}

.track-meta--clickable {
  cursor: pointer;
}

.track-title {
  color: #4e5b41;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.16;
  word-break: break-word;
}

.track-category {
  color: rgba(68, 80, 56, 0.78);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.track-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
  flex: 0 0 auto;
}

.track-action-button {
  min-width: 0;
  padding: 0.28rem 0.46rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(124, 138, 110, 0.48);
  background: #f6f8f2;
  color: rgba(68, 80, 56, 0.9);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 130ms ease, border-color 130ms ease, color 130ms ease;
}

.track-action-button:hover {
  border-color: rgba(96, 115, 71, 0.72);
}

.track-action-button--active {
  background: linear-gradient(180deg, #9fb383, #8a9e70);
  border-color: rgba(96, 115, 71, 0.82);
  color: #f8fbf2;
}

@media (max-width: 900px) {
  .sounds-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>
