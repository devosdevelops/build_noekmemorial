<script setup>
import { computed } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const props = defineProps({
  persistenceStatus: {
    type: String,
    default: 'idle'
  },
  persistenceError: {
    type: String,
    default: ''
  },
  isSceneDirty: {
    type: Boolean,
    default: false
  }
})

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

const statusLabel = computed(() => {
  if (props.persistenceStatus === 'saving') {
    return 'Saving...'
  }

  if (props.persistenceStatus === 'loading') {
    return 'Loading...'
  }

  if (props.persistenceStatus === 'error') {
    return props.persistenceError || 'Error'
  }

  if (props.persistenceStatus === 'saved') {
    return props.isSceneDirty ? 'Saved (new changes)' : 'Saved'
  }

  return props.isSceneDirty ? 'Unsaved changes' : 'Ready'
})

const statusClass = computed(() => {
  if (props.persistenceStatus === 'error') {
    return 'top-actions__status--error'
  }

  if (props.persistenceStatus === 'saving' || props.persistenceStatus === 'loading') {
    return 'top-actions__status--busy'
  }

  if (props.isSceneDirty) {
    return 'top-actions__status--dirty'
  }

  return 'top-actions__status--ok'
})
</script>

<template>
  <OverlayCard class="top-actions" aria-label="Top actions">
    <p class="top-actions__status" :class="statusClass">{{ statusLabel }}</p>
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
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem;
  border-radius: 0.8rem;
}

.top-actions__status {
  margin: 0;
  padding: 0.42rem 0.58rem;
  border-radius: 0.52rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  background: rgba(240, 245, 234, 0.9);
  color: #4e5b41;
}

.top-actions__status--ok {
  color: #3f5a3f;
}

.top-actions__status--dirty {
  color: #69531c;
  background: rgba(250, 238, 199, 0.86);
}

.top-actions__status--busy {
  color: #2f5372;
  background: rgba(210, 230, 248, 0.82);
}

.top-actions__status--error {
  color: #8b2e2e;
  background: rgba(246, 214, 214, 0.92);
}

@media (max-width: 900px) {
  .top-actions {
    align-items: stretch;
    flex-wrap: wrap;
    transform: scale(0.94);
    transform-origin: top right;
  }

  .top-actions__status {
    width: 100%;
    text-align: center;
  }
}
</style>
