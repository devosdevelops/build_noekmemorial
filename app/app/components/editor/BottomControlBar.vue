<script setup>
import { ref } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['tool-change'])

const controls = [
  { id: 'select', label: 'Select' },
  { id: 'move', label: 'Move' },
  { id: 'rotate', label: 'Rotate' },
  { id: 'scale', label: 'Scale' },
  { id: 'undo', label: 'Undo' },
  { id: 'redo', label: 'Redo' }
]

const selectedTool = ref('move')

function isToolControl(controlId) {
  return controlId === 'select' || controlId === 'move' || controlId === 'rotate' || controlId === 'scale'
}

function handleControlClick(controlId) {
  if (!isToolControl(controlId)) {
    return
  }

  selectedTool.value = controlId
  emit('tool-change', controlId)
}
</script>

<template>
  <OverlayCard class="bottom-toolbar" aria-label="Editor controls">
    <OverlayButton
      v-for="control in controls"
      :key="control.id"
      :label="control.label"
      :is-active="isToolControl(control.id) && control.id === selectedTool"
      @click="handleControlClick(control.id)"
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
