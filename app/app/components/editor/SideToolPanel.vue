<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const tools = ['Models', 'Floors', 'Blocks', 'Light', 'Audio', 'Media']
</script>

<template>
  <OverlayCard class="left-panel">
    <OverlayButton
      v-for="tool in tools"
      :key="tool"
      :label="tool"
      class="tool-button"
    />
  </OverlayCard>
</template>

<style scoped>
.left-panel {
  top: 28%;
  left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 10.2rem;
  padding: 0.95rem;
  border-radius: 0.9rem;
}

.tool-button {
  text-align: left;
}

@media (max-width: 900px) {
  .left-panel {
    top: auto;
    bottom: 6.4rem;
    transform: scale(0.94);
    transform-origin: bottom left;
  }
}
</style>
