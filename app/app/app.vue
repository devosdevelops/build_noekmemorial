<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <EditorSceneViewport
      class="scene-layer"
      :active-tool="activeTool"
      :history-action="historyAction"
    />
    <BrandPanel />
    <SideToolPanel />
    <TopActionBar />
    <BottomControlBar
      @tool-change="handleToolChange"
      @history-action="handleHistoryAction"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BottomControlBar from './components/editor/BottomControlBar.vue'
import BrandPanel from './components/editor/BrandPanel.vue'
import SideToolPanel from './components/editor/SideToolPanel.vue'
import TopActionBar from './components/editor/TopActionBar.vue'
import EditorSceneViewport from './components/scene/EditorSceneViewport.client.vue'

const activeTool = ref('move')
const historyAction = ref({
  type: null,
  sequence: 0
})

function handleToolChange(nextTool) {
  activeTool.value = nextTool
}

function handleHistoryAction(actionType) {
  if (actionType !== 'undo' && actionType !== 'redo' && actionType !== 'reset') {
    return
  }

  historyAction.value = {
    type: actionType,
    sequence: historyAction.value.sequence + 1
  }
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
