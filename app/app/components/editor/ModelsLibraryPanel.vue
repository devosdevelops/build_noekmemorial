<script setup>
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

// Add or remove Poly Pizza list IDs here to control which models appear.
const POLY_PIZZA_LIST_IDS = [
  // 'YOUR_LIST_ID_HERE'
]

const emit = defineEmits(['close', 'select-model'])

function handleClose() {
  emit('close')
}
</script>

<template>
  <OverlayCard class="models-library" aria-label="Models library">
    <header class="library-header">
      <h2 class="library-title">Models</h2>
      <OverlayButton class="close-button" label="Close" @click="handleClose" />
    </header>

    <p class="library-subtitle">Pick a 3D model to add to the scene.</p>

    <p class="library-placeholder">No models loaded yet.</p>
  </OverlayCard>
</template>

<style scoped>
.models-library {
  top: 28%;
  left: calc(1.5rem + 10.2rem + 16px);
  z-index: 3;
  width: min(22rem, calc(100vw - 2rem));
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

.library-placeholder {
  margin: 0;
  color: rgba(68, 80, 56, 0.5);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem 0;
}

@media (max-width: 900px) {
  .models-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(22rem, calc(100vw - 2rem));
  }
}
</style>
