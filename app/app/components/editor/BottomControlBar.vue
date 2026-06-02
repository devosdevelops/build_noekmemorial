<script setup>
import { ref } from 'vue'
import OverlayButton from '../ui/OverlayButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const props = defineProps({
  activeInteractionMode: {
    type: String,
    default: 'select'
  },
  activeEditTool: {
    type: String,
    default: 'move'
  }
})

const emit = defineEmits(['interaction-mode-change', 'edit-tool-change', 'history-action'])

const isDeleteToastVisible = ref(false)

const groupedControls = [
  [
    { id: 'select', label: 'Selecteren' },
    { id: 'pan', label: 'Pannen' },
    { id: 'center', label: 'Centreren' }
  ],
  [
    { id: 'move', label: 'Verplaatsen' },
    { id: 'rotate', label: 'Roteren' },
    { id: 'scale', label: 'Schalen' }
  ],
  [
    { id: 'delete', label: 'Verwijderen' },
    { id: 'reset', label: 'Resetten' },
    { id: 'undo', label: 'Ongedaan' },
    { id: 'redo', label: 'Opnieuw' }
  ]
]

function isInteractionControl(controlId) {
  return controlId === 'select' || controlId === 'pan'
}

function isEditControl(controlId) {
  return controlId === 'move' || controlId === 'rotate' || controlId === 'scale'
}

function isControlActive(controlId) {
  if (isInteractionControl(controlId)) {
    return controlId === props.activeInteractionMode
  }

  if (isEditControl(controlId)) {
    return controlId === props.activeEditTool
  }

  return false
}

function handleControlClick(controlId) {
  if (isInteractionControl(controlId)) {
    emit('interaction-mode-change', controlId)
    return
  }

  if (isEditControl(controlId)) {
    emit('edit-tool-change', controlId)
    return
  }

  if (controlId === 'delete') {
    isDeleteToastVisible.value = true
    return
  }

  if (controlId === 'undo' || controlId === 'redo' || controlId === 'reset' || controlId === 'center') {
    emit('history-action', controlId)
  }
}

function cancelDelete() {
  isDeleteToastVisible.value = false
}

function confirmDelete() {
  emit('history-action', 'delete')
  isDeleteToastVisible.value = false
}
</script>

<template>
  <OverlayCard class="bottom-toolbar" aria-label="Editorbediening">
    <transition name="delete-toast">
      <div v-if="isDeleteToastVisible" class="delete-toast" role="alertdialog" aria-live="assertive">
        <p class="delete-toast__message">Geselecteerd object verwijderen?</p>
        <div class="delete-toast__actions">
          <button type="button" class="delete-toast__button delete-toast__button--ghost" @click="cancelDelete">
            Annuleren
          </button>
          <button type="button" class="delete-toast__button" @click="confirmDelete">
            Verwijderen
          </button>
        </div>
      </div>
    </transition>

    <template v-for="(group, groupIndex) in groupedControls" :key="`group-${groupIndex}`">
      <OverlayButton
        v-for="control in group"
        :key="control.id"
        :label="control.label"
        :class="{ 'overlay-button--delete': control.id === 'delete' }"
        :is-active="isControlActive(control.id)"
        @click="handleControlClick(control.id)"
      />
      <span
        v-if="groupIndex < groupedControls.length - 1"
        :key="`divider-${groupIndex}`"
        class="toolbar-divider"
        aria-hidden="true"
      />
    </template>
  </OverlayCard>
</template>

<style scoped>
.bottom-toolbar {
  position: absolute;
  left: 50%;
  bottom: 1.5rem;
  display: flex;
  gap: 0.52rem;
  transform: translateX(-50%);
  padding: 0.55rem;
  border-radius: 0.9rem;
}

.toolbar-divider {
  width: 1px;
  align-self: stretch;
  margin: 0 0.14rem;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(118, 135, 102, 0.2), rgba(94, 112, 78, 0.62), rgba(118, 135, 102, 0.2));
}

.overlay-button--delete {
  border-color: rgba(184, 56, 41, 0.42);
  color: #8f2e21;
}

.overlay-button--delete:hover {
  border-color: rgba(173, 49, 34, 0.6);
  color: #7f261c;
}

.delete-toast {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.85rem);
  transform: translateX(-50%);
  min-width: min(26rem, 76vw);
  padding: 0.84rem 0.96rem;
  border-radius: 0.82rem;
  border: 1px solid rgba(137, 47, 31, 0.62);
  background: linear-gradient(180deg, #E54E34 0%, #E54E34 50%, #892F1F 100%);
  box-shadow: 0 14px 28px rgba(103, 26, 16, 0.35), inset 0 -1px 0 rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.delete-toast__message {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.delete-toast__actions {
  margin-top: 0.64rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.delete-toast__button {
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 0.54rem;
  padding: 0.35rem 0.62rem;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.delete-toast__button:hover {
  background: rgba(255, 255, 255, 0.24);
}

.delete-toast__button--ghost {
  background: #111111;
  border-color: #111111;
}

.delete-toast__button--ghost:hover {
  background: #000000;
}

.delete-toast-enter-active,
.delete-toast-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.delete-toast-enter-from,
.delete-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.28rem);
}

@media (max-width: 900px) {
  .bottom-toolbar {
    flex-wrap: wrap;
    width: min(92vw, 34rem);
    justify-content: center;
    transform: translateX(-50%);
  }

  .toolbar-divider {
    display: none;
  }

  .delete-toast {
    min-width: min(92vw, 25rem);
  }
}
</style>
