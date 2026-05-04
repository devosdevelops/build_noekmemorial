<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button
    type="button"
    class="overlay-button"
    :class="{ 'overlay-button--selected': props.isActive }"
    :aria-pressed="props.isActive ? 'true' : 'false'"
  >
    <slot>{{ props.label }}</slot>
  </button>
</template>

<style scoped>
.overlay-button {
  border: 1px solid rgba(124, 138, 110, 0.32);
  border-radius: 0.58rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  color: #4e5b41;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 0.58rem 0.72rem;
  cursor: pointer;
  transition: all 180ms ease;
}

.overlay-button:hover {
  border-color: rgba(114, 131, 98, 0.45);
}

.overlay-button--selected {
  border-color: rgba(101, 124, 74, 0.72);
  background: linear-gradient(180deg, #eef5df, #d6e6be);
  color: #3e502e;
  box-shadow: 0 0 0 2px rgba(188, 208, 154, 0.55);
}
</style>
