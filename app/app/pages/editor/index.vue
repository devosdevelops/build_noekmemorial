<template>
  <EditorSpace />
</template>

<script setup>
definePageMeta({
  layout: 'editor',
  middleware: ['auth']
})

import EditorSpace from '../../components/spaces/EditorSpace.vue'
</script>
