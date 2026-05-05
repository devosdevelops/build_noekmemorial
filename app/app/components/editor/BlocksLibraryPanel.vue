<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['close', 'add-block'])

const availableBlocks = [
  { id: 'square', label: 'Square' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'cone', label: 'Cone' }
]

function handleAddBlock(blockType) {
  emit('add-block', blockType)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <OverlayCard class="blocks-library" aria-label="Blocks library">
    <header class="library-header">
      <h2 class="library-title">Blocks</h2>
      <OverlayButton class="close-button" label="Close" @click="handleClose" />
    </header>

    <p class="library-subtitle">Pick a basic block to add to the scene.</p>

    <div class="blocks-grid">
      <OverlayButton
        v-for="block in availableBlocks"
        :key="block.id"
        :label="block.label"
        class="block-button"
        @click="handleAddBlock(block.id)"
      />
    </div>
  </OverlayCard>
</template>

<style scoped>
.blocks-library {
  top: 28%;
  left: calc(1.5rem + 10.2rem + 16px);
  z-index: 3;
  width: min(19rem, calc(100vw - 2rem));
  padding: 0.9rem;
  border-radius: 0.9rem;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.library-title {
  margin: 0;
  color: #4e5b41;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.close-button {
  padding: 0.42rem 0.62rem;
  font-size: 0.84rem;
}

.library-subtitle {
  margin: 0.66rem 0 0.72rem;
  color: rgba(68, 80, 56, 0.82);
  font-size: 0.88rem;
}

.blocks-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.52rem;
}

.block-button {
  text-align: left;
}

@media (max-width: 900px) {
  .blocks-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(20rem, calc(100vw - 2rem));
  }
}
</style>
