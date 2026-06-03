<template>
  <aside class="viewer-rail" aria-label="Viewer weergave instellingen">
    <button type="button" class="viewer-rail__toggle" @click="$emit('toggle-music')">
      {{ isMusicOn ? 'Muziek uit' : 'Muziek aan' }}
    </button>

    <button type="button" class="viewer-rail__toggle" @click="$emit('toggle-ui')">
      {{ isUiHidden ? 'Toon UI' : 'Verberg UI' }}
    </button>

    <div v-if="!isUiHidden" class="viewer-rail__modes" role="group" aria-label="Navigatiemodus">
      <button
        v-for="mode in modes"
        :key="mode.value"
        type="button"
        class="viewer-rail__mode-button"
        :class="{ 'viewer-rail__mode-button--active': activeMode === mode.value }"
        @click="$emit('set-mode', mode.value)"
      >
        {{ mode.label }}
      </button>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  isUiHidden: {
    type: Boolean,
    default: false
  },
  isMusicOn: {
    type: Boolean,
    default: false
  },
  activeMode: {
    type: String,
    default: 'look-around'
  }
})

defineEmits(['toggle-ui', 'set-mode', 'toggle-music'])

const modes = [
  { value: 'look-around', label: 'Kijken' },
  { value: 'flythrough', label: 'Fly' }
]
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
  background: rgba(8, 15, 22, 0.78);
  color: #eff7ff;
  border: 1px solid rgba(224, 238, 248, 0.2);
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
