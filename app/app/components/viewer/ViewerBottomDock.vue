<template>
  <nav class="viewer-dock" aria-label="Viewer acties">
    <button type="button" class="viewer-dock__icon-button" aria-label="Toevoegen" title="Toevoegen" @click="$emit('open-add')">
      <img src="/icons/plus.svg" alt="" aria-hidden="true" class="viewer-dock__icon" />
    </button>
    <button type="button" class="viewer-dock__icon-button" aria-label="Bericht" title="Bericht" @click="$emit('open-message')">
      <img src="/icons/chat.svg" alt="" aria-hidden="true" class="viewer-dock__icon" />
    </button>
    <button type="button" class="viewer-dock__icon-button" aria-label="Kaars" title="Kaars" @click="$emit('open-candle')">
      <img src="/icons/candle.svg" alt="" aria-hidden="true" class="viewer-dock__icon" />
    </button>
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
  background: rgba(251, 252, 249, 0.9);
  border: 1px solid rgba(162, 174, 143, 0.35);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 20px rgba(32, 40, 26, 0.18);
}

.viewer-dock__icon-button {
  border: 0;
  border-radius: 999px;
  min-height: 2.4rem;
  min-width: 2.4rem;
  padding: 0;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.viewer-dock__icon-button:hover {
  filter: brightness(1.06);
}

.viewer-dock__icon {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: contain;
}

@media (max-width: 700px) {
  .viewer-dock {
    bottom: max(0.9rem, env(safe-area-inset-bottom));
    width: calc(100% - 1rem);
    justify-content: space-between;
  }

  .viewer-dock__icon-button {
    flex: 1;
  }
}
</style>
