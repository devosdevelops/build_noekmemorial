<template>
  <aside class="viewer-rail" aria-label="Viewer weergave instellingen">
    <button type="button" class="viewer-rail__toggle" @click="$emit('toggle-music')">
      {{ isMusicOn ? 'Muziek uit' : 'Muziek aan' }}
    </button>

    <button type="button" class="viewer-rail__toggle" @click="$emit('toggle-ui')">
      {{ isUiHidden ? 'Toon UI' : 'Verberg UI' }}
    </button>

    <button v-if="!isUiHidden" type="button" class="viewer-rail__mode-button" @click="$emit('reset-view')">
      Reset view
    </button>
  </aside>
</template>

<script setup>
defineProps({
  isUiHidden: {
    type: Boolean,
    default: false
  },
  isMusicOn: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-ui', 'toggle-music', 'reset-view'])
</script>

<style scoped>
.viewer-rail {
  position: absolute;
  top: 50%;
  right: 0.9rem;
  transform: translateY(-50%);
  z-index: 25;
  display: grid;
  gap: 0.6rem;
}

.viewer-rail__toggle,
.viewer-rail__mode-button {
  border: 0;
  border-radius: 10px;
  min-height: 2.3rem;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  background: rgba(251, 252, 249, 0.92);
  color: #2a3527;
  border: 1px solid rgba(162, 174, 143, 0.36);
  box-shadow: 0 6px 16px rgba(32, 40, 26, 0.14);
}

.viewer-rail__modes {
  display: grid;
  gap: 0.4rem;
}

.viewer-rail__mode-button--active {
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  border-color: transparent;
}
</style>
