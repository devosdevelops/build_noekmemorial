<script setup lang="ts">
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const controls = ['Select', 'Move', 'Rotate', 'Scale', 'Undo', 'Redo']
</script>

<template>
  <OverlayCard class="bottom-toolbar" aria-label="Editor controls">
    <OverlayButton
      v-for="control in controls"
      :key="control"
      :label="control"
    />
  </OverlayCard>
</template>

<style scoped>
.bottom-toolbar {
  left: 50%;
  bottom: 1.5rem;
  display: flex;
  gap: 0.52rem;
  transform: translateX(-50%);
  padding: 0.55rem;
  border-radius: 0.9rem;
}

@media (max-width: 900px) {
  .bottom-toolbar {
    flex-wrap: wrap;
    width: min(92vw, 34rem);
    justify-content: center;
    transform: translateX(-50%);
  }
}
</style>
