<template>
  <div
    class="publish-modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="publish-modal-title"
    @click.self="handleClose"
  >
    <div class="publish-modal-card">
      <div class="publish-modal-header">
        <h2 id="publish-modal-title">Publiceer Herdenkingsruimte</h2>
        <button
          type="button"
          class="publish-modal-close"
          aria-label="Sluiten"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          ×
        </button>
      </div>

      <p class="publish-modal-copy">
        Kies hoe bezoekers jouw ruimte kunnen bekijken na publicatie.
      </p>

      <div class="publish-modal-options">
        <label class="publish-modal-option">
          <input
            type="radio"
            name="publish-visibility"
            value="public"
            :checked="selectedVisibility === 'public'"
            :disabled="isSubmitting"
            @change="handleVisibilityChange('public')"
          />
          <div>
            <p class="publish-modal-option-title">Publiek</p>
            <p class="publish-modal-option-description">
              Iedereen met de link kan de ruimte bekijken.
            </p>
          </div>
        </label>

        <label class="publish-modal-option">
          <input
            type="radio"
            name="publish-visibility"
            value="private"
            :checked="selectedVisibility === 'private'"
            :disabled="isSubmitting"
            @change="handleVisibilityChange('private')"
          />
          <div>
            <p class="publish-modal-option-title">Afgeschermd</p>
            <p class="publish-modal-option-description">
              Alleen bezoekers met pincode of speciale QR-code krijgen toegang.
            </p>
          </div>
        </label>
      </div>

      <div v-if="selectedVisibility === 'private'" class="publish-modal-pin-field">
        <label for="publish-modal-pin" class="publish-modal-pin-label">Pincode (6 cijfers)</label>
        <div class="publish-modal-pin-row">
          <input
            id="publish-modal-pin"
            :value="selectedAccessPin"
            type="text"
            inputmode="numeric"
            maxlength="6"
            class="publish-modal-pin-input"
            placeholder="Bijv. 123456"
            :disabled="isSubmitting"
            @input="handlePinInput"
          />
          <button
            type="button"
            class="publish-modal-pin-generate"
            :disabled="isSubmitting"
            @click="handleGeneratePin"
          >
            Genereer PIN
          </button>
          <button
            type="button"
            class="publish-modal-pin-copy"
            :disabled="isSubmitting || !/^\d{6}$/.test(selectedAccessPin)"
            aria-label="Kopieer pincode"
            title="Kopieer pincode"
            @click="handleCopyPin"
          >
            <img src="/icons/copy-black.svg" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="publish-modal-error">{{ errorMessage }}</p>

      <div class="publish-modal-actions">
        <button
          type="button"
          class="publish-modal-cancel"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Annuleren
        </button>
        <button
          type="button"
          class="publish-modal-confirm"
          :disabled="isSubmitting || !isValidVisibility"
          @click="handleConfirm"
        >
          {{ isSubmitting ? 'Publiceren...' : 'Publiceren' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedVisibility: {
    type: String,
    default: ''
  },
  selectedAccessPin: {
    type: String,
    default: ''
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'confirm', 'update:selectedVisibility', 'update:selectedAccessPin'])

const isValidVisibility = computed(() => {
  if (props.selectedVisibility === 'public') {
    return true
  }

  if (props.selectedVisibility === 'private') {
    return /^\d{6}$/.test(props.selectedAccessPin)
  }

  return false
})

function normalizeAccessPin(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\D/g, '').slice(0, 6)
}

function generateAccessPin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!isValidVisibility.value) {
    return
  }

  emit('confirm')
}

function handleVisibilityChange(nextVisibility) {
  emit('update:selectedVisibility', nextVisibility)
}

function handlePinInput(event) {
  emit('update:selectedAccessPin', normalizeAccessPin(event?.target?.value || ''))
}

function handleGeneratePin() {
  emit('update:selectedAccessPin', generateAccessPin())
}

async function handleCopyPin() {
  if (!/^\d{6}$/.test(props.selectedAccessPin)) {
    return
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }

  await navigator.clipboard.writeText(props.selectedAccessPin)
}
</script>

<style scoped>
.publish-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2300;
  background: rgba(18, 26, 12, 0.52);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.publish-modal-card {
  width: min(560px, 100%);
  background: #fbfcfa;
  border: 1px solid #d6decc;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(19, 30, 12, 0.24);
  padding: 1rem;
  box-sizing: border-box;
}

.publish-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.publish-modal-header h2 {
  margin: 0;
  font-size: 1.12rem;
  color: #1f2433;
}

.publish-modal-close {
  border: none;
  background: transparent;
  color: #6b7561;
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
}

.publish-modal-copy {
  margin: 0.75rem 0 0;
  color: #465039;
  font-size: 0.88rem;
}

.publish-modal-options {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.7rem;
}

.publish-modal-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem;
  align-items: start;
  border: 1px solid #d5dfca;
  border-radius: 10px;
  padding: 0.72rem 0.75rem;
  background: #f4f8ee;
}

.publish-modal-option input {
  margin-top: 0.24rem;
}

.publish-modal-option-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #293025;
}

.publish-modal-option-description {
  margin: 0.26rem 0 0;
  font-size: 0.8rem;
  color: #55614a;
  line-height: 1.45;
}

.publish-modal-error {
  margin: 0.75rem 0 0;
  color: #9a2f2f;
  font-size: 0.81rem;
  font-weight: 700;
}

.publish-modal-pin-field {
  margin-top: 0.85rem;
}

.publish-modal-pin-label {
  display: block;
  margin-bottom: 0.35rem;
  color: #3c4732;
  font-size: 0.8rem;
  font-weight: 700;
}

.publish-modal-pin-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.45rem;
}

.publish-modal-pin-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ccd8bd;
  border-radius: 9px;
  padding: 0.54rem 0.62rem;
  color: #263122;
  background: #ffffff;
}

.publish-modal-pin-generate {
  border: 1px solid #ccd8bd;
  border-radius: 9px;
  background: #edf2e6;
  color: #425137;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.54rem 0.68rem;
  cursor: pointer;
}

.publish-modal-pin-copy {
  width: 2.2rem;
  border: 1px solid #ccd8bd;
  border-radius: 9px;
  background: #edf2e6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.publish-modal-pin-copy img {
  width: 1rem;
  height: 1rem;
}

.publish-modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}

.publish-modal-cancel,
.publish-modal-confirm {
  border: 1px solid transparent;
  border-radius: 9px;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0.58rem 0.88rem;
  cursor: pointer;
}

.publish-modal-cancel {
  background: #edf2e6;
  border-color: #ccd8bd;
  color: #425137;
}

.publish-modal-confirm {
  background: #334b2a;
  color: #f4f8ed;
}

.publish-modal-cancel:disabled,
.publish-modal-confirm:disabled,
.publish-modal-close:disabled,
.publish-modal-pin-generate:disabled,
.publish-modal-pin-copy:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>