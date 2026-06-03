<script setup>
import { computed, ref, watch } from 'vue'
import { FLOOR_TEXTURE_OPTIONS } from '../../config/floorTextures.js'
import CloseIconButton from '../ui/CloseIconButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'
import ColorDiskPicker from './ColorDiskPicker.vue'

const props = defineProps({
  selectedAsset: {
    type: Object,
    default: null
  },
  defaultTab: {
    type: String,
    default: 'color'
  }
})

const emit = defineEmits(['close', 'update-color', 'update-color-target', 'update-texture', 'update-texture-scale'])

const currentColor = ref('#b4c9a6')
const activeMaterialTab = ref('color')
const selectedTexturePreviewId = ref('no-texture')
const textureScale = ref(1)
const selectedColorTarget = ref('all-materials')

const texturePreviewOptions = FLOOR_TEXTURE_OPTIONS.map((option) => ({
  id: option.id,
  name: option.id === 'no-texture' ? 'Standaard materiaal' : option.label,
  previewUrl: option.previewUrl
}))

const panelTitle = computed(() => {
  if (!props.selectedAsset) {
    return 'Asset configureren'
  }

  if (props.selectedAsset.assetType === 'block') {
    return 'Blok configureren'
  }

  if (props.selectedAsset.assetType === 'floor') {
    const label = typeof props.selectedAsset.label === 'string' && props.selectedAsset.label.length
      ? props.selectedAsset.label
      : 'Vloer'

    return `${label} configureren`
  }

  if (props.selectedAsset.assetType === 'model') {
    return '3D-model configureren'
  }

  return 'Asset configureren'
})

const isAssetWithMaterials = computed(() => {
  const type = props.selectedAsset?.assetType
  return type === 'block' || type === 'floor' || type === 'model'
})
const hasTextureControls = computed(() => {
  const type = props.selectedAsset?.assetType
  return type === 'block' || type === 'floor'
})
const modelMaterialTargets = computed(() => {
  if (props.selectedAsset?.assetType !== 'model') {
    return []
  }

  const targets = Array.isArray(props.selectedAsset.materialTargets)
    ? props.selectedAsset.materialTargets.filter((target) => {
        return target
          && typeof target.id === 'string'
          && target.id.length
          && typeof target.label === 'string'
          && target.label.length
      })
    : []

  return [{ id: 'all-materials', label: 'Alle materialen' }, ...targets]
})
const hasActiveTexture = computed(() => selectedTexturePreviewId.value !== 'no-texture')
const colorTooltipText = computed(() => {
  if (props.selectedAsset?.assetType === 'model') {
    return 'Klik een modelonderdeel aan of kies onderaan een doelmateriaal, en pas daarna de kleur aan.'
  }

  return 'Pas de kleur direct aan met de kleurenschijf.'
})

watch(
  () => props.selectedAsset?.color,
  (nextColor) => {
    const defaultColor = props.selectedAsset?.assetType === 'floor' ? '#7a8fa0' : '#b4c9a6'
    currentColor.value = typeof nextColor === 'string' && nextColor.length ? nextColor : defaultColor
  },
  { immediate: true }
)

watch(
  () => props.selectedAsset?.objectId,
  () => {
    if (hasTextureControls.value) {
      activeMaterialTab.value = props.defaultTab || (props.selectedAsset?.assetType === 'floor' ? 'texture' : 'color')
    } else {
      activeMaterialTab.value = 'color'
    }

    selectedTexturePreviewId.value = props.selectedAsset?.textureId || 'no-texture'
    selectedColorTarget.value = typeof props.selectedAsset?.selectedMaterialTarget === 'string'
      && props.selectedAsset.selectedMaterialTarget.length
      ? props.selectedAsset.selectedMaterialTarget
      : 'all-materials'
  },
  { immediate: true }
)

watch(
  () => props.selectedAsset?.selectedMaterialTarget,
  (nextTarget) => {
    selectedColorTarget.value = typeof nextTarget === 'string' && nextTarget.length
      ? nextTarget
      : 'all-materials'
  },
  { immediate: true }
)

