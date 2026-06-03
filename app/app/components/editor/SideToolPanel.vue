<script setup>
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['tool-click'])

const tools = [
  { id: 'models', label: 'Modellen', icon: 'Models.svg' },
  { id: 'floors', label: 'Vloeren', icon: 'Floor.svg' },
  { id: 'blocks', label: 'Blokken', icon: 'Blocks.svg' },
  { id: 'light', label: 'Licht', icon: 'Light.svg' },
  { id: 'audio', label: 'Geluid', icon: 'Audio.svg' },
  { id: 'media', label: 'Media', icon: 'Media.svg' }
]

function handleToolClick(toolId) {
  emit('tool-click', toolId)
}
</script>

<template>
  <OverlayCard class="left-panel" aria-label="Linker tools">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="tool-button"
      :aria-label="tool.label"
      @click="handleToolClick(tool.id)"
    >
      <span class="tool-button__icon-wrap" aria-hidden="true">
        <span class="tool-button__icon" :style="{ backgroundImage: `url('/icons/${tool.icon}')` }" />
      </span>
      <span class="tool-button__label">{{ tool.label }}</span>
    </button>
  </OverlayCard>
</template>

<style scoped>
.left-panel {
  top: 28%;
  left: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
  width: 14.2rem;
  padding: 1.15rem;
  border-top-right-radius: 0.9rem;
  border-bottom-right-radius: 0.9rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.tool-button {
  display: flex;
  align-items: stretch;
  width: 100%;
  padding: 0;
  border: 2px solid rgba(124, 138, 110, 0.74);
  border-radius: 0.92rem;
  background: linear-gradient(165deg, rgba(243, 246, 238, 0.95), rgba(220, 228, 211, 0.9));
  color: #141414;
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  transition: transform 140ms ease, border-color 160ms ease;
}

.tool-button:hover {
  border-color: rgba(114, 131, 98, 0.9);
  transform: translateX(1px);
}

.tool-button:focus-visible {
  outline: 2px solid rgba(82, 111, 152, 0.85);
  outline-offset: 3px;
}

.tool-button__icon-wrap {
  width: 3.3rem;
  flex: 0 0 3.3rem;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #a6b88d, #8ea175);
}

.tool-button__icon {
  width: 1.62rem;
  height: 1.62rem;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  filter: brightness(0) invert(1);
}

.tool-button__label {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 3.3rem;
  padding: 0 1rem 0 1.2rem;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.01em;
}

@media (max-width: 900px) {
  .left-panel {
    top: auto;
    bottom: 6.4rem;
    transform: scale(0.94);
    transform-origin: bottom left;
  }

  .tool-button__icon-wrap {
    width: 2.9rem;
    flex-basis: 2.9rem;
  }

  .tool-button__label {
    min-height: 2.9rem;
    font-size: 0.9rem;
    padding-left: 0.94rem;
  }
}
</style>
