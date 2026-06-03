<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <EditorSceneViewport
      class="scene-layer"
      :show-grid="isGridVisible"
      :active-interaction-mode="activeInteractionMode"
      :active-edit-tool="activeEditTool"
      :history-action="historyAction"
      :block-action="blockAction"
      :block-appearance-action="blockAppearanceAction"
      :floor-appearance-action="floorAppearanceAction"
      :floor-action="floorAction"
      :model-action="modelAction"
      :lighting-action="lightingAction"
      :persistence-action="persistenceAction"
      :selection-action="selectionAction"
      @scene-document-prepared="handleSceneDocumentPrepared"
      @scene-runtime-changed="handleSceneRuntimeChanged"
      @selection-changed="handleSelectionChanged"
    />
    <BrandPanel />
    <SideToolPanel @tool-click="handleSideToolClick" />
    <BlocksLibraryPanel
      v-if="isBlocksLibraryVisible"
      @close="handleBlocksLibraryClose"
      @select-block="handleSelectBlock"
    />
    <ModelsLibraryPanel
      v-if="isModelsLibraryVisible"
      @close="handleModelsLibraryClose"
      @select-model="handleSelectModel"
    />
    <LightLibraryPanel
      v-if="isLightLibraryVisible"
      :current-preset-id="currentLightingPresetId"
      @close="handleLightLibraryClose"
      @select-lighting-preset="handleSelectLightingPreset"
    />
    <FloorLibraryPanel
      v-if="isFloorLibraryVisible"
      @close="handleFloorLibraryClose"
      @select-floor="handleSelectFloor"
    />
    <SoundsLibraryPanel
      v-if="isSoundsLibraryVisible"
      :added-track-ids="sceneAudioTrackIds"
      :selected-track-id="selectedSceneAudioTrackId"
      @close="handleSoundsLibraryClose"
      @add-track="handleAddAudioTrack"
      @select-track="handleSelectAudioTrack"
    />
    <AudioConfigurationPanel
      v-if="selectedSceneAudioItem"
      :selected-audio="selectedSceneAudioItem"
      @close="handleAudioSelectionClose"
      @update-volume="handleAudioVolumeChange"
      @remove-audio="handleRemoveSelectedAudio"
    />
    <AssetConfigurationPanel
      v-if="selectedAsset?.assetType === 'block'"
      :selected-asset="selectedAsset"
      @close="handleAssetConfigurationClose"
      @update-color="handleBlockColorChange"
      @update-texture="handleBlockTextureChange"
      @update-texture-scale="handleBlockTextureScaleChange"
    />
    <AssetConfigurationPanel
      v-if="selectedAsset?.assetType === 'floor'"
      :selected-asset="selectedAsset"
      @close="handleAssetConfigurationClose"
      @update-color="handleFloorColorChange"
      @update-texture="handleFloorTextureChange"
      @update-texture-scale="handleFloorTextureScaleChange"
      :default-tab="'texture'"
    />
    <TopActionBar
      :persistence-status="persistenceStatus"
      :persistence-error="persistenceError"
      :is-scene-dirty="isSceneDirty"
      :is-grid-visible="isGridVisible"
      @action-click="handleTopActionClick"
    />
    <BottomControlBar
      :active-interaction-mode="activeInteractionMode"
      :active-edit-tool="activeEditTool"
      @interaction-mode-change="handleInteractionModeChange"
      @edit-tool-change="handleEditToolChange"
      @history-action="handleHistoryAction"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SCENE_KIND } from './scene/sceneContract.js'
import AssetConfigurationPanel from './components/editor/AssetConfigurationPanel.vue'
import AudioConfigurationPanel from './components/editor/AudioConfigurationPanel.vue'
import BlocksLibraryPanel from './components/editor/BlocksLibraryPanel.vue'
import FloorLibraryPanel from './components/editor/FloorLibraryPanel.vue'
import LightLibraryPanel from './components/editor/LightLibraryPanel.vue'
import ModelsLibraryPanel from './components/editor/ModelsLibraryPanel.vue'
import SoundsLibraryPanel from './components/editor/SoundsLibraryPanel.vue'
import BottomControlBar from './components/editor/BottomControlBar.vue'
import BrandPanel from './components/editor/BrandPanel.vue'
import SideToolPanel from './components/editor/SideToolPanel.vue'
import TopActionBar from './components/editor/TopActionBar.vue'
import EditorSceneViewport from './components/scene/EditorSceneViewport.client.vue'
import { useScenePersistence } from './composables/useScenePersistence.js'
import { AUDIO_TRACKS } from './config/audioLibrary.js'
import { DEFAULT_LIGHTING_PRESET_ID } from './config/lightingPresets.js'

