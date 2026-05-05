<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <EditorSceneViewport
      class="scene-layer"
      :active-interaction-mode="activeInteractionMode"
      :active-edit-tool="activeEditTool"
      :history-action="historyAction"
      :block-action="blockAction"
      :persistence-action="persistenceAction"
      @scene-document-prepared="handleSceneDocumentPrepared"
      @scene-runtime-changed="handleSceneRuntimeChanged"
    />
    <BrandPanel />
    <SideToolPanel @tool-click="handleSideToolClick" />
    <BlocksLibraryPanel
      v-if="isBlocksLibraryVisible"
      @close="handleBlocksLibraryClose"
      @select-block="handleSelectBlock"
    />
    <AssetConfigurationPanel
      v-if="isAssetConfigurationVisible && selectedAsset"
      :selected-asset="selectedAsset"
      @close="handleAssetConfigurationClose"
      @add-to-scene="handleAssetAddToScene"
    />
    <TopActionBar
      :persistence-status="persistenceStatus"
      :persistence-error="persistenceError"
      :is-scene-dirty="isSceneDirty"
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
import { ref } from 'vue'
import AssetConfigurationPanel from './components/editor/AssetConfigurationPanel.vue'
import BlocksLibraryPanel from './components/editor/BlocksLibraryPanel.vue'
import BottomControlBar from './components/editor/BottomControlBar.vue'
import BrandPanel from './components/editor/BrandPanel.vue'
import SideToolPanel from './components/editor/SideToolPanel.vue'
import TopActionBar from './components/editor/TopActionBar.vue'
import EditorSceneViewport from './components/scene/EditorSceneViewport.client.vue'
import { useScenePersistence } from './composables/useScenePersistence.js'

const activeInteractionMode = ref('select')
const activeEditTool = ref('move')
const historyAction = ref({
  type: null,
  sequence: 0
})
const isBlocksLibraryVisible = ref(false)
const blockAction = ref({
  type: null,
  shapeType: null,
  sequence: 0
})
const persistenceAction = ref({
  type: null,
  sequence: 0
})
const latestPreparedScene = ref(null)
const latestSaveDiagnostics = ref({
  isValid: true,
  errors: [],
  warnings: []
})
const lastSceneName = ref('Editor Scene')
const isSceneDirty = ref(false)
const skipNextDirtyEvent = ref(false)
const selectedAsset = ref(null)
const isAssetConfigurationVisible = ref(false)

const {
  persistenceStatus,
  persistenceError,
  lastSavedSceneId,
  saveSceneDocument,
  loadSceneDocument
} = useScenePersistence()

const blockLabelByType = {
  square: 'Square',
  sphere: 'Sphere',
  cylinder: 'Cylinder',
  cone: 'Cone'
}

function handleInteractionModeChange(nextMode) {
  activeInteractionMode.value = nextMode
}

function handleEditToolChange(nextTool) {
  activeEditTool.value = nextTool
}

function handleHistoryAction(actionType) {
  if (actionType !== 'undo' && actionType !== 'redo' && actionType !== 'reset' && actionType !== 'center') {
    return
  }

  historyAction.value = {
    type: actionType,
    sequence: historyAction.value.sequence + 1
  }
}

function handleSideToolClick(toolId) {
  if (toolId === 'blocks') {
    isBlocksLibraryVisible.value = true
    return
  }

  isBlocksLibraryVisible.value = false

  if (toolId === 'floors') {
    selectedAsset.value = {
      assetType: 'floor',
      assetId: 'floor',
      label: 'Floor'
    }
    isAssetConfigurationVisible.value = true
    return
  }

  if (toolId === 'models') {
    selectedAsset.value = {
      assetType: 'model',
      assetId: 'placeholder-model',
      label: '3D Model'
    }
    isAssetConfigurationVisible.value = true
    return
  }

  isAssetConfigurationVisible.value = false
  selectedAsset.value = null
}

function handleBlocksLibraryClose() {
  isBlocksLibraryVisible.value = false
}

function handleSelectBlock(shapeType) {
  if (typeof shapeType !== 'string' || !shapeType.length) {
    return
  }

  selectedAsset.value = {
    assetType: 'block',
    assetId: shapeType,
    label: blockLabelByType[shapeType] ?? 'Block'
  }
  isAssetConfigurationVisible.value = true
  isBlocksLibraryVisible.value = false
}

function handleAssetConfigurationClose() {
  isAssetConfigurationVisible.value = false
}

function handleAssetAddToScene() {
  if (!selectedAsset.value || selectedAsset.value.assetType !== 'block') {
    return
  }

  const shapeType = selectedAsset.value.assetId

  if (typeof shapeType !== 'string' || !shapeType.length) {
    return
  }

  blockAction.value = {
    type: 'add-block',
    shapeType,
    sequence: blockAction.value.sequence + 1
  }
  isSceneDirty.value = true
  isAssetConfigurationVisible.value = false
}

function handleTopActionClick(actionId) {
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

  const response = await saveSceneDocument(latestPreparedScene.value)

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
