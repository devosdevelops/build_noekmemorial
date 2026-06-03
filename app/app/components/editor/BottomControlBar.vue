<script setup>
import { ref } from 'vue'
import OverlayCard from '../ui/OverlayCard.vue'

const props = defineProps({
  activeInteractionMode: {
    type: String,
    default: 'select'
  },
  activeEditTool: {
    type: String,
    default: 'move'
  },
  hasDeletableSelection: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['interaction-mode-change', 'edit-tool-change', 'history-action'])

const isDeleteToastVisible = ref(false)

const groupedControls = [
  [
    { id: 'select', label: 'Selecteren', icon: 'Select.svg', hasTwoStates: true },
    { id: 'pan', label: 'Pannen', icon: 'Pan.svg', hasTwoStates: true },
    { id: 'center', label: 'Centreren', icon: 'Focus.svg', hasTwoStates: false }
  ],
  [
    { id: 'move', label: 'Verplaatsen', icon: 'Move.svg', hasTwoStates: true },
    { id: 'rotate', label: 'Roteren', icon: 'Rotate.svg', hasTwoStates: true },
    { id: 'scale', label: 'Schalen', icon: 'Resize.svg', hasTwoStates: true }
  ],
  [
    { id: 'delete', label: 'Verwijderen', icon: 'Delete.svg', hasTwoStates: true },
    { id: 'reset', label: 'Resetten', icon: 'Reset.svg', hasTwoStates: false },
    { id: 'undo', label: 'Ongedaan', icon: 'Undo-Redo.svg', hasTwoStates: false },
    { id: 'redo', label: 'Opnieuw', icon: 'Undo-Redo.svg', hasTwoStates: false, flipHorizontal: true }
  ]
]

function getControlIconStyle(control, isActive) {
  const iconPath = `/icons/${control.icon}`
  const showFilledState = isActive

  if (control.hasTwoStates) {
    return {
      backgroundImage: `url('${iconPath}')`,
      backgroundSize: '200% 100%',
      backgroundPosition: showFilledState ? 'left center' : 'right center'
    }
  }

  return {
    backgroundImage: `url('${iconPath}')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center'
  }
}

function isInteractionControl(controlId) {
  return controlId === 'select' || controlId === 'pan'
}

function isEditControl(controlId) {
  return controlId === 'move' || controlId === 'rotate' || controlId === 'scale'
}

function isControlActive(controlId) {
  if (controlId === 'delete') {
    return props.hasDeletableSelection
  }

  if (isInteractionControl(controlId)) {
    return controlId === props.activeInteractionMode
  }

  if (isEditControl(controlId)) {
    return controlId === props.activeEditTool
  }

  return false
}

function handleControlClick(controlId) {
  if (controlId === 'delete' && !props.hasDeletableSelection) {
    return
  }

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
      <button
        v-for="control in group"
        :key="control.id"
        type="button"
        class="toolbar-icon-button"
        :class="{
          'toolbar-icon-button--active': control.id !== 'delete' && isControlActive(control.id),
          'toolbar-icon-button--delete': control.id === 'delete',
          'toolbar-icon-button--disabled': control.id === 'delete' && !hasDeletableSelection
        }"
        :data-tooltip="control.label"
        :aria-label="control.label"
        :aria-pressed="isControlActive(control.id) ? 'true' : 'false'"
        :disabled="control.id === 'delete' && !hasDeletableSelection"
        @click="handleControlClick(control.id)"
      >
        <span
          class="toolbar-icon"
          :class="{ 'toolbar-icon--flip-x': control.flipHorizontal }"
          :style="getControlIconStyle(control, isControlActive(control.id))"
          aria-hidden="true"
        />
      </button>
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
  gap: 0.58rem;
  transform: translateX(-50%);
  padding: 0.64rem;
  border-radius: 0.96rem;
}

.toolbar-divider {
  width: 2px;
  align-self: stretch;
  margin: 0 0.14rem;
  border-radius: 999px;
  background: rgba(94, 112, 78, 0.7);
}

.toolbar-icon-button {
  position: relative;
  display: grid;
  place-items: center;
  border: 1px solid rgba(124, 138, 110, 0.32);
  border-radius: 0.64rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  padding: 0;
  width: 2.68rem;
  height: 2.68rem;
  cursor: pointer;
  transition: all 180ms ease;
}

.toolbar-icon-button:hover {
  border-color: rgba(114, 131, 98, 0.45);
}

.toolbar-icon-button--active {
  border-color: rgba(101, 124, 74, 0.72);
  background: linear-gradient(180deg, #eef5df, #d6e6be);
  box-shadow: 0 0 0 2px rgba(188, 208, 154, 0.55);
}

.toolbar-icon-button--delete {
  border-color: rgba(184, 56, 41, 0.42);
}

.toolbar-icon-button--delete:hover {
  border-color: rgba(173, 49, 34, 0.6);
}

.toolbar-icon-button--disabled {
  opacity: 0.54;
  cursor: not-allowed;
}

.toolbar-icon-button--disabled:hover {
  border-color: rgba(184, 56, 41, 0.42);
}

.toolbar-icon-button--disabled:hover::after,
.toolbar-icon-button--disabled:hover::before {
  opacity: 0;
  visibility: hidden;
}

.toolbar-icon-button:focus-visible {
  outline: 2px solid rgba(90, 116, 60, 0.72);
  outline-offset: 2px;
}

.toolbar-icon {
  width: 2.01rem;
  height: 2.01rem;
  display: block;
  background-repeat: no-repeat;
}

.toolbar-icon--flip-x {
  transform: scaleX(-1);
}

.toolbar-icon-button::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.58rem);
  transform: translateX(-50%);
  min-width: max-content;
  max-width: 12rem;
  padding: 0.44rem 0.56rem;
  border-radius: 0.7rem;
  background: rgba(106, 106, 110, 0.97);
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 130ms ease;
  z-index: 4;
}

.toolbar-icon-button::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.22rem);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 0.34rem solid transparent;
  border-right: 0.34rem solid transparent;
  border-top: 0.38rem solid rgba(106, 106, 110, 0.97);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 130ms ease;
  z-index: 4;
}

.toolbar-icon-button:hover::after,
.toolbar-icon-button:hover::before,
.toolbar-icon-button:focus-visible::after,
.toolbar-icon-button:focus-visible::before {
  opacity: 1;
  visibility: visible;
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
  transition: background-color 150ms ease, transform 120ms ease;
}

.delete-toast__button:hover {
  background: rgba(255, 255, 255, 0.24);
}

.delete-toast__button:active {
  background: rgba(255, 255, 255, 0.34);
  transform: translateY(1px);
}

.delete-toast__button--ghost {
  background: #191919;
  border-color: #232323;
}

.delete-toast__button--ghost:hover {
  background: #242424;
}

.delete-toast__button--ghost:active {
  background: #101010;
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
