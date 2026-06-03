<template>
  <DashboardLayout :showSidebar="false">
    <div class="create-room-page">
      <section class="left-column">
        <Card class="intro-card">
          <h2>Nieuwe herdenkingsruimte opstellen</h2>
          <p>Stel hier in hoe je wilt dat de ruimte in elkaar zit</p>
        </Card>

        <Card class="templates-heading-card">
          <h3>Templates</h3>
        </Card>

        <button
          class="template-card"
          :class="{ selected: selectedTemplate === 'empty' }"
          type="button"
          @click="selectedTemplate = 'empty'"
        >
          <div class="template-content">
            <h4>Lege Ruimte</h4>
            <p>Een lege template die je de volledige vrijheid geeft om alles zelf in te richten</p>
          </div>
          <div class="template-visual wireframe-room" aria-hidden="true"></div>
        </button>

        <button
          class="template-card"
          :class="{ selected: selectedTemplate === 'hobby' }"
          type="button"
          @click="selectedTemplate = 'hobby'"
        >
          <div class="template-content">
            <h4>Slaap / Hobby kamer</h4>
            <p>Een kamer die al praktisch volledig is ingericht met allerlei objecten. Beschikt al over alle basis elementen die je nodig hebt.</p>
          </div>
          <div class="template-visual colorful-room" aria-hidden="true"></div>
        </button>
      </section>

      <aside class="right-column">
        <Card class="form-card">
          <label class="field-label" for="room-name">Naam van Ruimte</label>
          <input
            id="room-name"
            v-model="roomName"
            type="text"
            class="text-input"
            placeholder="Naam ruimte"
          />
        </Card>

        <Card class="form-card">
          <label class="field-label">Naam Overledene</label>
          <div class="name-row">
            <input
              v-model="firstName"
              type="text"
              class="text-input"
              placeholder="Voornaam"
            />
            <input
              v-model="lastName"
              type="text"
              class="text-input"
              placeholder="Achternaam"
            />
          </div>
        </Card>

        <Card class="form-card">
          <h4 class="section-title">Zichtbaarheids Instellingen</h4>
          <div class="radio-row">
            <label class="radio-item">
              <input v-model="visibility" type="radio" value="public" />
              <span>Publiek</span>
            </label>
            <label class="radio-item">
              <input v-model="visibility" type="radio" value="private" />
              <span>Afgeschermd</span>
            </label>
          </div>
          <p class="help-text">
            Als hij publiek is, kan iedereen de herdenkingsruimte bezoeken die de link heeft.
            Als hij afgeschermd is, kunnen enkel mensen met de pincode of speciale QR code hem bezoeken.
          </p>
        </Card>

        <Card class="form-card">
          <h4 class="section-title">Bijdrage goedkeuringsinstellingen</h4>
          <div class="radio-stack">
            <label class="radio-item">
              <input v-model="approvalMode" type="radio" value="manual" />
              <span>Handmatige goedkeuring (aanbevolen)</span>
            </label>
            <label class="radio-item">
              <input v-model="approvalMode" type="radio" value="auto" />
              <span>Automatische goedkeuring</span>
            </label>
          </div>
        </Card>

        <button class="create-room-button" type="button">
          <span class="btn-icon">+</span>
          Maak Ruimte Aan
        </button>
      </aside>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref } from 'vue'
import DashboardLayout from '../../components/dashboard/DashboardLayout.vue'
import Card from '../../components/ui/Card.vue'

definePageMeta({
  layout: false
})

const selectedTemplate = ref('empty')
const roomName = ref('')
const firstName = ref('')
const lastName = ref('')
const visibility = ref('public')
const approvalMode = ref('manual')
</script>

<style scoped>
.create-room-page {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 5fr 3fr;
  gap: 1.5rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.intro-card h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.intro-card p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.templates-heading-card {
  padding: 1rem 1.5rem;
  margin-top: 0.75rem;
}

.templates-heading-card h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: #1a1a1a;
}

.template-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  text-align: left;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfb 100%);
  border: 1px solid #d9dfd6;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 2px 8px rgba(37, 52, 35, 0.08);
  cursor: pointer;
}

.template-card.selected {
  border-color: #7a8568;
  box-shadow: 0 0 0 2px rgba(122, 133, 104, 0.2);
}

.template-content {
  max-width: 62%;
}

.template-content h4 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: #1a1a1a;
}

.template-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

.template-visual {
  width: 170px;
  height: 170px;
  border-radius: 10px;
  flex-shrink: 0;
}

.wireframe-room {
  background:
    linear-gradient(150deg, transparent 49%, #202020 50%, #202020 51%, transparent 52%),
    linear-gradient(30deg, transparent 49%, #202020 50%, #202020 51%, transparent 52%),
    linear-gradient(0deg, #6d6d6d 0%, #3f3f3f 100%);
  background-size: 24px 24px, 24px 24px, cover;
}

.colorful-room {
  background:
    radial-gradient(circle at 30% 25%, #ffc0da 0%, #f29abf 42%, transparent 43%),
    radial-gradient(circle at 70% 72%, #8fe1da 0%, #58b6c6 35%, transparent 36%),
    linear-gradient(135deg, #f9c7df 0%, #ca9fda 60%, #6f8fb8 100%);
}

.form-card {
  padding: 0.9rem 1rem;
}

.field-label,
.section-title {
  display: block;
  margin: 0 0 0.5rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section-title {
  margin-bottom: 0.5rem;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  font-size: 0.95rem;
  color: #f5f7fb;
  background: linear-gradient(180deg, #adb2bd 0%, #9ea3ae 100%);
}

.text-input::placeholder {
  color: #e8ebf2;
}

.name-row {
  display: flex;
  width: 100%;
  gap: 1rem;
}

.name-row .text-input {
  flex: 1;
  min-width: 0;
}

.radio-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.65rem;
}

.radio-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
}

.radio-item input {
  accent-color: #8f83c4;
}

.help-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #666;
}

.create-room-button {
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 0.95rem;
  font-family: var(--font-sans);
  font-weight: 600;
  color: #ffffff;
  background: var(--ok-gradient, linear-gradient(180deg, #82D14D 0%, #629D3A 100%));
  box-shadow: 0 3px 10px rgba(98, 157, 58, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
}

.btn-icon {
  font-size: 1.1em;
  line-height: 1;
}

@media (max-width: 1024px) {
  .create-room-page {
    grid-template-columns: 1fr;
  }

  .template-content {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .intro-card h2,
  .templates-heading-card h3,
  .template-content h4 {
    font-size: 1.6rem;
  }

  .template-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .template-visual {
    width: 100%;
    height: 120px;
  }

  .name-row {
    grid-template-columns: 1fr;
  }

  .create-room-button {
    font-size: 1.25rem;
  }

  .btn-icon {
    font-size: 1.4rem;
  }
}
</style>
