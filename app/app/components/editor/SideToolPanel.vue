<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['tool-click'])

const tools = [
  { id: 'models', label: 'Models' },
  { id: 'floors', label: 'Floors' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'light', label: 'Light' },
  { id: 'audio', label: 'Audio' },
  { id: 'media', label: 'Media' }
]

function handleToolClick(toolId) {
  emit('tool-click', toolId)
}
</script>

<template>
  <OverlayCard class="left-panel">
    <OverlayButton
      v-for="tool in tools"
      :key="tool.id"
      :label="tool.label"
      class="tool-button"
      @click="handleToolClick(tool.id)"
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
