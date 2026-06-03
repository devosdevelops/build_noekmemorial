<script setup>
import { useAuth } from '../composables/useAuth'

if (import.meta.server) {
  await navigateTo('/auth/login', { replace: true })
} else {
  const { init, session } = useAuth()
  await init()

  await navigateTo(session.value ? '/dashboard' : '/auth/login', { replace: true })
}
</script>

<template>
  <div />
</template>
