<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <EditorSceneViewport
      class="scene-layer"
      :active-tool="activeTool"
    />
    <BrandPanel />
    <SideToolPanel />
    <TopActionBar />
    <BottomControlBar
      @tool-change="handleToolChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BottomControlBar from './components/editor/BottomControlBar.vue'
import BrandPanel from './components/editor/BrandPanel.vue'
import SideToolPanel from './components/editor/SideToolPanel.vue'
import TopActionBar from './components/editor/TopActionBar.vue'
import EditorSceneViewport from './components/scene/EditorSceneViewport.client.vue'

type EditorTool = 'select' | 'move' | 'rotate' | 'scale'

const activeTool = ref<EditorTool>('move')

function handleToolChange(nextTool: EditorTool): void {
  activeTool.value = nextTool
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&family=Poppins:wght@500;600&display=swap');

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
