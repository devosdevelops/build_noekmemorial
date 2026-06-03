<script setup>
import CloseIconButton from '../ui/CloseIconButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import { LIGHTING_PRESETS } from '../../config/lightingPresets.js'

const props = defineProps({
  currentPresetId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'select-lighting-preset'])

function handleClose() {
  emit('close')
}

function handleSelectPreset(presetId) {
  emit('select-lighting-preset', presetId)
}
</script>

<template>
  <OverlayCard class="lighting-library" aria-label="Lichtinstellingen">
    <header class="library-header">
      <div class="library-heading">
        <h2 class="library-title">Licht</h2>
        <button
          type="button"
          class="library-info"
          aria-label="Licht uitleg"
          data-tooltip="Kies een lichtsfeer voor de scene. Je kunt helderder of gedimder gaan, en warmer of koeler."
        >
          i
        </button>
      </div>
      <CloseIconButton @click="handleClose" />
    </header>

    <p class="library-copy">Pas de sfeer van de scene aan met een van deze lichtpresets.</p>

    <div class="lighting-grid">
      <button
        v-for="preset in LIGHTING_PRESETS"
        :key="preset.id"
        type="button"
        class="lighting-card"
        :class="{ 'lighting-card--active': currentPresetId === preset.id }"
        :title="preset.label"
        @click="handleSelectPreset(preset.id)"
      >
        <span class="lighting-card__preview" :style="{ background: `linear-gradient(180deg, ${preset.background}, ${preset.fog})` }" />
        <span class="lighting-card__label">{{ preset.label }}</span>
        <span class="lighting-card__description">{{ preset.description }}</span>
      </button>
    </div>
  </OverlayCard>
</template>

<style scoped>
.lighting-library {
  top: 28%;
  left: calc(14.2rem + 0.8rem);
  z-index: 3;
  width: min(22rem, calc(100vw - 2rem));
  padding: 0.9rem;
  border-radius: 0.9rem;
}
  
@media (max-width: 900px) {
  .lighting-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
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

.library-copy {
  margin: 0.62rem 0 0.58rem;
  color: rgba(68, 80, 56, 0.82);
  font-size: 0.88rem;
}

.lighting-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.34rem;
  max-height: min(18.5rem, calc(100vh - 15rem));
  overflow-y: auto;
  padding-right: 0.2rem;
  scrollbar-gutter: stable;
}

.lighting-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.18rem;
  padding: 0.28rem;
  border: 1px solid rgba(124, 138, 110, 0.28);
  border-radius: 0.56rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  cursor: pointer;
  text-align: left;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease;
}

.lighting-card:hover {
  border-color: rgba(114, 131, 98, 0.55);
  box-shadow: 0 2px 8px rgba(73, 88, 60, 0.12);
  transform: translateY(-1px);
}

.lighting-card--active {
  border-color: rgba(97, 118, 72, 0.84);
  box-shadow: 0 0 0 2px rgba(150, 170, 128, 0.2) inset;
}

.lighting-card__preview {
  display: block;
  aspect-ratio: 1.75;
  border-radius: 0.38rem;
  border: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.18);
}

.lighting-card__label {
  color: #4e5b41;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1.1;
}

.lighting-card__description {
  color: rgba(68, 80, 56, 0.78);
  font-size: 0.66rem;
  line-height: 1.15;
}

@media (max-width: 900px) {
  .lighting-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>