const DEFAULT_AUDIO_VOLUME = 0.6

const activeInteractionMode = ref('select')
const activeEditTool = ref('move')
const historyAction = ref({
  type: null,
  sequence: 0
})
const isBlocksLibraryVisible = ref(false)
const isFloorLibraryVisible = ref(false)
const isModelsLibraryVisible = ref(false)
const isLightLibraryVisible = ref(false)
const isSoundsLibraryVisible = ref(false)
const blockAction = ref({
  type: null,
  shapeType: null,
  sequence: 0
})
const blockAppearanceAction = ref({
  type: null,
  objectId: null,
  color: null,
  textureId: null,
  textureScale: null,
  sequence: 0
})
const floorAppearanceAction = ref({
  type: null,
  objectId: null,
  color: null,
  textureId: null,
  textureScale: null,
  sequence: 0
})
const floorAction = ref({
  type: null,
  textureId: null,
  sequence: 0
})
const modelAction = ref({
  type: null,
  downloadUrl: null,
  sequence: 0
})
const lightingAction = ref({
  type: null,
  presetId: null,
  sequence: 0
})
const persistenceAction = ref({
  type: null,
  sequence: 0
})
const selectionAction = ref({
  type: null,
  sequence: 0
})
const latestPreparedScene = ref(null)
const latestSaveDiagnostics = ref({
  isValid: true,
  errors: [],
  warnings: []
})
const lastSceneName = ref('Editor Scène')
const isSceneDirty = ref(false)
const isGridVisible = ref(true)
const skipNextDirtyEvent = ref(false)
const selectedAsset = ref(null)
const currentLightingPresetId = ref(DEFAULT_LIGHTING_PRESET_ID)
const sceneAudioItems = ref([])
const selectedSceneAudioId = ref(null)

const {
  persistenceStatus,
  persistenceError,
  lastSavedSceneId,
  saveSceneDocument,
  loadSceneDocument
} = useScenePersistence()

const blockLabelByType = {
  square: 'Vierkant',
  sphere: 'Bol',
  cylinder: 'Cilinder',
  cone: 'Kegel',
  triangle: 'Helling'
}

const selectedSceneAudioItem = computed(() => {
  return sceneAudioItems.value.find((item) => item.objectId === selectedSceneAudioId.value) ?? null
})

const sceneAudioTrackIds = computed(() => sceneAudioItems.value.map((item) => item.trackId))

const selectedSceneAudioTrackId = computed(() => {
  return selectedSceneAudioItem.value?.trackId ?? null
})

function normalizeAudioVolume(volume) {
  if (!Number.isFinite(volume)) {
    return DEFAULT_AUDIO_VOLUME
  }

  return Math.min(1, Math.max(0, volume))
}

function trackById(trackId) {
  if (typeof trackId !== 'string' || !trackId.length) {
    return null
  }

  return AUDIO_TRACKS.find((track) => track.id === trackId) ?? null
}

function toAudioObjectId(trackId) {
  return `audio-${String(trackId).replace(/[^a-zA-Z0-9]+/g, '-')}`
}

function toSceneAudioObject(audioItem, index) {
  return {
    id: audioItem.objectId || `audio-${index}`,
    kind: SCENE_KIND.AUDIO,
    assetRef: audioItem.trackId,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  }
}

function toSceneAudioSettingsTrack(audioItem) {
  return {
    trackId: audioItem.trackId,
    objectId: audioItem.objectId,
    label: audioItem.label,
    categoryId: audioItem.categoryId,
    url: audioItem.url,
    defaultVolume: normalizeAudioVolume(audioItem.defaultVolume)
  }
}

function withAudioPersistence(sceneDocument) {
  if (!sceneDocument || typeof sceneDocument !== 'object') {
    return sceneDocument
  }

  const nonAudioObjects = Array.isArray(sceneDocument.objects)
    ? sceneDocument.objects.filter((objectState) => objectState?.kind !== SCENE_KIND.AUDIO)
    : []
  const audioObjects = sceneAudioItems.value.map((audioItem, index) => toSceneAudioObject(audioItem, index))

  return {
    ...sceneDocument,
    editorSettings: {
      ...(sceneDocument.editorSettings && typeof sceneDocument.editorSettings === 'object'
        ? sceneDocument.editorSettings
        : {}),
      audio: {
        tracks: sceneAudioItems.value.map((audioItem) => toSceneAudioSettingsTrack(audioItem))
      }
    },
    objects: [...nonAudioObjects, ...audioObjects]
  }
}

