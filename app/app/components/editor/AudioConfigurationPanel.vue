<script setup>
import { computed } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const props = defineProps({
  selectedAudio: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'update-volume', 'remove-audio'])

const volumePercent = computed(() => {
  const volume = Number(props.selectedAudio?.defaultVolume)

  if (!Number.isFinite(volume)) {
    return 60
  }

  return Math.round(Math.min(1, Math.max(0, volume)) * 100)
})

function handleClose() {
  emit('close')
}

function handleVolumeInput(event) {
  const nextValue = Number.parseFloat(event?.target?.value)

  if (!Number.isFinite(nextValue)) {
    return
  }

  emit('update-volume', Math.min(1, Math.max(0, nextValue / 100)))
}

function handleRemoveAudio() {
  emit('remove-audio')
}
</script>

<template>
  <OverlayCard class="audio-config-panel" aria-label="Audioconfiguratie">
    <header class="panel-header">
      <h2 class="panel-title">Audio geselecteerd</h2>
      <OverlayButton class="close-button" label="Sluiten" @click="handleClose" />
    </header>

    <div class="panel-body">
      <p class="audio-name">{{ selectedAudio?.label }}</p>
      <p class="audio-category">{{ selectedAudio?.categoryId === 'ambient' ? 'Ambient' : 'Muziek' }}</p>

      <div class="volume-row">
        <span class="volume-label">Standaard volume</span>
        <span class="volume-value">{{ volumePercent }}%</span>
      </div>

      <input
        class="volume-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="volumePercent"
        @input="handleVolumeInput"
      >

      <button type="button" class="remove-button" @click="handleRemoveAudio">
        Verwijder audio
      </button>
    </div>
  </OverlayCard>
</template>

<style scoped>
.audio-config-panel {
  top: 50%;
  right: 1.5rem;
  transform: translateY(-50%);
  z-index: 3;
  width: min(20rem, calc(100vw - 2rem));
  padding: 0;
  border-radius: 0.9rem;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.88rem 0.9rem 0.7rem;
  background: rgba(244, 247, 240, 0.96);
  border-radius: 0.9rem;
}

.panel-title {
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

.panel-body {
  margin-top: 0.5rem;
  padding: 0.86rem;
  background: #c2c6d8;
  border-radius: 0.9rem;
  display: grid;
  gap: 0.56rem;
}

.audio-name {
  margin: 0;
  color: #333b57;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.3;
}

.audio-category {
  margin: -0.2rem 0 0;
  color: rgba(51, 59, 87, 0.74);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.volume-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.volume-label {
  color: #4f5068;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.volume-value {
  color: #4f5068;
  font-size: 0.8rem;
  font-weight: 800;
}

.volume-slider {
  width: 100%;
  accent-color: #5f6f4b;
}

.remove-button {
  justify-self: start;
  margin-top: 0.14rem;
  border: 1px solid rgba(137, 47, 31, 0.42);
  border-radius: 0.58rem;
  padding: 0.4rem 0.62rem;
  background: linear-gradient(180deg, #ef6a53, #dc4f3a);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}

.remove-button:hover {
  border-color: rgba(137, 47, 31, 0.62);
}

@media (max-width: 900px) {
  .audio-config-panel {
    right: 1rem;
    top: auto;
    bottom: 12.4rem;
    transform: none;
    width: min(20rem, calc(100vw - 2rem));
  }
}
</style>
