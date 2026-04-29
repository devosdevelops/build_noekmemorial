<script setup lang="ts">
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const actions = ['Home', 'Settings', 'Save', 'Preview']
</script>

<template>
  <OverlayCard class="top-actions" aria-label="Top actions">
    <OverlayButton
      v-for="action in actions"
      :key="action"
      :label="action"
    />
  </OverlayCard>
</template>

<style scoped>
.top-actions {
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  gap: 0.55rem;
  padding: 0.5rem;
  border-radius: 0.8rem;
}

@media (max-width: 900px) {
  .top-actions {
    transform: scale(0.94);
    transform-origin: top right;
  }
}
</style>