function hydrateSceneAudioFromDocument(sceneDocument) {
  const audioTracksInput = Array.isArray(sceneDocument?.editorSettings?.audio?.tracks)
    ? sceneDocument.editorSettings.audio.tracks
    : []

  const fromEditorSettings = audioTracksInput
    .map((trackEntry, index) => {
      const catalogTrack = trackById(trackEntry?.trackId)
      const trackId = typeof trackEntry?.trackId === 'string' && trackEntry.trackId.length
        ? trackEntry.trackId
        : catalogTrack?.id

      if (!trackId) {
        return null
      }

      return {
        objectId: typeof trackEntry?.objectId === 'string' && trackEntry.objectId.length
          ? trackEntry.objectId
          : toAudioObjectId(trackId || `unknown-${index}`),
        trackId,
        label: typeof trackEntry?.label === 'string' && trackEntry.label.length
          ? trackEntry.label
          : (catalogTrack?.label ?? trackId),
        categoryId: typeof trackEntry?.categoryId === 'string' && trackEntry.categoryId.length
          ? trackEntry.categoryId
          : (catalogTrack?.categoryId ?? 'ambient'),
        url: typeof trackEntry?.url === 'string' && trackEntry.url.length
          ? trackEntry.url
          : (catalogTrack?.url ?? ''),
        defaultVolume: normalizeAudioVolume(Number(trackEntry?.defaultVolume))
      }
    })
    .filter(Boolean)

  if (fromEditorSettings.length > 0) {
    const firstAudio = fromEditorSettings[0]
    sceneAudioItems.value = firstAudio ? [firstAudio] : []
    selectedSceneAudioId.value = firstAudio?.objectId ?? null
    return
  }

  const fromObjects = (Array.isArray(sceneDocument?.objects) ? sceneDocument.objects : [])
    .filter((objectState) => objectState?.kind === SCENE_KIND.AUDIO)
    .map((audioObject, index) => {
      const catalogTrack = trackById(audioObject?.assetRef)
      const trackId = typeof audioObject?.assetRef === 'string' && audioObject.assetRef.length
        ? audioObject.assetRef
        : (catalogTrack?.id ?? null)

      if (!trackId) {
        return null
      }

      return {
        objectId: typeof audioObject?.id === 'string' && audioObject.id.length
          ? audioObject.id
          : toAudioObjectId(`${trackId}-${index}`),
        trackId,
        label: catalogTrack?.label ?? trackId,
        categoryId: catalogTrack?.categoryId ?? 'ambient',
        url: catalogTrack?.url ?? '',
        defaultVolume: DEFAULT_AUDIO_VOLUME
      }
    })
    .filter(Boolean)

  const firstAudio = fromObjects[0]
  sceneAudioItems.value = firstAudio ? [firstAudio] : []
  selectedSceneAudioId.value = firstAudio?.objectId ?? null
}

function handleInteractionModeChange(nextMode) {
  activeInteractionMode.value = nextMode
}

function handleEditToolChange(nextTool) {
  activeEditTool.value = nextTool
}

function handleHistoryAction(actionType) {
  if (actionType !== 'undo' && actionType !== 'redo' && actionType !== 'reset' && actionType !== 'center' && actionType !== 'delete') {
    return
  }

  historyAction.value = {
    type: actionType,
    sequence: historyAction.value.sequence + 1
  }
}

function closeAllLibraries() {
  isBlocksLibraryVisible.value = false
  isFloorLibraryVisible.value = false
  isModelsLibraryVisible.value = false
  isLightLibraryVisible.value = false
  isSoundsLibraryVisible.value = false
}

function handleSideToolClick(toolId) {
  if (toolId === 'blocks') {
    closeAllLibraries()
    isBlocksLibraryVisible.value = true
    return
  }

  if (toolId === 'models') {
    closeAllLibraries()
    isModelsLibraryVisible.value = true
    return
  }

  if (toolId === 'floors') {
    closeAllLibraries()
    isFloorLibraryVisible.value = true
    return
  }

  if (toolId === 'light') {
    closeAllLibraries()
    isLightLibraryVisible.value = true
    return
  }

  if (toolId === 'audio') {
    closeAllLibraries()
    isSoundsLibraryVisible.value = true
    if (sceneAudioItems.value.length > 0) {
      selectedSceneAudioId.value = sceneAudioItems.value[0].objectId
      selectedAsset.value = null
    }
    return
  }

  closeAllLibraries()
}

