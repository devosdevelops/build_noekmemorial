<template>
  <header class="viewer-topbar">
    <div class="viewer-topbar__logo-wrap">
      <img src="/logo-white.png" alt="Columba" class="viewer-topbar__logo" />
    </div>

    <div class="viewer-topbar__user">
      <template v-if="isAuthenticated">
        <p class="viewer-topbar__user-name">{{ accountLabel }}</p>
        <button type="button" class="viewer-topbar__button" @click="$emit('sign-out')">Uitloggen</button>
      </template>

      <template v-else>
        <p class="viewer-topbar__user-name">Gast: {{ guestName || 'Naam kiezen' }}</p>
        <button type="button" class="viewer-topbar__button" @click="$emit('edit-guest-name')">Naam wijzigen</button>
      </template>
    </div>
  </header>
</template>

<script setup>
defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  accountLabel: {
    type: String,
    default: ''
  },
  guestName: {
    type: String,
    default: ''
  }
})

defineEmits(['edit-guest-name', 'sign-out'])
</script>

<style scoped>
.viewer-topbar {
  position: absolute;
  top: 1.5rem;
  left: 0;
  right: 0;
  z-index: 25;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  pointer-events: none;
}

.viewer-topbar__logo-wrap,
.viewer-topbar__user {
  pointer-events: auto;
  min-height: 3.1rem;
  padding: 0.48rem 0.78rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(251, 252, 249, 0.9);
  border: 1px solid rgba(162, 174, 143, 0.35);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 20px rgba(32, 40, 26, 0.18);
}

.viewer-topbar__logo-wrap {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 0.9rem;
  border-bottom-right-radius: 0.9rem;
}

.viewer-topbar__user {
  margin-right: 1.5rem;
  border-radius: 999px;
}

.viewer-topbar__logo {
  height: 2.55rem;
  width: auto;
}

.viewer-topbar__user-name {
  margin: 0;
  color: #2c3829;
  font-size: 0.82rem;
}

.viewer-topbar__button {
  border: 1px solid rgba(124, 138, 110, 0.32);
  border-radius: 0.76rem;
  min-height: 2.2rem;
  padding: 0 0.78rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  color: #3b4831;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 700px) {
  .viewer-topbar {
    top: max(0.75rem, env(safe-area-inset-top));
    left: 0.75rem;
    right: 0.75rem;
  }

  .viewer-topbar__logo-wrap {
    border-radius: 999px;
  }

  .viewer-topbar__user {
    margin-right: 0;
    max-width: 72vw;
  }

  .viewer-topbar__user-name {
    max-width: 38vw;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
