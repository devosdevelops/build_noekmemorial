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
  top: 0.85rem;
  left: 0.85rem;
  right: 0.85rem;
  z-index: 25;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  pointer-events: none;
}

.viewer-topbar__logo-wrap,
.viewer-topbar__user {
  pointer-events: auto;
  border-radius: 999px;
  min-height: 3rem;
  padding: 0.35rem 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(251, 252, 249, 0.9);
  border: 1px solid rgba(162, 174, 143, 0.35);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 20px rgba(32, 40, 26, 0.18);
}

.viewer-topbar__logo {
  height: 2.15rem;
  width: auto;
}

.viewer-topbar__user-name {
  margin: 0;
  color: #2c3829;
  font-size: 0.86rem;
}

.viewer-topbar__button {
  border: 0;
  border-radius: 999px;
  min-height: 1.85rem;
  padding: 0 0.75rem;
  background: rgba(171, 197, 148, 0.95);
  color: #ffffff;
  font-size: 0.75rem;
  cursor: pointer;
}

@media (max-width: 700px) {
  .viewer-topbar__user {
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
