<script setup>
import { computed } from 'vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
</script>

<template>
  <section class="space-screen">
    <h1>Viewer Space</h1>
    <p>Memorial slug: {{ slug }}</p>
    <p>This route is reserved for the public memorial experience.</p>
  </section>
</template>

<style scoped>
.space-screen {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: #f3f8ff;
}

.space-screen h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}
</style>
