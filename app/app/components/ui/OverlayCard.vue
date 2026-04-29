<template>
  <section class="overlay-card">
    <slot />
  </section>
</template>

<style scoped>
.overlay-card {
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(126, 141, 112, 0.24);
  background: linear-gradient(165deg, rgba(243, 246, 238, 0.95), rgba(220, 228, 211, 0.9));
  box-shadow: 0 14px 32px rgba(73, 88, 60, 0.16);
  backdrop-filter: blur(4px);
}
</style>
