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
