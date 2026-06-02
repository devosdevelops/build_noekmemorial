<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const props = defineProps({
  activeInteractionMode: {
    type: String,
    default: 'select'
  },
  activeEditTool: {
    type: String,
    default: 'move'
  }
})

const emit = defineEmits(['interaction-mode-change', 'edit-tool-change', 'history-action'])

const groupedControls = [
  [
    { id: 'select', label: 'Selecteren' },
    { id: 'pan', label: 'Pannen' },
    { id: 'center', label: 'Centreren' }
  ],
  [
    { id: 'move', label: 'Verplaatsen' },
    { id: 'rotate', label: 'Roteren' },
    { id: 'scale', label: 'Schalen' }
  ],
  [
    { id: 'reset', label: 'Resetten' },
    { id: 'undo', label: 'Ongedaan' },
    { id: 'redo', label: 'Opnieuw' }
  ]
]

function isInteractionControl(controlId) {
  return controlId === 'select' || controlId === 'pan'
}

function isEditControl(controlId) {
  return controlId === 'move' || controlId === 'rotate' || controlId === 'scale'
}

function isControlActive(controlId) {
  if (isInteractionControl(controlId)) {
    return controlId === props.activeInteractionMode
  }

  if (isEditControl(controlId)) {
    return controlId === props.activeEditTool
  }

  return false
}

function handleControlClick(controlId) {
  if (isInteractionControl(controlId)) {
    emit('interaction-mode-change', controlId)
    return
  }

  if (isEditControl(controlId)) {
    emit('edit-tool-change', controlId)
    return
  }

  if (controlId === 'undo' || controlId === 'redo' || controlId === 'reset' || controlId === 'center') {
    emit('history-action', controlId)
  }
}
</script>

<template>
  <OverlayCard class="bottom-toolbar" aria-label="Editorbediening">
    <template v-for="(group, groupIndex) in groupedControls" :key="`group-${groupIndex}`">
      <OverlayButton
        v-for="control in group"
        :key="control.id"
        :label="control.label"
        :is-active="isControlActive(control.id)"
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
