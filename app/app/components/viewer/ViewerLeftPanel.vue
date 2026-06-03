<template>
  <aside class="viewer-left-panel" aria-label="Viewer interactievenster">
    <header class="viewer-left-panel__header">
      <h2>{{ panelTitle }}</h2>
      <button type="button" class="viewer-left-panel__close" @click="$emit('close')">×</button>
    </header>

    <div class="viewer-left-panel__content">
      <template v-if="activePanel === 'add'">
        <p v-if="!canPostMedia" class="viewer-left-panel__notice">
          Media toevoegen is alleen beschikbaar voor ingelogde gebruikers.
        </p>
        <template v-else>
          <div class="viewer-left-panel__form-grid">
            <label for="media-type">Media type</label>
            <select id="media-type" v-model="mediaForm.type" class="viewer-left-panel__select">
              <option value="image">Foto</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>

            <label for="media-url">Media URL</label>
            <input
              id="media-url"
              v-model="mediaForm.url"
              class="viewer-left-panel__input"
              type="url"
              placeholder="https://..."
            />

            <label for="media-title">Titel</label>
            <input
              id="media-title"
              v-model="mediaForm.title"
              class="viewer-left-panel__input"
              type="text"
              placeholder="Bijdrage titel"
            />

            <label for="media-caption">Bijschrift</label>
            <textarea
              id="media-caption"
              v-model="mediaForm.caption"
              class="viewer-left-panel__textarea"
              placeholder="Optioneel bijschrift"
            />
          </div>
          <button
            type="button"
            class="viewer-left-panel__action"
            :disabled="isSubmitting || !mediaForm.url.trim().length"
            @click="submitMedia"
          >
            {{ isSubmitting ? 'Bezig...' : 'Media plaatsen' }}
          </button>
        </template>
      </template>

      <template v-else-if="activePanel === 'message'">
        <p>Laat een bericht achter.</p>
        <textarea
          v-model="messageForm.message"
          class="viewer-left-panel__textarea"
          placeholder="Schrijf je bericht hier..."
        />
        <label for="voice-url" class="viewer-left-panel__label-inline">Voice URL (optioneel)</label>
        <input
          id="voice-url"
          v-model="messageForm.voiceUrl"
          class="viewer-left-panel__input"
          type="url"
          placeholder="https://..."
        />
        <button
          type="button"
          class="viewer-left-panel__action"
          :disabled="isSubmitting || (!messageForm.message.trim().length && !messageForm.voiceUrl.trim().length)"
          @click="submitMessage"
        >
          {{ isSubmitting ? 'Bezig...' : 'Bericht plaatsen' }}
        </button>
      </template>

      <template v-else-if="activePanel === 'candle'">
        <p>Kies een kaars en steek deze aan.</p>
        <div class="viewer-left-panel__chips">
          <button type="button" class="viewer-left-panel__chip" @click="candleForm.style = 'Klassiek'">Klassiek</button>
          <button type="button" class="viewer-left-panel__chip" @click="candleForm.style = 'Warm licht'">Warm licht</button>
          <button type="button" class="viewer-left-panel__chip" @click="candleForm.style = 'Goud'">Goud</button>
        </div>
        <p class="viewer-left-panel__selection">Gekozen stijl: {{ candleForm.style }}</p>
        <textarea
          v-model="candleForm.dedication"
          class="viewer-left-panel__textarea"
          placeholder="Optionele dedicatie"
        />
        <button
          type="button"
          class="viewer-left-panel__action"
          :disabled="isSubmitting"
          @click="submitCandle"
        >
          {{ isSubmitting ? 'Bezig...' : 'Kaars aansteken' }}
        </button>
      </template>

      <template v-else-if="activePanel === 'element'">
        <template v-if="selectedElement">
          <p class="viewer-left-panel__element-kicker">Geselecteerd object</p>
          <h3 class="viewer-left-panel__element-title">{{ selectedElement.title }}</h3>
          <p class="viewer-left-panel__element-description">{{ selectedElement.description }}</p>

          <div class="viewer-left-panel__chips">
            <button type="button" class="viewer-left-panel__chip" @click="$emit('quick-action', 'message')">
              Laat bericht
            </button>
            <button type="button" class="viewer-left-panel__chip" @click="$emit('quick-action', 'candle')">
              Steek kaars aan
            </button>
            <button type="button" class="viewer-left-panel__chip" @click="$emit('quick-action', 'add')">
              Voeg media toe
            </button>
          </div>

          <section class="viewer-left-panel__contributions">
            <h4>Recente bijdragen</h4>
            <p v-if="filteredContributions.length === 0" class="viewer-left-panel__contributions-empty">
              Nog geen bijdragen gekoppeld aan dit element.
            </p>
            <ul v-else class="viewer-left-panel__contributions-list">
              <li v-for="entry in filteredContributions" :key="entry.id" class="viewer-left-panel__contribution-item">
                <p class="viewer-left-panel__contribution-title">{{ contributionTitle(entry) }}</p>
                <p v-if="contributionExcerpt(entry)" class="viewer-left-panel__contribution-excerpt">
                  {{ contributionExcerpt(entry) }}
                </p>
              </li>
            </ul>
          </section>
        </template>

        <p v-else>Geen object geselecteerd. Klik of tik in de scène om details te openen.</p>
      </template>
      <template v-else>
        <p>Kies een actie onderaan om een bijdrage toe te voegen.</p>
      </template>

      <p v-if="submitError && !isSubmitting" class="viewer-left-panel__submit-error">{{ submitError }}</p>
      <p v-if="submitSuccessMessage && !isSubmitting" class="viewer-left-panel__submit-success">{{ submitSuccessMessage }}</p>
    </div>
  </aside>
