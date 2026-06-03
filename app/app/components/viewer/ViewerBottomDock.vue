<template>
  <nav class="viewer-dock" aria-label="Viewer acties">
    <button type="button" class="viewer-dock__button" @click="$emit('open-add')">+</button>
    <button type="button" class="viewer-dock__button" @click="$emit('open-message')">Bericht</button>
    <button type="button" class="viewer-dock__button" @click="$emit('open-candle')">Kaars</button>
  </nav>
</template>

<script setup>
defineEmits(['open-add', 'open-message', 'open-candle'])
</script>

<style scoped>
.viewer-dock {
  position: absolute;
  left: 50%;
  bottom: 0.9rem;
  transform: translateX(-50%);
  z-index: 25;
  display: flex;
  gap: 0.6rem;
  padding: 0.45rem;
  border-radius: 999px;
  background: rgba(6, 12, 18, 0.65);
  border: 1px solid rgba(224, 238, 248, 0.18);
  backdrop-filter: blur(6px);
}

.viewer-dock__button {
  border: 0;
  border-radius: 999px;
  min-height: 2.4rem;
  min-width: 2.4rem;
  padding: 0 0.95rem;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 0.85rem;
  cursor: pointer;
}

@media (max-width: 700px) {
  .viewer-dock {
    bottom: max(0.9rem, env(safe-area-inset-bottom));
    width: calc(100% - 1rem);
    justify-content: space-between;
  }

  .viewer-dock__button {
    flex: 1;
  }
}
</style>
