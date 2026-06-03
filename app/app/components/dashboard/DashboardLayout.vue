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
      <div class="dashboard-container">
        <section class="dashboard-content">
          <slot />
        </section>

        <aside class="dashboard-sidebar">
          <DashboardAccountPanel />
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import DashboardAccountPanel from './DashboardAccountPanel.vue'
import '../../assets/css/dashboard.css'
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #f5f3f0;
  font-family: var(--font-sans);
}

.dashboard-header {
  background: linear-gradient(135deg, #7a9b7e 0%, #6b8a6f 100%);
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
