<template>
  <EditorSpace />
</template>

<script setup>
const route = useRoute()

const workspaceQueryParam = route.query.workspaceId
const resolvedWorkspaceId = Array.isArray(workspaceQueryParam)
  ? workspaceQueryParam[0]
  : workspaceQueryParam

if (!resolvedWorkspaceId || typeof resolvedWorkspaceId !== 'string' || !resolvedWorkspaceId.length) {
  await navigateTo('/dashboard', { replace: true })
}

definePageMeta({
  layout: 'editor',
  middleware: ['auth']
})

import EditorSpace from '../../components/spaces/EditorSpace.vue'
</script>
