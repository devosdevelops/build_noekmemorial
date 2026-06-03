<template>
  <div class="editor-page-shell">
    <EditorSpace @editor-ready="handleEditorReady" />

    <AppLoadingScreen
      v-if="isEditorBooting"
      class="editor-loading-overlay"
      mode="editor"
      message="Editor wordt opgestart..."
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppLoadingScreen from '../../components/ui/AppLoadingScreen.vue'
const route = useRoute()

const workspaceQueryParam = route.query.workspaceId
const resolvedWorkspaceId = Array.isArray(workspaceQueryParam)
  ? workspaceQueryParam[0]
  : workspaceQueryParam

if (!resolvedWorkspaceId || typeof resolvedWorkspaceId !== 'string' || !resolvedWorkspaceId.length) {
  await navigateTo('/dashboard', { replace: true })
}

const isEditorBooting = ref(true)
const loaderStartedAt = Date.now()

async function handleEditorReady() {
  const elapsedMs = Date.now() - loaderStartedAt
  const minDurationMs = 2000
  const remainingMs = minDurationMs - elapsedMs

  if (remainingMs > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, remainingMs)
    })
  }

  isEditorBooting.value = false
}

definePageMeta({
  layout: 'editor',
  middleware: ['auth']
})

import EditorSpace from '../../components/spaces/EditorSpace.vue'
</script>

<style scoped>
.editor-page-shell {
  position: relative;
  width: 100%;
  min-height: 100svh;
}

.editor-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
</style>
