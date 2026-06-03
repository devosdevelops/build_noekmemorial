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
      :model-appearance-action="modelAppearanceAction"
      :floor-action="floorAction"
      :model-action="modelAction"
      :lighting-action="lightingAction"
      :persistence-action="persistenceAction"
      :selection-action="selectionAction"
      @scene-ready="handleSceneReady"
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
    <AssetConfigurationPanel
      v-if="selectedAsset?.assetType === 'model'"
      :selected-asset="selectedAsset"
      @close="handleAssetConfigurationClose"
      @update-color="handleModelColorChange"
      @update-color-target="handleModelColorTargetChange"
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
      :has-deletable-selection="hasDeletableSelection"
      @interaction-mode-change="handleInteractionModeChange"
      @edit-tool-change="handleEditToolChange"
      @history-action="handleHistoryAction"
    />

    <transition name="editor-warning-toast">
      <div v-if="isEditorWarningVisible" class="editor-warning-toast" role="status" aria-live="polite">
        <span class="editor-warning-toast-icon" aria-hidden="true">!</span>
        <span>{{ editorWarningMessage }}</span>
      </div>
    </transition>

    <div
      v-if="isWorkspaceSettingsOpen"
      class="workspace-settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-settings-title"
      @click.self="closeWorkspaceSettings"
    >
      <div class="workspace-settings-card">
        <div class="workspace-settings-header">
          <h2 id="workspace-settings-title">Ruimte Instellingen</h2>
          <button type="button" class="workspace-settings-close" aria-label="Sluiten" @click="closeWorkspaceSettings">
            <img src="/icons/Close_Button.svg" alt="" class="workspace-settings-close-icon" aria-hidden="true" />
          </button>
        </div>

        <div class="workspace-settings-field">
          <label for="workspace-settings-name">Naam van Ruimte</label>
          <input id="workspace-settings-name" v-model="workspaceSettingsName" type="text" class="workspace-settings-input" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings" />
        </div>

        <div class="workspace-settings-field">
          <label>Naam Overledene</label>
          <div class="workspace-settings-name-row">
            <input v-model="workspaceSettingsFirstName" type="text" class="workspace-settings-input" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings" />
            <input v-model="workspaceSettingsLastName" type="text" class="workspace-settings-input" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings" />
          </div>
        </div>

        <div class="workspace-settings-field">
          <label class="workspace-settings-section-title">Zichtbaarheid</label>
          <div class="workspace-settings-radio-row">
            <label class="workspace-settings-radio-item">
              <input v-model="workspaceSettingsVisibility" type="radio" value="offline" disabled />
              <span>Offline</span>
            </label>
            <label class="workspace-settings-radio-item">
              <input v-model="workspaceSettingsVisibility" type="radio" value="public" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings || isWorkspaceOffline" />
              <span>Publiek</span>
            </label>
            <label class="workspace-settings-radio-item">
              <input v-model="workspaceSettingsVisibility" type="radio" value="private" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings || isWorkspaceOffline" />
              <span>Afgeschermd</span>
            </label>
          </div>
          <p v-if="isWorkspaceOffline" class="workspace-settings-offline-note">
            Deze ruimte is nog offline. Gebruik eerst Publiceer in de editor om publiek of afgeschermd te activeren.
          </p>
        </div>

        <div class="workspace-settings-field">
          <label class="workspace-settings-section-title">Bijdrage goedkeuringsinstellingen</label>
          <div class="workspace-settings-radio-stack">
            <label class="workspace-settings-radio-item">
              <input v-model="workspaceSettingsApprovalMode" type="radio" value="manual" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings" />
              <span>Handmatige goedkeuring</span>
            </label>
            <label class="workspace-settings-radio-item">
              <input v-model="workspaceSettingsApprovalMode" type="radio" value="automatic" :disabled="!isWorkspaceOwner || isSavingWorkspaceSettings" />
              <span>Automatische goedkeuring</span>
            </label>
          </div>
        </div>

        <p v-if="workspaceSettingsError" class="workspace-settings-error">{{ workspaceSettingsError }}</p>
        <p v-else-if="!isWorkspaceOwner" class="workspace-settings-note">Je bent samenwerker. Alleen de eigenaar kan instellingen aanpassen.</p>

        <button type="button" class="workspace-settings-save" :disabled="isSavingWorkspaceSettings" @click="saveWorkspaceSettings">
          {{ isSavingWorkspaceSettings ? 'Opslaan...' : 'Veranderingen Opslaan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { SCENE_KIND } from '../../scene/sceneContract.js'
import AssetConfigurationPanel from '../editor/AssetConfigurationPanel.vue'
import AudioConfigurationPanel from '../editor/AudioConfigurationPanel.vue'
import BlocksLibraryPanel from '../editor/BlocksLibraryPanel.vue'
import FloorLibraryPanel from '../editor/FloorLibraryPanel.vue'
import LightLibraryPanel from '../editor/LightLibraryPanel.vue'
import ModelsLibraryPanel from '../editor/ModelsLibraryPanel.vue'
import SoundsLibraryPanel from '../editor/SoundsLibraryPanel.vue'
import BottomControlBar from '../editor/BottomControlBar.vue'
import BrandPanel from '../editor/BrandPanel.vue'
import SideToolPanel from '../editor/SideToolPanel.vue'
import TopActionBar from '../editor/TopActionBar.vue'
import EditorSceneViewport from '../scene/EditorSceneViewport.client.vue'
import { useScenePersistence } from '../../composables/useScenePersistence.js'
import { useAuth } from '../../composables/useAuth'
import { AUDIO_TRACKS } from '../../config/audioLibrary.js'
import { DEFAULT_LIGHTING_PRESET_ID } from '../../config/lightingPresets.js'

const emit = defineEmits(['editor-ready'])
const { init: initAuth, session } = useAuth()

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
const modelAppearanceAction = ref({
  type: null,
  objectId: null,
  color: null,
  materialName: null,
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
const isWorkspaceSettingsOpen = ref(false)
const workspaceSettingsName = ref('')
const workspaceSettingsFirstName = ref('')
const workspaceSettingsLastName = ref('')
const workspaceSettingsVisibility = ref('offline')
const workspaceSettingsApprovalMode = ref('manual')
const workspaceSettingsError = ref('')
const isSavingWorkspaceSettings = ref(false)
const isWorkspaceOwner = ref(false)
const currentWorkspaceVisibility = ref('offline')
const isEditorWarningVisible = ref(false)
const editorWarningMessage = ref('')
const isInitialBootLoadFinished = ref(false)
const hasSceneViewportMounted = ref(false)
const hasEditorReadyBeenEmitted = ref(false)
let editorWarningTimer = null

const {
  persistenceStatus,
  persistenceError,
  lastSavedSceneId,
  workspaceId,
  saveSceneDocument,
  loadSceneDocument
} = useScenePersistence()

const route = useRoute()

onMounted(async () => {
  const workspaceQueryParam = route.query.workspaceId
  const resolvedWorkspaceId = Array.isArray(workspaceQueryParam)
    ? workspaceQueryParam[0]
    : workspaceQueryParam

  workspaceId.value = typeof resolvedWorkspaceId === 'string' ? resolvedWorkspaceId : ''

  await maybeRunInitialSceneLoad()
})

async function maybeRunInitialSceneLoad() {
  if (!hasSceneViewportMounted.value || isInitialBootLoadFinished.value) {
    return
  }

  if (!workspaceId.value || !workspaceId.value.length) {
    isInitialBootLoadFinished.value = true
    emitEditorReadyOnce()
    return
  }

  await loadSceneIntoEditor()
  isInitialBootLoadFinished.value = true
  emitEditorReadyOnce()
}

function emitEditorReadyOnce() {
  if (hasEditorReadyBeenEmitted.value) {
    return
  }

  hasEditorReadyBeenEmitted.value = true
  emit('editor-ready')
}

function triggerEditorWarning(message) {
  editorWarningMessage.value = message

  if (editorWarningTimer) {
    clearTimeout(editorWarningTimer)
  }

  isEditorWarningVisible.value = true
  editorWarningTimer = setTimeout(() => {
    isEditorWarningVisible.value = false
    editorWarningTimer = null
  }, 3200)
}

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

const hasDeletableSelection = computed(() => {
  return Boolean(selectedAsset.value?.objectId && selectedAsset.value.objectId !== 'ground')
})

const sceneAudioTrackIds = computed(() => sceneAudioItems.value.map((item) => item.trackId))

const selectedSceneAudioTrackId = computed(() => {
  return selectedSceneAudioItem.value?.trackId ?? null
})

const isWorkspaceOffline = computed(() => currentWorkspaceVisibility.value === 'offline')

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
  const isBlocksOpen = isBlocksLibraryVisible.value
  const isModelsOpen = isModelsLibraryVisible.value
  const isFloorsOpen = isFloorLibraryVisible.value
  const isLightOpen = isLightLibraryVisible.value
  const isAudioOpen = isSoundsLibraryVisible.value

  if (toolId === 'blocks') {
    if (isBlocksOpen) {
      closeAllLibraries()
      return
    }

    closeAllLibraries()
    isBlocksLibraryVisible.value = true
    return
  }

  if (toolId === 'models') {
    if (isModelsOpen) {
      closeAllLibraries()
      return
    }

    closeAllLibraries()
    isModelsLibraryVisible.value = true
    return
  }

  if (toolId === 'floors') {
    if (isFloorsOpen) {
      closeAllLibraries()
      return
    }

    closeAllLibraries()
    isFloorLibraryVisible.value = true
    return
  }

  if (toolId === 'light') {
    if (isLightOpen) {
      closeAllLibraries()
      return
    }

    closeAllLibraries()
    isLightLibraryVisible.value = true
    return
  }

  if (toolId === 'audio') {
    if (isAudioOpen) {
      closeAllLibraries()
      return
    }

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
    const floorLabel = selection.assetRef === 'ground-plane' ? 'Ondergrond' : 'Vloer'

    selectedAsset.value = {
      assetType: 'floor',
      objectId: selection.objectId,
      label: floorLabel,
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

  if (selection.kind === 'model') {
    const materialTargets = Array.isArray(selection.materialTargets)
      ? selection.materialTargets.filter((target) => {
          return target
            && typeof target.id === 'string'
            && target.id.length
            && typeof target.label === 'string'
            && target.label.length
        })
      : []
    const selectedMaterialTarget = typeof selection.selectedMaterialTarget === 'string'
      && selection.selectedMaterialTarget.length
      ? selection.selectedMaterialTarget
      : 'all-materials'

    selectedAsset.value = {
      assetType: 'model',
      objectId: selection.objectId,
      label: '3D-model',
      materialTargets,
      selectedMaterialTarget,
      color: typeof selection.appearance?.color === 'string' && selection.appearance.color.length
        ? selection.appearance.color
        : '#f5b8ca'
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

function handleModelColorTargetChange(materialTargetId) {
  if (selectedAsset.value?.assetType !== 'model') {
    return
  }

  if (typeof materialTargetId !== 'string' || !materialTargetId.length) {
    return
  }

  selectedAsset.value = {
    ...selectedAsset.value,
    selectedMaterialTarget: materialTargetId
  }
}

function handleModelColorChange(color) {
  if (selectedAsset.value?.assetType !== 'model' || !selectedAsset.value.objectId) {
    return
  }

  if (typeof color !== 'string' || !color.length) {
    return
  }

  const targetId = typeof selectedAsset.value.selectedMaterialTarget === 'string'
    && selectedAsset.value.selectedMaterialTarget.length
    ? selectedAsset.value.selectedMaterialTarget
    : 'all-materials'

  modelAppearanceAction.value = {
    type: 'update-model-color',
    objectId: selectedAsset.value.objectId,
    color,
    materialName: targetId,
    sequence: modelAppearanceAction.value.sequence + 1
  }

  selectedAsset.value = {
    ...selectedAsset.value,
    color
  }
  isSceneDirty.value = true
}

function handleTopActionClick(actionId) {
  if (actionId === 'home') {
    navigateTo('/dashboard')
    return
  }

  if (actionId === 'settings') {
    openWorkspaceSettings()
    return
  }

  if (actionId === 'publish') {
    publishWorkspaceFromEditor()
    return
  }

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

async function publishWorkspaceFromEditor() {
  if (!workspaceId.value || !workspaceId.value.length) {
    triggerEditorWarning('Open de editor vanuit een bestaande werkruimte om te publiceren.')
    return
  }

  await initAuth()
  const accessToken = session.value?.access_token

  if (!accessToken) {
    triggerEditorWarning('Je sessie is verlopen. Log opnieuw in.')
    return
  }

  try {
    const response = await $fetch(`/api/workspaces/${workspaceId.value}/publish`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    const nextVisibility = response?.workspace?.visibility
    if (nextVisibility === 'public' || nextVisibility === 'private' || nextVisibility === 'offline') {
      currentWorkspaceVisibility.value = nextVisibility
      workspaceSettingsVisibility.value = nextVisibility
    }

    triggerEditorWarning(response?.alreadyPublished ? 'Deze ruimte is al gepubliceerd.' : 'Ruimte is gepubliceerd en staat nu publiek.')
  } catch (error) {
    triggerEditorWarning(error?.data?.statusMessage || error?.statusMessage || error?.message || 'Publiceren is mislukt.')
  }
}

async function openWorkspaceSettings() {
  workspaceSettingsError.value = ''

  if (!workspaceId.value || !workspaceId.value.length) {
    triggerEditorWarning('Open de editor vanuit een bestaande werkruimte om instellingen te beheren.')
    return
  }

  await initAuth()
  const accessToken = session.value?.access_token

  if (!accessToken) {
    triggerEditorWarning('Je sessie is verlopen. Log opnieuw in.')
    return
  }

  try {
    const response = await $fetch(`/api/workspaces/${workspaceId.value}`, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    const workspace = response?.workspace
    const owner = response?.owner

    workspaceSettingsName.value = workspace?.name || ''
    workspaceSettingsFirstName.value = workspace?.deceased_first_name || ''
    workspaceSettingsLastName.value = workspace?.deceased_last_name || ''
    currentWorkspaceVisibility.value = workspace?.visibility === 'public' || workspace?.visibility === 'private'
      ? workspace.visibility
      : 'offline'
    workspaceSettingsVisibility.value = currentWorkspaceVisibility.value
    workspaceSettingsApprovalMode.value = workspace?.approval_mode === 'automatic' ? 'automatic' : 'manual'
    isWorkspaceOwner.value = Boolean(owner?.id && owner.id === session.value?.user?.id)
    isWorkspaceSettingsOpen.value = true

    if (!isWorkspaceOwner.value) {
      triggerEditorWarning('Alleen de eigenaar kan ruimte-instellingen aanpassen.')
    }
  } catch (error) {
    triggerEditorWarning(error?.data?.statusMessage || error?.statusMessage || error?.message || 'Instellingen laden is mislukt.')
  }
}

function closeWorkspaceSettings() {
  isWorkspaceSettingsOpen.value = false
}

async function saveWorkspaceSettings() {
  workspaceSettingsError.value = ''

  if (!isWorkspaceOwner.value) {
    triggerEditorWarning('Alleen de eigenaar kan ruimte-instellingen aanpassen.')
    return
  }

  await initAuth()
  const accessToken = session.value?.access_token

  if (!accessToken) {
    workspaceSettingsError.value = 'Je sessie is verlopen. Log opnieuw in.'
    return
  }

  isSavingWorkspaceSettings.value = true

  try {
    await $fetch(`/api/workspaces/${workspaceId.value}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      body: {
        name: workspaceSettingsName.value.trim(),
        deceasedFirstName: workspaceSettingsFirstName.value.trim(),
        deceasedLastName: workspaceSettingsLastName.value.trim(),
        visibility: workspaceSettingsVisibility.value,
        approvalMode: workspaceSettingsApprovalMode.value
      }
    })

    currentWorkspaceVisibility.value = workspaceSettingsVisibility.value

    closeWorkspaceSettings()
    triggerEditorWarning('Ruimte-instellingen opgeslagen.')
  } catch (error) {
    workspaceSettingsError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Opslaan van instellingen is mislukt.'
  } finally {
    isSavingWorkspaceSettings.value = false
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
  if (!workspaceId.value || !workspaceId.value.length) {
    console.warn('Workspace context ontbreekt voor deze editor sessie.')
    return false
  }

  const response = await loadSceneDocument(lastSavedSceneId.value)

  if (!response?.ok || !response.scene?.scene_data) {
    console.error('Failed to load scene document.', {
      persistenceStatus: persistenceStatus.value,
      persistenceError: persistenceError.value
    })
    return false
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

  return true
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

async function handleSceneReady() {
  hasSceneViewportMounted.value = true
  await maybeRunInitialSceneLoad()
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
  --editor-edge-gutter: 0;
  --editor-panel-gap: 1rem;
}

.scene-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.editor-warning-toast {
  position: fixed;
  left: 50%;
  bottom: 1.4rem;
  transform: translateX(-50%);
  z-index: 2200;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.62rem 0.9rem;
  border-radius: 12px;
  border: 2px solid #e85a42;
  background: #f4ddd7;
  color: #4d211b;
  font-size: 0.86rem;
  font-weight: 700;
}

.editor-warning-toast-icon {
  font-size: 0.95rem;
}

.editor-warning-toast-enter-active,
.editor-warning-toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.editor-warning-toast-enter-from,
.editor-warning-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.workspace-settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: rgba(18, 26, 12, 0.42);
  display: grid;
  place-items: center;
  padding: 1rem;
  box-sizing: border-box;
}

.workspace-settings-card {
  width: min(560px, 100%);
  border-radius: 14px;
  background: #fbfcfa;
  border: 1px solid #d6decc;
  box-shadow: 0 16px 40px rgba(19, 30, 12, 0.22);
  padding: 1rem;
  box-sizing: border-box;
}

.workspace-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.workspace-settings-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: #1f2433;
}

.workspace-settings-close {
  border: none;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.workspace-settings-close-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.workspace-settings-field {
  margin-bottom: 0.75rem;
}

.workspace-settings-field label {
  display: block;
  margin-bottom: 0.38rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: #3a4153;
}

.workspace-settings-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid #ccd5c1;
  background: #ffffff;
  color: #1f2433;
  padding: 0.56rem 0.66rem;
}

.workspace-settings-name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
}

.workspace-settings-section-title {
  margin-bottom: 0.38rem;
}

.workspace-settings-radio-row,
.workspace-settings-radio-stack {
  display: flex;
  gap: 0.75rem;
}

.workspace-settings-radio-stack {
  flex-direction: column;
  gap: 0.45rem;
}

.workspace-settings-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.86rem;
  color: #2b3142;
}

.workspace-settings-radio-item input:disabled {
  opacity: 0.58;
}

.workspace-settings-offline-note {
  margin: 0.48rem 0 0;
  color: #70511e;
  font-size: 0.8rem;
  font-weight: 600;
}

.workspace-settings-error {
  margin: 0 0 0.6rem;
  color: #9c3021;
  font-size: 0.82rem;
  font-weight: 700;
}

.workspace-settings-note {
  margin: 0 0 0.6rem;
  color: #624515;
  font-size: 0.82rem;
  font-weight: 700;
}

.workspace-settings-save {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  background: linear-gradient(180deg, #84ce51 0%, #66ab3e 100%);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
}

.workspace-settings-save:disabled {
  opacity: 0.68;
  cursor: not-allowed;
}
</style>
