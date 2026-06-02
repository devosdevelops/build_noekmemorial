<script setup>
import { computed, ref, watch } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import ColorDiskPicker from './ColorDiskPicker.vue'

const props = defineProps({
  selectedAsset: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'update-color'])

const currentColor = ref('#b4c9a6')

const panelTitle = computed(() => {
  if (!props.selectedAsset) {
    return 'Asset configureren'
  }

  if (props.selectedAsset.assetType === 'block') {
    return 'Blok configureren'
  }

  if (props.selectedAsset.assetType === 'floor') {
    return 'Vloer configureren'
  }

  if (props.selectedAsset.assetType === 'model') {
    return '3D-model configureren'
  }

  return 'Asset configureren'
})

const previewShapeClass = computed(() => {
  if (!props.selectedAsset || props.selectedAsset.assetType !== 'block') {
    return 'preview-shape--generic'
  }

  if (props.selectedAsset.assetId === 'sphere') {
    return 'preview-shape--sphere'
  }

  if (props.selectedAsset.assetId === 'cylinder') {
    return 'preview-shape--cylinder'
  }

  if (props.selectedAsset.assetId === 'cone') {
    return 'preview-shape--cone'
  }

  return 'preview-shape--square'
})

const isBlockAsset = computed(() => props.selectedAsset?.assetType === 'block')

watch(
  () => props.selectedAsset?.color,
  (nextColor) => {
    currentColor.value = typeof nextColor === 'string' && nextColor.length ? nextColor : '#b4c9a6'
  },
  { immediate: true }
)

function handleClose() {
  emit('close')
}

function handleColorChange(nextColor) {
  if (!isBlockAsset.value || typeof nextColor !== 'string' || !nextColor.length) {
    return
  }

  currentColor.value = nextColor
  emit('update-color', nextColor)
}
</script>

<template>
  <OverlayCard class="asset-config-panel" aria-label="Assetconfiguratie">
    <header class="panel-header">
      <h2 class="panel-title">{{ panelTitle }}</h2>
      <OverlayButton class="close-button" label="Sluiten" @click="handleClose" />
    </header>

    <p class="asset-name">{{ selectedAsset?.label ?? 'Geen selectie' }}</p>

    <section class="preview-section" aria-label="Objectvoorbeeld">
      <h3 class="section-title">Voorbeeld</h3>
      <div class="preview-canvas">
        <div class="preview-shape" :class="previewShapeClass" :style="{ background: currentColor }" />
      </div>
    </section>

    <section class="future-controls" aria-label="Materiaalkleur">
      <h3 class="section-title">Materiaal en kleur</h3>
      <p class="section-copy">Pas de blokkleur direct aan met de kleurenschijf.</p>
      <ColorDiskPicker
        v-if="isBlockAsset"
        :model-value="currentColor"
        @update:model-value="handleColorChange"
      />
    </section>

    <p v-if="!isBlockAsset" class="section-copy section-copy--compact">
      Dit paneel ondersteunt nu alleen kleurinstellingen voor geselecteerde blokken.
    </p>
  </OverlayCard>
</template>

<style scoped>
.asset-config-panel {
  top: 28%;
  right: 1.5rem;
  z-index: 3;
  width: min(20rem, calc(100vw - 2rem));
  padding: 0.9rem;
  border-radius: 0.9rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
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

.asset-name {
  margin: 0.66rem 0 0;
  color: rgba(68, 80, 56, 0.9);
  font-size: 0.96rem;
  font-weight: 700;
}

.preview-section,
.future-controls {
  margin-top: 0.76rem;
}

.section-title {
  margin: 0;
  color: #5a664d;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.preview-canvas {
  display: grid;
  place-items: center;
  margin-top: 0.48rem;
  min-height: 6.8rem;
  border: 1px solid rgba(124, 138, 110, 0.28);
  border-radius: 0.7rem;
  background: linear-gradient(170deg, rgba(246, 249, 241, 0.95), rgba(224, 233, 214, 0.88));
}

.preview-shape {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(180deg, #b8cba7, #95ab84);
}

.preview-shape--square {
  border-radius: 0.5rem;
}

.preview-shape--sphere {
  border-radius: 50%;
}

.preview-shape--cylinder {
  width: 3.2rem;
  height: 2.2rem;
  border-radius: 1.1rem;
}

.preview-shape--cone {
  width: 0;
  height: 0;
  border-left: 1.45rem solid transparent;
  border-right: 1.45rem solid transparent;
  border-bottom: 3rem solid #9eb28e;
  background: transparent;
}

.preview-shape--generic {
  border-radius: 0.42rem;
  transform: rotate(16deg);
}

.section-copy {
  margin: 0.42rem 0 0;
  color: rgba(68, 80, 56, 0.82);
  font-size: 0.88rem;
  line-height: 1.35;
}

.section-copy--compact {
  margin-top: 0.8rem;
}

@media (max-width: 900px) {
  .asset-config-panel {
    top: auto;
    right: 1rem;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>