</template>

<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  activePanel: {
    type: String,
    default: ''
  },
  canPostMedia: {
    type: Boolean,
    default: false
  },
  selectedElement: {
    type: Object,
    default: null
  },
  contributions: {
    type: Array,
    default: () => []
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  submitError: {
    type: String,
    default: ''
  },
  submitSuccessMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'quick-action', 'submit-message', 'submit-candle', 'submit-media'])

const messageForm = reactive({
  message: '',
  voiceUrl: ''
})

const candleForm = reactive({
  style: 'Klassiek',
  dedication: ''
})

const mediaForm = reactive({
  type: 'image',
  url: '',
  title: '',
  caption: ''
})

const panelTitle = computed(() => {
  if (props.activePanel === 'add') return 'Bijdrage toevoegen'
  if (props.activePanel === 'message') return 'Bericht achterlaten'
  if (props.activePanel === 'candle') return 'Kaars aansteken'
  if (props.activePanel === 'element') return 'Element details'
  return 'Interactie'
})

const filteredContributions = computed(() => {
  const elementId = props.selectedElement?.id
  const interactionType = props.selectedElement?.interaction?.type
  const mediaKind = props.selectedElement?.interaction?.mediaKind
  const source = Array.isArray(props.contributions) ? props.contributions : []

  const byElement = source.filter((entry) => {
    if (!elementId) {
      return true
    }

    return entry?.content?.element_id === elementId
  })

  if (interactionType !== 'media-carousel' || !mediaKind) {
    return byElement.slice(0, 8)
  }

  const filteredByKind = byElement.filter((entry) => {
    const entryType = String(entry?.type || '').toLowerCase()
    const mediaType = String(entry?.content?.media_type || '').toLowerCase()

    if (mediaKind === 'message') {
      return entryType === 'message' || entryType === 'post'
    }

    if (mediaKind === 'image-video') {
      return entryType === 'image' || entryType === 'video' || mediaType === 'image' || mediaType === 'video'
    }

    if (mediaKind === 'audio') {
      return entryType === 'audio' || mediaType === 'audio'
    }

    return true
  })

  return filteredByKind.slice(0, 8)
})

function contributionTitle(entry) {
  const title = typeof entry?.title === 'string' ? entry.title.trim() : ''
  if (title.length) {
    return title
  }

  return 'Bijdrage'
}

function contributionExcerpt(entry) {
  const excerpt = typeof entry?.excerpt === 'string' ? entry.excerpt.trim() : ''
  if (excerpt.length) {
    return excerpt
  }

  const message = typeof entry?.content?.message === 'string' ? entry.content.message.trim() : ''
  if (message.length) {
    return message.slice(0, 180)
  }

  if (typeof entry?.content?.voice_url === 'string' && entry.content.voice_url.trim().length) {
    return 'Spraakbericht'
  }

  if (typeof entry?.mediaUrl === 'string' && entry.mediaUrl.trim().length) {
    return 'Media-bijdrage'
  }

  return ''
}

function submitMessage() {
  emit('submit-message', {
    message: messageForm.message,
    voiceUrl: messageForm.voiceUrl
  })
}

