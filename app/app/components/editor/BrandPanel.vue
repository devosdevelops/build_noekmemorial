<template>
  <OverlayCard class="brand-card">
    <div class="brand-mark">C</div>
    <div>
      <p class="brand-title">Columba</p>
      <p class="brand-subtitle">Herinneringsstudio</p>
    </div>
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
  gap: 0.85rem;
  padding: 0.7rem 1rem;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 0.9rem;
  border-bottom-right-radius: 0.9rem;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(123, 138, 109, 0.34);
  color: #6c7d59;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  background: rgba(247, 248, 242, 0.94);
}

.brand-title {
  margin: 0;
  color: #59664a;
  font-family: 'Poppins', sans-serif;
  font-size: 1.35rem;
  line-height: 1.1;
}

.brand-subtitle {
  margin: 0.18rem 0 0;
  color: #758167;
  font-size: 0.92rem;
}

@media (max-width: 900px) {
  .brand-card {
    transform: scale(0.94);
    transform-origin: top left;
  }
}
</style>
