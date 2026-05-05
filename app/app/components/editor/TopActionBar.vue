<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['action-click'])

const actions = [
  { id: 'home', label: 'Home' },
  { id: 'settings', label: 'Settings' },
  { id: 'load', label: 'Load' },
  { id: 'save', label: 'Save' },
  { id: 'preview', label: 'Preview' }
]

function handleActionClick(actionId) {
  emit('action-click', actionId)
}
</script>

<template>
  <OverlayCard class="top-actions" aria-label="Top actions">
    <OverlayButton
      v-for="action in actions"
      :key="action.id"
      :label="action.label"
      @click="handleActionClick(action.id)"
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