function submitCandle() {
  emit('submit-candle', {
    candleStyle: candleForm.style,
    dedication: candleForm.dedication
  })
}

function submitMedia() {
  emit('submit-media', {
    mediaType: mediaForm.type,
    mediaUrl: mediaForm.url,
    title: mediaForm.title,
    caption: mediaForm.caption
  })
}
</script>

<style scoped>
.viewer-left-panel {
  position: absolute;
  top: 0.85rem;
  bottom: 0.85rem;
  left: 0.85rem;
  z-index: 24;
  width: min(24rem, calc(100% - 4rem));
  border-radius: 16px;
  background: rgba(7, 13, 20, 0.85);
  border: 1px solid rgba(224, 238, 248, 0.2);
  backdrop-filter: blur(7px);
  color: #eff7ff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.viewer-left-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 0.8rem;
  border-bottom: 1px solid rgba(224, 238, 248, 0.16);
}

.viewer-left-panel__header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
}

.viewer-left-panel__close {
  border: 0;
  background: rgba(232, 244, 255, 0.16);
  color: #eff7ff;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  cursor: pointer;
}

.viewer-left-panel__content {
  overflow: auto;
  padding: 0.8rem;
}

.viewer-left-panel__content p {
  margin-top: 0;
}

.viewer-left-panel__element-kicker {
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(220, 237, 254, 0.78);
}

.viewer-left-panel__element-title {
  margin: 0 0 0.4rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.viewer-left-panel__element-description {
  margin-bottom: 0.7rem;
  color: rgba(236, 245, 255, 0.86);
}

.viewer-left-panel__notice {
  color: #fbd0bf;
}

.viewer-left-panel__form-grid {
  display: grid;
  gap: 0.45rem;
}

.viewer-left-panel__label-inline {
  display: block;
  margin: 0.45rem 0 0.2rem;
}

.viewer-left-panel__input,
.viewer-left-panel__select {
  width: 100%;
  box-sizing: border-box;
  min-height: 2.3rem;
  border-radius: 10px;
  border: 1px solid rgba(224, 238, 248, 0.2);
  background: rgba(11, 17, 25, 0.88);
  color: #eff7ff;
  padding: 0 0.65rem;
}

.viewer-left-panel__textarea {
  width: 100%;
  min-height: 6.5rem;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid rgba(224, 238, 248, 0.2);
  background: rgba(11, 17, 25, 0.88);
  color: #eff7ff;
  padding: 0.65rem;
}

.viewer-left-panel__action,
.viewer-left-panel__chip {
  border: 0;
  border-radius: 10px;
  min-height: 2.3rem;
  padding: 0 0.75rem;
  background: linear-gradient(180deg, #a3b18a 0%, #7a8568 100%);
  color: #ffffff;
  cursor: pointer;
}

.viewer-left-panel__action {
  margin-top: 0.65rem;
}

.viewer-left-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.viewer-left-panel__selection {
  margin: 0.6rem 0 0.2rem;
  color: rgba(236, 245, 255, 0.86);
}

.viewer-left-panel__contributions {
  margin-top: 0.9rem;
  border-top: 1px solid rgba(224, 238, 248, 0.16);
  padding-top: 0.75rem;
}

.viewer-left-panel__contributions h4 {
  margin: 0 0 0.55rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
}

.viewer-left-panel__contributions-empty {
  margin: 0;
  color: rgba(226, 240, 252, 0.76);
  font-size: 0.88rem;
}

.viewer-left-panel__contributions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.55rem;
}

.viewer-left-panel__contribution-item {
  border: 1px solid rgba(224, 238, 248, 0.16);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  background: rgba(12, 19, 28, 0.72);
}

.viewer-left-panel__contribution-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
}

.viewer-left-panel__contribution-excerpt {
  margin: 0.2rem 0 0;
  color: rgba(226, 240, 252, 0.8);
  font-size: 0.82rem;
  line-height: 1.35;
}

.viewer-left-panel__submit-error {
  margin-top: 0.8rem;
  color: #f4b9ab;
}

.viewer-left-panel__submit-success {
  margin-top: 0.8rem;
  color: #bfe5be;
}

@media (max-width: 700px) {
  .viewer-left-panel {
    top: 3.9rem;
    bottom: 4.75rem;
    width: calc(100% - 1.7rem);
  }
}
</style>
