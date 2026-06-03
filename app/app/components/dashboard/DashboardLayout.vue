<template>
  <div class="dashboard-layout">
    <header class="dashboard-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              fill="none"
              stroke="white"
              stroke-width="1.5"
            >
              <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12z" />
              <path d="M24 18v12M18 24h12" />
            </svg>
          </div>
          <div class="logo-text">
            <h1>Columba</h1>
            <p>Uitvaartcentrum</p>
          </div>
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
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #f5f3f0;
}

.dashboard-header {
  background: #7a9b7e;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.logo-text h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.logo-text p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.dashboard-main {
  padding: 2rem 1rem;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 320px;
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

  .logo-section {
    gap: 0.5rem;
  }

  .logo {
    width: 40px;
    height: 40px;
  }

  .logo-text h1 {
    font-size: 1rem;
  }
}
</style>
