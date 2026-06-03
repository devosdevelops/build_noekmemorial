<script setup>
import { computed } from 'vue'
import ViewerSpace from '../../../components/spaces/ViewerSpace.vue'

definePageMeta({
  layout: false
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
</script>

<template>
  <ViewerSpace :slug="slug" />
</template>
