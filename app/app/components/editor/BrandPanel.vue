<template>
  <OverlayCard class="brand-card">
    <img class="brand-logo" src="/logo.png" alt="Columba" />
  </OverlayCard>
</template>

<script setup>
import OverlayCard from '../ui/OverlayCard.vue'
</script>

<style scoped>
.brand-card {
  top: 1.5rem;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.85rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 0.9rem;
  border-bottom-right-radius: 0.9rem;
}

.brand-logo {
  display: block;
  width: auto;
  height: 3.1rem;
  object-fit: contain;
}

@media (max-width: 900px) {
  .brand-card {
    transform: scale(0.94);
    transform-origin: top left;
  }
}
</style>
