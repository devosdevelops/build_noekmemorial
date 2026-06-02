<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import { FLOOR_TEXTURE_OPTIONS } from '../../config/floorTextures.js'

const emit = defineEmits(['close', 'select-floor'])

function handleClose() {
  emit('close')
}

function handleSelectFloor(textureId) {
  if (typeof textureId !== 'string' || !textureId.length) {
    return
  }

  emit('select-floor', textureId)
}
</script>

<template>
  <OverlayCard class="floors-library" aria-label="Vloerenbibliotheek">
    <header class="library-header">
      <h2 class="library-title">Vloeren</h2>
      <OverlayButton class="close-button" label="Sluiten" @click="handleClose" />
    </header>

    <p class="library-subtitle">Kies een vloerafwerking om direct op de vloer toe te passen.</p>

    <div class="floors-grid">
      <button
        v-for="floor in FLOOR_TEXTURE_OPTIONS"
        :key="floor.id"
        type="button"
        class="floor-card"
        :title="floor.label"
        @click="handleSelectFloor(floor.id)"
      >
        <img
          v-if="floor.previewUrl"
          :src="floor.previewUrl"
          :alt="floor.label"
          class="floor-thumbnail"
          loading="lazy"
        />
        <span v-else class="floor-thumbnail floor-thumbnail--fallback" />
        <span class="floor-label">{{ floor.label }}</span>
      </button>
    </div>
  </OverlayCard>
</template>

<style scoped>
.floors-library {
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

.floors-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  max-height: 22rem;
  overflow-y: auto;
}

.floor-card {
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

.floor-card:hover {
  border-color: rgba(114, 131, 98, 0.55);
  box-shadow: 0 2px 8px rgba(73, 88, 60, 0.12);
}

.floor-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.4rem;
  background: rgba(68, 80, 56, 0.06);
}

.floor-thumbnail--fallback {
  display: block;
  background: linear-gradient(135deg, #d5dec8, #eef3e5);
}

.floor-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #4e5b41;
  line-height: 1.2;
  word-break: break-word;
}

@media (max-width: 900px) {
  .floors-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>