function handleBlocksLibraryClose() {
  isBlocksLibraryVisible.value = false
}

function handleModelsLibraryClose() {
  isModelsLibraryVisible.value = false
}

function handleFloorLibraryClose() {
  isFloorLibraryVisible.value = false
}

function handleLightLibraryClose() {
  isLightLibraryVisible.value = false
}

function handleSoundsLibraryClose() {
  isSoundsLibraryVisible.value = false
}

function handleAssetConfigurationClose() {
  selectionAction.value = {
    type: 'clear-selection',
    sequence: selectionAction.value.sequence + 1
  }
}

function handleSelectModel({ downloadUrl, title, attribution, licence }) {
  isModelsLibraryVisible.value = false
  modelAction.value = {
    type: 'add-model',
    downloadUrl,
    title,
    attribution,
    licence,
    sequence: modelAction.value.sequence + 1
  }
}

function handleSelectBlock(shapeType) {
  if (typeof shapeType !== 'string' || !shapeType.length) {
    return
  }

  blockAction.value = {
    type: 'add-block',
    shapeType,
    sequence: blockAction.value.sequence + 1
  }
  isSceneDirty.value = true
  isBlocksLibraryVisible.value = false
}

function handleSelectFloor(textureId) {
  if (typeof textureId !== 'string' || !textureId.length) {
    return
  }

  floorAction.value = {
    type: 'add-floor',
    textureId,
    sequence: floorAction.value.sequence + 1
  }
  isSceneDirty.value = true
  isFloorLibraryVisible.value = false
}

function handleSelectLightingPreset(presetId) {
  if (typeof presetId !== 'string' || !presetId.length) {
    return
  }

  currentLightingPresetId.value = presetId
  lightingAction.value = {
    type: 'set-lighting',
    presetId,
    sequence: lightingAction.value.sequence + 1
  }

  isLightLibraryVisible.value = false
}

function handleAddAudioTrack(track) {
  if (!track || typeof track !== 'object') {
    return
  }

  if (typeof track.id !== 'string' || !track.id.length || typeof track.url !== 'string' || !track.url.length) {
    return
  }

  const existingAudio = sceneAudioItems.value.find((audioItem) => audioItem.trackId === track.id)

  if (existingAudio) {
    sceneAudioItems.value = [existingAudio]
    selectedSceneAudioId.value = existingAudio.objectId
    selectedAsset.value = null
    return
  }

  const nextAudioItem = {
    objectId: toAudioObjectId(track.id),
    trackId: track.id,
    label: typeof track.label === 'string' && track.label.length ? track.label : track.id,
    categoryId: typeof track.categoryId === 'string' && track.categoryId.length ? track.categoryId : 'ambient',
    url: track.url,
    defaultVolume: DEFAULT_AUDIO_VOLUME
  }

  sceneAudioItems.value = [nextAudioItem]
  selectedSceneAudioId.value = nextAudioItem.objectId
  selectedAsset.value = null
  isSceneDirty.value = true
}

function handleSelectAudioTrack(trackId) {
  if (typeof trackId !== 'string' || !trackId.length) {
    return
  }

  const matchingAudio = sceneAudioItems.value.find((audioItem) => audioItem.trackId === trackId)

  if (!matchingAudio) {
    return
  }

  selectedSceneAudioId.value = matchingAudio.objectId
  selectedAsset.value = null
}

function handleAudioVolumeChange(nextVolume) {
  if (!selectedSceneAudioId.value) {
    return
  }

  const normalizedVolume = normalizeAudioVolume(Number(nextVolume))
  let hasUpdatedAudio = false

  sceneAudioItems.value = sceneAudioItems.value.map((audioItem) => {
    if (audioItem.objectId !== selectedSceneAudioId.value) {
      return audioItem
    }

    hasUpdatedAudio = true

    return {
      ...audioItem,
      defaultVolume: normalizedVolume
    }
  })

  if (hasUpdatedAudio) {
    isSceneDirty.value = true
  }
}

function handleRemoveSelectedAudio() {
  if (!selectedSceneAudioId.value) {
    return
  }

  const nextItems = sceneAudioItems.value.filter((audioItem) => audioItem.objectId !== selectedSceneAudioId.value)

  if (nextItems.length === sceneAudioItems.value.length) {
    return
  }

  sceneAudioItems.value = nextItems
  selectedSceneAudioId.value = nextItems[0]?.objectId ?? null
  isSceneDirty.value = true
}

