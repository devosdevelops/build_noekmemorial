<template>
  <section class="loading-screen" role="status" aria-live="polite" :aria-label="resolvedMessage">
    <div class="loading-brand">
      <img src="/logo.png" alt="Columba" class="loading-logo" />
      <div class="loading-brand-copy">
        <p class="loading-brand-title">Columba</p>
        <p class="loading-brand-subtitle">Uitvaartcentrum</p>
      </div>
    </div>

    <p class="loading-message">{{ resolvedMessage }}</p>

    <div class="loading-bar" aria-hidden="true">
      <div class="loading-bar-fill" :style="{ width: `${progress}%` }" />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'data'
  },
  message: {
    type: String,
    default: ''
  }
})

const progress = ref(10)
let progressTimer = null

const resolvedMessage = computed(() => {
  if (props.message && props.message.length) {
    return props.message
  }

  if (props.mode === 'editor') {
    return 'Editor wordt geladen...'
  }

  return 'Herdenkingsruimte wordt geladen...'
})

onMounted(() => {
  progressTimer = setInterval(() => {
    if (progress.value >= 92) {
      return
    }

    const increment = Math.max(1.2, (95 - progress.value) * 0.08)
    progress.value = Math.min(92, progress.value + increment)
  }, 220)
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
})
</script>

<style scoped>
.loading-screen {
  min-height: 100svh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem 1rem;
  background: linear-gradient(180deg, #f4f5f2 0%, #e3e6de 62%, #becaa9 100%);
  font-family: var(--font-sans);
}

.loading-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.loading-logo {
  width: clamp(72px, 12vw, 96px);
  height: auto;
}

.loading-brand-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.loading-brand-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  line-height: 1;
  font-weight: 700;
  color: #7a8667;
}

.loading-brand-subtitle {
  margin: 0;
  font-size: clamp(1.65rem, 2.8vw, 2.25rem);
  line-height: 1;
  color: #7a8667;
}

.loading-message {
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.2vw, 2.1rem);
  font-weight: 700;
  color: #111111;
}

.loading-bar {
  width: min(56rem, calc(100% - 1rem));
  height: clamp(54px, 7.4vw, 84px);
  border: 4px solid #778367;
  border-radius: 15px;
  background: rgba(229, 234, 222, 0.65);
  overflow: hidden;
  box-shadow: inset 0 3px 12px rgba(65, 81, 53, 0.1);
}

.loading-bar-fill {
  height: 100%;
  width: 0;
  border-radius: 11px;
  background: linear-gradient(90deg, #ece2d6 0%, #dcea9e 42%, #b7c89c 100%);
  transition: width 220ms linear;
}

@media (max-width: 720px) {
  .loading-screen {
    justify-content: flex-start;
    padding-top: 6rem;
  }

  .loading-brand-title {
    font-size: 2rem;
  }

  .loading-brand-subtitle {
    font-size: 1.45rem;
  }

  .loading-message {
    font-size: 1.7rem;
  }

  .loading-bar {
    width: calc(100% - 1.4rem);
    height: 62px;
  }
}
</style>