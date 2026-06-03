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
  right: 1.5rem;
  transform: translateY(-50%);
  z-index: 25;
  display: grid;
  gap: 0.58rem;
}

.viewer-rail__toggle,
.viewer-rail__mode-button {
  border: 1px solid rgba(124, 138, 110, 0.32);
  border-radius: 0.76rem;
  min-height: 2.68rem;
  padding: 0.5rem 0.88rem;
  cursor: pointer;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  color: #33402b;
  font-size: 0.78rem;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(32, 40, 26, 0.14);
}

.viewer-rail__modes {
  display: grid;
  gap: 0.4rem;
}

.viewer-rail__mode-button--active {
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  border-color: transparent;
}

@media (max-width: 900px) {
  .viewer-rail {
    top: auto;
    right: 0.9rem;
    bottom: 5.7rem;
    transform: none;
  }
}
</style>