watch(
  () => props.selectedAsset?.textureId,
  (nextTextureId) => {
    selectedTexturePreviewId.value = typeof nextTextureId === 'string' && nextTextureId.length
      ? nextTextureId
      : 'no-texture'
  },
  { immediate: true }
)

watch(
  () => props.selectedAsset?.textureScale,
  (nextTextureScale) => {
    textureScale.value = typeof nextTextureScale === 'number' && Number.isFinite(nextTextureScale)
      ? Math.min(4, Math.max(0.5, nextTextureScale))
      : 1
  },
  { immediate: true }
)

function handleClose() {
  emit('close')
}

function handleColorChange(nextColor) {
  if (!isAssetWithMaterials.value || typeof nextColor !== 'string' || !nextColor.length) {
    return
  }

  currentColor.value = nextColor
  emit('update-color', nextColor)
}

function setMaterialTab(tabId) {
  activeMaterialTab.value = tabId
}

function selectTexturePreview(textureId) {
  if (!isAssetWithMaterials.value || typeof textureId !== 'string' || !textureId.length) {
    return
  }

  selectedTexturePreviewId.value = textureId
  emit('update-texture', textureId)
}

function handleTextureScaleInput(event) {
  if (!hasActiveTexture.value) {
    return
  }

  const nextScale = Number.parseFloat(event?.target?.value)

  if (!Number.isFinite(nextScale)) {
    return
  }

  textureScale.value = nextScale
  emit('update-texture-scale', nextScale)
}

function handleColorTargetChange(event) {
  const nextTarget = typeof event?.target?.value === 'string' && event.target.value.length
    ? event.target.value
    : 'all-materials'

  selectedColorTarget.value = nextTarget
  emit('update-color-target', nextTarget)
}
</script>

<template>
  <OverlayCard class="asset-config-panel" aria-label="Assetconfiguratie">
    <header class="panel-header">
      <h2 class="panel-title">{{ panelTitle }}</h2>
      <CloseIconButton @click="handleClose" />
    </header>

    <section v-if="isAssetWithMaterials" class="material-controls" aria-label="Materiaalconfiguratie">
      <div v-if="hasTextureControls" class="material-tabs" role="tablist" aria-label="Materiaal tabs">
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
          Materiaal
        </button>
      </div>

      <div
        v-if="activeMaterialTab === 'color'"
        class="material-panel material-panel--color"
        :class="{ 'material-panel--standalone': !hasTextureControls }"
        role="tabpanel"
        aria-label="Kleur tab"
      >
        <div class="section-heading">
          <h3 class="section-title">Kleur</h3>
          <button
            type="button"
            class="section-info"
            aria-label="Kleur uitleg"
            :data-tooltip="colorTooltipText"
          />
        </div>
        <ColorDiskPicker :model-value="currentColor" @update:model-value="handleColorChange" />
        <label v-if="selectedAsset?.assetType === 'model'" class="color-target-field color-target-field--bottom">
          <span class="color-target-field__label">Doelmateriaal</span>
          <select class="color-target-field__select" :value="selectedColorTarget" @change="handleColorTargetChange">
            <option
              v-for="target in modelMaterialTargets"
              :key="target.id"
              :value="target.id"
            >
              {{ target.label }}
            </option>
          </select>
        </label>
      </div>

      <div v-else-if="hasTextureControls" class="material-panel" role="tabpanel" aria-label="Materiaal tab">
        <h3 class="section-title">Materiaalstijl</h3>
        <p class="section-copy">Scroll door materialen en kies er een.</p>

        <div class="texture-grid">
          <button
            v-for="texture in texturePreviewOptions"
            :key="texture.id"
            type="button"
            class="texture-tile"
            :class="{ 'texture-tile--active': selectedTexturePreviewId === texture.id }"
            @click="selectTexturePreview(texture.id)"
          >
            <span
              class="texture-tile__swatch"
              :class="{ 'texture-tile__swatch--empty': !texture.previewUrl }"
              :style="texture.previewUrl ? { backgroundImage: `url(${texture.previewUrl})` } : null"
            />
            <span class="texture-tile__name">{{ texture.name }}</span>
          </button>
        </div>

        <div class="texture-scale">
          <div class="texture-scale__row">
            <span class="texture-scale__label">Materiaalgrootte</span>
            <span class="texture-scale__value">{{ textureScale.toFixed(1) }}x</span>
          </div>
          <input
            class="texture-scale__slider"
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            :value="textureScale"
            :disabled="!hasActiveTexture"
            @input="handleTextureScaleInput"
          >
        </div>
      </div>
    </section>

    <p v-else class="section-copy section-copy--compact">
      Dit paneel ondersteunt materiaalconfiguratie voor geselecteerde assets.
    </p>
  </OverlayCard>
