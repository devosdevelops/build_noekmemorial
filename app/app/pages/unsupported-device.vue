<template>
  <div class="unsupported-page">
    <header class="unsupported-header">
      <div class="brand-row">
        <img src="/logo.png" alt="Columba" class="brand-logo" />
        <div class="brand-copy">
          <p class="brand-title">Columba</p>
          <p class="brand-subtitle">Uitvaartcentrum</p>
        </div>
      </div>
    </header>

    <main class="unsupported-main">
      <section class="unsupported-card" role="alert" aria-live="assertive">
        <p>
          De editor en het dashboard zijn niet beschikbaar op mobiel.
          Gelieve deze link te openen op een computer of laptop.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})
</script>

<style scoped>
.unsupported-page {
  min-height: 100svh;
  background: linear-gradient(180deg, #f5f5f3 0%, #e1e3dc 64%, #b4bf9b 100%);
  font-family: var(--font-sans);
}

.unsupported-header {
  background: #95a181;
  min-height: 96px;
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(46, 58, 32, 0.18);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.brand-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.brand-title {
  margin: 0;
  font-family: var(--font-display);
  color: #f2f4ec;
  font-size: 2rem;
  line-height: 1;
  font-weight: 700;
}

.brand-subtitle {
  margin: 0;
  color: #edf0e5;
  font-size: 1rem;
  line-height: 1.1;
}

.unsupported-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 5rem 1.5rem 2rem;
}

.unsupported-card {
  border: 4px solid #ea5236;
  border-radius: 18px;
  background: #f4dddd;
  color: #4f211c;
  padding: 1.4rem 1.6rem;
  box-sizing: border-box;
}

.unsupported-card p {
  margin: 0;
  font-size: clamp(1.85rem, 5.5vw, 3rem);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: 0;
}

@media (min-width: 768px) {
  .unsupported-main {
    padding-top: 6rem;
  }

  .unsupported-card {
    padding: 1.8rem 2rem;
  }

  .unsupported-card p {
    font-size: 2.55rem;
  }
}

@media (max-width: 380px) {
  .unsupported-main {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .unsupported-card p {
    font-size: 1.65rem;
  }
}
</style>
