<template>
  <div class="space-shell">
    <header class="space-header">
      <nav class="space-nav">
        <NuxtLink to="/editor" class="space-link">Editor</NuxtLink>
        <NuxtLink to="/dashboard" class="space-link">Dashboard</NuxtLink>
        <NuxtLink to="/viewer/demo" class="space-link">Viewer</NuxtLink>
      </nav>
    </header>
    <main class="space-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.space-shell {
  min-height: 100vh;
}

.space-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(7, 15, 24, 0.82);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.space-nav {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
}

.space-link {
  color: #ecf8ff;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.4rem 0.65rem;
  border-radius: 0.5rem;
}

.space-link.router-link-active {
  background: rgba(143, 220, 255, 0.2);
}

.space-main {
  min-height: calc(100vh - 56px);
}
</style>
