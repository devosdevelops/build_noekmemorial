<template>
  <div class="alert-toast" :class="`alert-toast--${type}`" role="status" aria-live="polite">
    <p v-if="title" class="alert-title">{{ title }}</p>
    <p v-if="message" class="alert-message">{{ message }}</p>
    <div v-if="$slots.default" class="alert-actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'warning'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.alert-toast {
  display: block;
  margin: 0.85rem 0;
  border-radius: 16px;
  border: 4px solid #e95038;
  background: #f2dada;
  padding: 0.85rem 1rem;
  color: #4e1f1a;
}

.alert-toast--error {
  border-color: #e95038;
  background: #f2dada;
  color: #4e1f1a;
}

.alert-toast--warning {
  border-color: #e95d45;
  background: #f6dfd9;
  color: #4f221d;
}

.alert-toast--success {
  border-color: #7ca25e;
  background: #e6f0dd;
  color: #24411a;
}

.alert-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}

.alert-message {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.4;
}

.alert-title + .alert-message {
  margin-top: 0.25rem;
}

.alert-actions {
  margin-top: 0.55rem;
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}
</style>
