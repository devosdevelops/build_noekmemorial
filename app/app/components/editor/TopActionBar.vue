<script setup>
import { computed } from 'vue'
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
  },
  isGridVisible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['action-click'])

const actions = computed(() => [
  { id: 'save', label: 'Opslaan', icon: 'Save.svg', hasTwoStates: false },
  { id: 'load', label: 'Laden', icon: 'Load.svg', hasTwoStates: false },
  {
    id: 'toggle-grid',
    label: props.isGridVisible ? 'Raster verbergen' : 'Raster tonen',
    icon: 'Grid-Hide.svg',
    hasTwoStates: true,
    isActive: !props.isGridVisible
  },
  { id: 'home', label: 'Dashboard', icon: 'Home.svg', hasTwoStates: false },
  { id: 'publish', label: 'Publiceer', icon: 'Launch.svg', hasTwoStates: false },
  { id: 'settings', label: 'Instellingen', icon: 'Settings.svg', hasTwoStates: false }
])

function getActionIconStyle(action) {
  const iconPath = `/icons/${action.icon}`

  if (action.hasTwoStates) {
    return {
      backgroundImage: `url('${iconPath}')`,
      backgroundSize: '200% 100%',
      backgroundPosition: action.isActive ? 'left center' : 'right center'
    }
  }

  return {
    backgroundImage: `url('${iconPath}')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  }
}

function handleActionClick(actionId) {
  emit('action-click', actionId)
}

const statusLabel = computed(() => {
  if (props.persistenceStatus === 'saving') {
    return 'Opslaan...'
  }

  if (props.persistenceStatus === 'loading') {
    return 'Laden...'
  }

  if (props.persistenceStatus === 'error') {
    return props.persistenceError || 'Fout'
  }

  if (props.persistenceStatus === 'saved') {
    return props.isSceneDirty ? 'Opgeslagen (nieuwe wijzigingen)' : 'Opgeslagen'
  }

  return props.isSceneDirty ? 'Niet-opgeslagen wijzigingen' : 'Klaar'
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
  <OverlayCard class="top-actions" aria-label="Bovenste acties">
    <p class="top-actions__status" :class="statusClass">{{ statusLabel }}</p>
    <button
      v-for="action in actions"
      :key="action.id"
      type="button"
      class="top-actions__icon-button"
      :data-tooltip="action.label"
      :aria-label="action.label"
      @click="handleActionClick(action.id)"
    >
      <span class="top-actions__icon" :style="getActionIconStyle(action)" aria-hidden="true" />
    </button>
  </OverlayCard>
</template>

<style scoped>
.top-actions {
  top: 1.5rem;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.62rem;
  padding: 0.56rem 0.76rem 0.56rem 0.56rem;
  border-top-left-radius: 0.8rem;
  border-bottom-left-radius: 0.8rem;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.top-actions__icon-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(124, 138, 110, 0.32);
  border-radius: 0.76rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  cursor: pointer;
  transition: all 180ms ease;
}

.top-actions__icon-button:hover {
  border-color: rgba(114, 131, 98, 0.45);
}

.top-actions__icon-button:focus-visible {
  outline: 2px solid rgba(90, 116, 60, 0.72);
  outline-offset: 2px;
}

.top-actions__icon {
  width: 1.92rem;
  height: 1.92rem;
  display: block;
  background-repeat: no-repeat;
}

.top-actions__icon-button::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  top: calc(100% + 0.58rem);
  transform: translateX(-50%);
  min-width: max-content;
  max-width: 12rem;
  padding: 0.44rem 0.56rem;
  border-radius: 0.7rem;
  background: rgba(106, 106, 110, 0.97);
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 130ms ease;
  z-index: 4;
}

.top-actions__icon-button::before {
  content: '';
  position: absolute;
  left: 50%;
  top: calc(100% + 0.22rem);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 0.34rem solid transparent;
  border-right: 0.34rem solid transparent;
  border-bottom: 0.38rem solid rgba(106, 106, 110, 0.97);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 130ms ease;
  z-index: 4;
}

.top-actions__icon-button:last-child::after {
  left: auto;
  right: 0;
  transform: none;
}

.top-actions__icon-button:last-child::before {
  left: auto;
  right: 0.82rem;
  transform: none;
}

.top-actions__icon-button:hover::after,
.top-actions__icon-button:hover::before,
.top-actions__icon-button:focus-visible::after,
.top-actions__icon-button:focus-visible::before {
  opacity: 1;
  visibility: visible;
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