function handleAudioSelectionClose() {
  selectedSceneAudioId.value = null
}

function handleSelectionChanged(selection) {
  selectedSceneAudioId.value = null

  if (!selection) {
    selectedAsset.value = null
    return
  }

  if (selection.kind === 'shape') {
    const assetId = typeof selection.assetRef === 'string' ? selection.assetRef : 'square'

    selectedAsset.value = {
      assetType: 'block',
      objectId: selection.objectId,
      assetId,
      label: blockLabelByType[assetId] ?? 'Blok',
      textureId: typeof selection.appearance?.texture?.textureId === 'string' && selection.appearance.texture.textureId.length
        ? selection.appearance.texture.textureId
        : 'no-texture',
      textureScale: Array.isArray(selection.appearance?.texture?.uvScale)
        && typeof selection.appearance.texture.uvScale[0] === 'number'
        ? selection.appearance.texture.uvScale[0]
        : 1,
      color: typeof selection.appearance?.color === 'string' && selection.appearance.color.length
        ? selection.appearance.color
        : '#b4c9a6'
    }
    return
  }

  if (selection.kind === 'floor') {
    selectedAsset.value = {
      assetType: 'floor',
      objectId: selection.objectId,
      label: 'Vloer',
      textureId: typeof selection.appearance?.texture?.textureId === 'string' && selection.appearance.texture.textureId.length
        ? selection.appearance.texture.textureId
        : 'no-texture',
      textureScale: Array.isArray(selection.appearance?.texture?.uvScale)
        && typeof selection.appearance.texture.uvScale[0] === 'number'
        ? selection.appearance.texture.uvScale[0]
        : 1,
      color: typeof selection.appearance?.color === 'string' && selection.appearance.color.length
        ? selection.appearance.color
        : '#7a8fa0'
    }
    return
  }

  selectedAsset.value = null
}

function handleBlockColorChange(color) {
  if (!selectedAsset.value?.objectId || typeof color !== 'string' || !color.length) {
    return
  }

  blockAppearanceAction.value = {
    type: 'update-block-color',
    objectId: selectedAsset.value.objectId,
    color,
    sequence: blockAppearanceAction.value.sequence + 1
  }
  selectedAsset.value = {
    ...selectedAsset.value,
    color
  }
  isSceneDirty.value = true
}

function handleBlockTextureChange(textureId) {
  if (!selectedAsset.value?.objectId || typeof textureId !== 'string' || !textureId.length) {
    return
  }

  blockAppearanceAction.value = {
    type: 'update-block-texture',
    objectId: selectedAsset.value.objectId,
    textureId,
    sequence: blockAppearanceAction.value.sequence + 1
  }

  selectedAsset.value = {
    ...selectedAsset.value,
    textureId,
    textureScale: textureId === 'no-texture' ? 1 : selectedAsset.value.textureScale
  }
  isSceneDirty.value = true
}

function handleBlockTextureScaleChange(textureScale) {
  if (!selectedAsset.value?.objectId || typeof textureScale !== 'number' || !Number.isFinite(textureScale)) {
    return
  }

  blockAppearanceAction.value = {
    type: 'update-block-texture-scale',
    objectId: selectedAsset.value.objectId,
    textureScale,
    sequence: blockAppearanceAction.value.sequence + 1
  }

  selectedAsset.value = {
    ...selectedAsset.value,
    textureScale
  }
  isSceneDirty.value = true
}

function handleFloorColorChange(color) {
  if (!selectedAsset.value?.objectId || typeof color !== 'string' || !color.length) {
    return
  }

  floorAppearanceAction.value = {
    type: 'update-floor-color',
    objectId: selectedAsset.value.objectId,
    color,
    sequence: floorAppearanceAction.value.sequence + 1
  }
  selectedAsset.value = {
    ...selectedAsset.value,
    color
  }
  isSceneDirty.value = true
}

function handleFloorTextureChange(textureId) {
  if (!selectedAsset.value?.objectId || typeof textureId !== 'string' || !textureId.length) {
    return
  }

  floorAppearanceAction.value = {
    type: 'update-floor-texture',
    objectId: selectedAsset.value.objectId,
    textureId,
    sequence: floorAppearanceAction.value.sequence + 1
  }

  selectedAsset.value = {
    ...selectedAsset.value,
    textureId,
    textureScale: textureId === 'no-texture' ? 1 : selectedAsset.value.textureScale
  }
  isSceneDirty.value = true
}

