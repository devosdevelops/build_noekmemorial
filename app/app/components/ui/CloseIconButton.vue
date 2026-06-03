<script setup>
const props = defineProps({
  ariaLabel: {
    type: String,
    default: 'Sluiten'
  }
})
</script>

<template>
  <button type="button" class="close-icon-button" :aria-label="props.ariaLabel">
    <span class="close-icon" aria-hidden="true" />
  </button>
</template>

<style scoped>
.close-icon-button {
  width: 2rem;
  height: 2rem;
  border: 1px solid transparent;
  border-radius: 0.52rem;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.close-icon-button:hover {
  border-color: rgba(124, 138, 110, 0.22);
  background: rgba(124, 138, 110, 0.08);
}

.close-icon-button:focus-visible {
  outline: 2px solid rgba(90, 116, 60, 0.72);
  outline-offset: 2px;
}

.close-icon {
  width: 1.08rem;
  height: 1.08rem;
  background-image: url('/icons/Close_Button.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
</style>