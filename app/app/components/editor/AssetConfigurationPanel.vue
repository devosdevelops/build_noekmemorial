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
const activeMaterialTab = ref('color')
const selectedTexturePreviewId = ref('sandstone')

const texturePreviewOptions = [
  {
    id: 'sandstone',
    name: 'Zandsteen',
    detail: 'Warm en zacht'
  },
  {
    id: 'marble',
    name: 'Marmer',
    detail: 'Helder contrast'
  },
  {
    id: 'basalt',
    name: 'Basalt',
    detail: 'Diepe structuur'
  },
  {
    id: 'linen',
    name: 'Linnen',
    detail: 'Subtiel geweven'
  }
]

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

watch(
  () => props.selectedAsset?.objectId,
  () => {
    activeMaterialTab.value = 'color'
    selectedTexturePreviewId.value = 'sandstone'
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

function setMaterialTab(tabId) {
  activeMaterialTab.value = tabId
}

function selectTexturePreview(textureId) {
  selectedTexturePreviewId.value = textureId
}
</script>

<template>
  <OverlayCard class="asset-config-panel" aria-label="Assetconfiguratie">
    <header class="panel-header">
      <h2 class="panel-title">{{ panelTitle }}</h2>
      <OverlayButton class="close-button" label="Sluiten" @click="handleClose" />
    </header>

    <section v-if="isBlockAsset" class="material-controls" aria-label="Materiaalconfiguratie">
      <div class="material-tabs" role="tablist" aria-label="Materiaal tabs">
        <button
          type="button"
          role="tab"
          class="material-tab"
          :class="{ 'material-tab--active': activeMaterialTab === 'color' }"
          :aria-selected="activeMaterialTab === 'color'"
          @click="setMaterialTab('color')"
        >
          Kleur
        </button>
        <button
          type="button"
          role="tab"
          class="material-tab"
          :class="{ 'material-tab--active': activeMaterialTab === 'texture' }"
          :aria-selected="activeMaterialTab === 'texture'"
          @click="setMaterialTab('texture')"
        >
          Textuur
        </button>
      </div>

      <div v-if="activeMaterialTab === 'color'" class="material-panel" role="tabpanel" aria-label="Kleur tab">
        <div class="section-heading">
          <h3 class="section-title">Kleur</h3>
          <button
            type="button"
            class="section-info"
            aria-label="Kleur uitleg"
            data-tooltip="Pas de blokkleur direct aan met de kleurenschijf."
          >
            i
          </button>
        </div>
        <ColorDiskPicker :model-value="currentColor" @update:model-value="handleColorChange" />
      </div>

      <div v-else class="material-panel" role="tabpanel" aria-label="Textuur tab">
        <h3 class="section-title">Textuurstijl</h3>
        <p class="section-copy">Voorbeeld van textuurinstellingen. Koppeling volgt in de volgende stap.</p>

        <div class="texture-grid">
          <button
            v-for="texture in texturePreviewOptions"
            :key="texture.id"
            type="button"
            class="texture-tile"
            :class="{ 'texture-tile--active': selectedTexturePreviewId === texture.id }"
            @click="selectTexturePreview(texture.id)"
          >
            <span class="texture-tile__swatch" :class="`texture-tile__swatch--${texture.id}`" />
            <span class="texture-tile__name">{{ texture.name }}</span>
            <span class="texture-tile__detail">{{ texture.detail }}</span>
          </button>
        </div>

        <div class="texture-meta">
          <div class="texture-meta__row">
            <span class="texture-meta__label">Schaal</span>
            <span class="texture-meta__value">100%</span>
          </div>
          <div class="texture-meta__row">
            <span class="texture-meta__label">Ruwheid</span>
            <span class="texture-meta__value">Medium</span>
          </div>
        </div>
      </div>
    </section>

    <p v-else class="section-copy section-copy--compact">
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

.material-controls {
  --surface-color: #c2c6d8;
  --tab-inactive-color: #f6f6f2;
  margin-top: 0.64rem;
  background: var(--surface-color);
  border: 1px solid rgba(124, 132, 160, 0.35);
  border-radius: 1rem;
  overflow: visible;
}

.material-tabs {
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-bottom: 0;
  background: transparent;
}

.material-tab {
  flex: 1;
  border: 0;
  border-radius: 0;
  padding: 0.72rem 0.64rem 0.7rem;
  color: #737399;
  background: var(--tab-inactive-color);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.material-tab--active {
  background: var(--surface-color);
  color: #1f2132;
}

.material-tab:first-child {
  border-top-left-radius: 1rem;
}

.material-tab:last-child {
  border-top-right-radius: 1rem;
}

.material-panel {
  display: grid;
  gap: 0.44rem;
  padding: 0.8rem 0.78rem 0.78rem;
  background: var(--surface-color);
}

.section-title {
  margin: 0;
  color: #4f5068;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.44rem;
}

.section-info {
  position: relative;
  width: 1.05rem;
  height: 1.05rem;
  border: 1px solid rgba(83, 88, 117, 0.45);
  border-radius: 999px;
  background: rgba(246, 247, 252, 0.86);
  color: #4f5473;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
  cursor: help;
}

.section-info::after {
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

.section-info::before {
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

.section-info:hover::after,
.section-info:hover::before,
.section-info:focus-visible::after,
.section-info:focus-visible::before {
  opacity: 1;
  visibility: visible;
}

.section-copy {
  margin: 0.42rem 0 0;
  color: rgba(69, 71, 91, 0.88);
  font-size: 0.88rem;
  line-height: 1.35;
}

.section-copy--compact {
  margin-top: 0.8rem;
}

.texture-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.46rem;
  margin-top: 0.2rem;
}

.texture-tile {
  border: 1px solid rgba(124, 138, 110, 0.35);
  border-radius: 0.62rem;
  padding: 0.4rem;
  background: rgba(247, 250, 243, 0.88);
  display: grid;
  gap: 0.2rem;
  text-align: left;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.texture-tile:hover {
  transform: translateY(-1px);
}

.texture-tile--active {
  border-color: rgba(97, 118, 72, 0.75);
  box-shadow: 0 0 0 1px rgba(97, 118, 72, 0.2);
}

.texture-tile__swatch {
  display: block;
  width: 100%;
  height: 2rem;
  border-radius: 0.45rem;
  border: 1px solid rgba(80, 95, 65, 0.14);
}

.texture-tile__swatch--sandstone {
  background: linear-gradient(140deg, #d8c4a0, #b98f69);
}

.texture-tile__swatch--marble {
  background: linear-gradient(140deg, #f2f2f2, #ced4dc);
}

.texture-tile__swatch--basalt {
  background: linear-gradient(140deg, #777f86, #4d545c);
}

.texture-tile__swatch--linen {
  background: linear-gradient(140deg, #d8ceb8, #c2b299);
}

.texture-tile__name {
  color: rgba(64, 75, 53, 0.94);
  font-size: 0.79rem;
  font-weight: 700;
}

.texture-tile__detail {
  color: rgba(85, 98, 71, 0.78);
  font-size: 0.73rem;
}

.texture-meta {
  margin-top: 0.26rem;
  border: 1px solid rgba(123, 138, 108, 0.28);
  border-radius: 0.65rem;
  background: rgba(246, 250, 241, 0.66);
  padding: 0.52rem 0.6rem;
  display: grid;
  gap: 0.38rem;
}

.texture-meta__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.texture-meta__label {
  color: rgba(79, 91, 66, 0.86);
  font-size: 0.78rem;
  font-weight: 600;
}

.texture-meta__value {
  color: rgba(52, 63, 40, 0.9);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

@media (max-width: 900px) {
  .asset-config-panel {
    top: auto;
    right: 1rem;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }

  .material-tab {
    font-size: 0.94rem;
    padding: 0.64rem 0.5rem;
  }
}
</style>