function handleFloorTextureScaleChange(textureScale) {
  if (!selectedAsset.value?.objectId || typeof textureScale !== 'number' || !Number.isFinite(textureScale)) {
    return
  }

  floorAppearanceAction.value = {
    type: 'update-floor-texture-scale',
    objectId: selectedAsset.value.objectId,
    textureScale,
    sequence: floorAppearanceAction.value.sequence + 1
  }

  selectedAsset.value = {
    ...selectedAsset.value,
    textureScale
  }
  isSceneDirty.value = true
}

function handleTopActionClick(actionId) {
  if (actionId === 'toggle-grid') {
    isGridVisible.value = !isGridVisible.value
    return
  }

  if (actionId === 'load') {
    loadSceneIntoEditor()
    return
  }

  if (actionId !== 'save') {
    return
  }

  persistenceAction.value = {
    type: 'prepare-save',
    sequence: persistenceAction.value.sequence + 1
  }
}

async function handleSceneDocumentPrepared(payload) {
  if (!payload || typeof payload !== 'object') {
    return
  }

  latestPreparedScene.value = payload.sceneDocument ?? null
  latestSaveDiagnostics.value = {
    isValid: Boolean(payload.isValid),
    errors: Array.isArray(payload.errors) ? payload.errors : [],
    warnings: Array.isArray(payload.warnings) ? payload.warnings : []
  }

  if (!latestSaveDiagnostics.value.isValid || !latestPreparedScene.value) {
    console.warn('Scene document is invalid and was not saved.', latestSaveDiagnostics.value)
    return
  }

  const sceneDocumentWithAudio = withAudioPersistence(latestPreparedScene.value)
  latestPreparedScene.value = sceneDocumentWithAudio

  const response = await saveSceneDocument(sceneDocumentWithAudio)

  if (!response?.ok) {
    console.error('Failed to persist scene document.', {
      persistenceStatus: persistenceStatus.value,
      persistenceError: persistenceError.value
    })
    return
  }

  if (typeof latestPreparedScene.value.name === 'string' && latestPreparedScene.value.name.length) {
    lastSceneName.value = latestPreparedScene.value.name
  }

  isSceneDirty.value = false

  console.info('Scene save payload prepared:', {
    scene: latestPreparedScene.value,
    diagnostics: latestSaveDiagnostics.value,
    savedSceneId: lastSavedSceneId.value
  })
}

async function loadSceneIntoEditor() {
  const response = await loadSceneDocument(lastSavedSceneId.value)

  if (!response?.ok || !response.scene?.scene_data) {
    console.error('Failed to load scene document.', {
      persistenceStatus: persistenceStatus.value,
      persistenceError: persistenceError.value
    })
    return
  }

  const loadedSceneDocument = response.scene.scene_data
  lastSceneName.value = typeof loadedSceneDocument.name === 'string' && loadedSceneDocument.name.length
    ? loadedSceneDocument.name
    : lastSceneName.value

  const loadedLightingPresetId = loadedSceneDocument?.editorSettings?.lighting?.presetId
  currentLightingPresetId.value = typeof loadedLightingPresetId === 'string' && loadedLightingPresetId.length
    ? loadedLightingPresetId
    : DEFAULT_LIGHTING_PRESET_ID

  hydrateSceneAudioFromDocument(loadedSceneDocument)

  skipNextDirtyEvent.value = true

  persistenceAction.value = {
    type: 'hydrate-scene',
    sequence: persistenceAction.value.sequence + 1,
    sceneDocument: loadedSceneDocument
  }

  isSceneDirty.value = false

  console.info('Loaded scene from Supabase and sent to viewport hydration.', {
    sceneId: response.scene.id,
    name: response.scene.name
  })
}

function handleSceneRuntimeChanged() {
  if (skipNextDirtyEvent.value) {
    skipNextDirtyEvent.value = false
    return
  }

  if (persistenceStatus.value === 'loading') {
    return
  }

  isSceneDirty.value = true
}
</script>

<style scoped>
.app-shell {
  position: relative;
  width: 100vw;
  min-height: 100svh;
  overflow: hidden;
  background: radial-gradient(circle at 20% 10%, #f4f5f2 0%, #e8ece5 45%, #dbe4d7 100%);
  font-family: 'Nunito Sans', sans-serif;
}

.scene-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}
</style>