</template>

<style scoped>
.asset-config-panel {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 3;
  width: min(20rem, calc(100vw - 2rem));
  padding: 0;
  border-top-left-radius: 0.9rem;
  border-bottom-left-radius: 0.9rem;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
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
  border-top-left-radius: 0.9rem;
  border-bottom-left-radius: 0.9rem;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
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
  margin-top: 0.5rem;
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
  color: #6a7384;
  background: #f7f8f3;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.material-tab--active {
  background: #dde2eb;
  color: #202733;
}

.material-tab:first-child {
  border-top-left-radius: 0.9rem;
}

.material-tab:last-child {
  border-top-right-radius: 0;
}

.material-panel {
  display: grid;
  gap: 0.44rem;
  padding: 0.78rem 0.78rem 0.72rem;
  background: #dde2eb;
  border-bottom-left-radius: 0.9rem;
  border-bottom-right-radius: 0;
}

.material-panel--color {
  place-items: stretch;
}

.material-panel--standalone {
  border-top-left-radius: 0.9rem;
}

.section-title {
  margin: 0;
  color: #4a5667;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section-info {
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

.section-info:hover,
.section-info:focus-visible {
  border-color: rgba(124, 138, 110, 0.22);
  background-color: rgba(124, 138, 110, 0.08);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.44rem;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.2rem;
  max-height: 18rem;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 0.42rem;
  scrollbar-gutter: stable;
}

.texture-grid::-webkit-scrollbar {
  width: 0.44rem;
}

.texture-grid::-webkit-scrollbar-thumb {
  background: rgba(96, 111, 130, 0.44);
  border-radius: 999px;
}

.texture-grid::-webkit-scrollbar-track {
  background: rgba(231, 236, 245, 0.52);
  border-radius: 999px;
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
  background-size: cover;
  background-position: center;
}

.texture-tile__name {
  color: rgba(64, 75, 53, 0.94);
  font-size: 0.79rem;
  font-weight: 700;
}

.texture-tile__swatch--empty {
  background-image:
    linear-gradient(45deg, rgba(188, 198, 213, 0.52) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(188, 198, 213, 0.52) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(188, 198, 213, 0.52) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(188, 198, 213, 0.52) 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
  background-color: rgba(241, 244, 248, 0.92);
}

.texture-scale {
  margin-top: 0.46rem;
  padding-top: 0.46rem;
  border-top: 1px solid rgba(102, 112, 138, 0.22);
}

.texture-scale__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.texture-scale__label {
  color: rgba(69, 71, 91, 0.9);
  font-size: 0.8rem;
  font-weight: 700;
}

.texture-scale__value {
  color: rgba(56, 60, 82, 0.92);
  font-size: 0.79rem;
  font-weight: 800;
}

.texture-scale__slider {
  width: 100%;
  margin-top: 0.4rem;
}

.color-target-field {
  display: grid;
  gap: 0.26rem;
}

.color-target-field--bottom {
  margin-top: 0.62rem;
}

.color-target-field__label {
  color: rgba(69, 71, 91, 0.9);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.color-target-field__select {
  border: 1px solid rgba(92, 98, 123, 0.35);
  border-radius: 0.52rem;
  padding: 0.4rem 0.5rem;
  background: rgba(248, 250, 255, 0.92);
  color: #40465d;
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .asset-config-panel {
    top: auto;
    right: 1rem;
    bottom: 12.4rem;
    transform: none;
    width: min(22rem, calc(100vw - 2rem));
  }

  .material-tab {
    font-size: 0.94rem;
    padding: 0.64rem 0.5rem;
  }
}
</style>
