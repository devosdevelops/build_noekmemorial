<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfb 100%);
  border: 1px solid #d9dfd6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(37, 52, 35, 0.08);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 14px rgba(37, 52, 35, 0.11);
}
</style>
