<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <button type="button" class="overlay-button">
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped>
.overlay-button {
  border: 1px solid rgba(124, 138, 110, 0.32);
  border-radius: 0.58rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  color: #4e5b41;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 0.58rem 0.72rem;
  cursor: pointer;
}
</style>
