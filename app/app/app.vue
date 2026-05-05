<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <EditorSceneViewport
      class="scene-layer"
      :active-interaction-mode="activeInteractionMode"
      :active-edit-tool="activeEditTool"
      :history-action="historyAction"
      :block-action="blockAction"
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
    <TopActionBar />
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
const selectedAsset = ref(null)
const isAssetConfigurationVisible = ref(false)

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
  isAssetConfigurationVisible.value = false
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
