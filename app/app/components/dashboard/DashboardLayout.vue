<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <div class="header-content">
        <div class="logo-section">
          <img src="/logo-white.png" alt="Columba" class="logo" />
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="dashboard-container" :class="{ 'dashboard-container-no-sidebar': !showSidebar }">
        <section class="dashboard-content">
          <slot />
        </section>

        <aside v-if="showSidebar" class="dashboard-sidebar">
          <DashboardAccountPanel />
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import DashboardAccountPanel from './DashboardAccountPanel.vue'
import '../../assets/css/dashboard.css'

defineProps({
  showSidebar: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: linear-gradient(160deg, #f3f2ee 0%, #edf0e8 52%, #e7eddf 100%);
  font-family: var(--font-sans);
}

.dashboard-header {
  background: var(--Brand-CTA, linear-gradient(180deg, #A3B18A 0%, #7A8568 100%));
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  height: 64px;
  width: auto;
}

.dashboard-main {
  padding: 2rem 1rem;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 5fr 3fr;
  gap: 2rem;
}

.dashboard-container-no-sidebar {
  grid-template-columns: 1fr;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .dashboard-container {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    padding: 0.75rem;
  }

  .logo {
    height: 48px;
  }
}
</style>
