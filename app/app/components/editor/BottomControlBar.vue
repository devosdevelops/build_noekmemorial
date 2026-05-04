<script setup>
import { ref } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['tool-change', 'history-action'])

const groupedControls = [
  [
    { id: 'select', label: 'Select' },
    { id: 'pan', label: 'Pan' },
    { id: 'center', label: 'Center' }
  ],
  [
    { id: 'move', label: 'Move' },
    { id: 'rotate', label: 'Rotate' },
    { id: 'scale', label: 'Scale' }
  ],
  [
    { id: 'reset', label: 'Reset' },
    { id: 'undo', label: 'Undo' },
    { id: 'redo', label: 'Redo' }
  ]
]

const selectedTool = ref('move')

function isToolControl(controlId) {
  return controlId === 'select' || controlId === 'pan' || controlId === 'move' || controlId === 'rotate' || controlId === 'scale'
}

function handleControlClick(controlId) {
  if (isToolControl(controlId)) {
    selectedTool.value = controlId
    emit('tool-change', controlId)
    return
  }

  if (controlId === 'undo' || controlId === 'redo' || controlId === 'reset' || controlId === 'center') {
    emit('history-action', controlId)
  }
}
</script>

<template>
  <OverlayCard class="bottom-toolbar" aria-label="Editor controls">
    <template v-for="(group, groupIndex) in groupedControls" :key="`group-${groupIndex}`">
      <OverlayButton
        v-for="control in group"
        :key="control.id"
        :label="control.label"
        :is-active="isToolControl(control.id) && control.id === selectedTool"
        @click="handleControlClick(control.id)"
      />
      <span
        v-if="groupIndex < groupedControls.length - 1"
        :key="`divider-${groupIndex}`"
        class="toolbar-divider"
        aria-hidden="true"
      />
    </template>
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

.toolbar-divider {
  width: 1px;
  align-self: stretch;
  margin: 0 0.14rem;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(118, 135, 102, 0.2), rgba(94, 112, 78, 0.62), rgba(118, 135, 102, 0.2));
}

@media (max-width: 900px) {
  .bottom-toolbar {
    flex-wrap: wrap;
    width: min(92vw, 34rem);
    justify-content: center;
    transform: translateX(-50%);
  }

  .toolbar-divider {
    display: none;
  }
}
</style>
