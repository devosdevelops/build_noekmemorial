<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '#b4c9a6'
  }
})

const emit = defineEmits(['update:modelValue'])

const WHEEL_SIZE = 240
const WHEEL_CENTER = WHEEL_SIZE / 2
const RING_THICKNESS = 30
const RING_GAP = 16
const HANDLE_SIZE = 18
const DISK_DIAMETER = WHEEL_SIZE - (RING_THICKNESS + RING_GAP) * 2
const DISK_RADIUS = DISK_DIAMETER / 2
const HUE_HANDLE_RADIUS = WHEEL_CENTER - RING_THICKNESS / 2
const DISK_HANDLE_MAX_RADIUS = DISK_RADIUS - HANDLE_SIZE / 2 - 2

const wheelRef = ref(null)
const diskRef = ref(null)
const hexInputRef = ref(null)
const hue = ref(95)
const saturation = ref(0.24)
const value = ref(0.79)
const isHexEditing = ref(false)
const draftHex = ref('#b4c9a6')
let activePointer = null

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number))
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function hsvToRgb(hueDegrees, saturationRatio, valueRatio) {
  const normalizedHue = ((hueDegrees % 360) + 360) % 360
  const chroma = valueRatio * saturationRatio
  const huePrime = normalizedHue / 60
  const secondary = chroma * (1 - Math.abs((huePrime % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma
    green = secondary
  } else if (huePrime < 2) {
    red = secondary
    green = chroma
  } else if (huePrime < 3) {
    green = chroma
    blue = secondary
  } else if (huePrime < 4) {
    green = secondary
    blue = chroma
  } else if (huePrime < 5) {
    red = secondary
    blue = chroma
  } else {
    red = chroma
    blue = secondary
  }

  const match = valueRatio - chroma

  return {
    red: (red + match) * 255,
    green: (green + match) * 255,
    blue: (blue + match) * 255
  }
}

function hexToHsv(hexColor) {
  const normalized = typeof hexColor === 'string' ? hexColor.trim().replace('#', '') : ''
  const expanded = normalized.length === 3
    ? normalized.split('').map((channel) => `${channel}${channel}`).join('')
    : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return null
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16) / 255
  const green = Number.parseInt(expanded.slice(2, 4), 16) / 255
  const blue = Number.parseInt(expanded.slice(4, 6), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let nextHue = 0

  if (delta > 0) {
    if (max === red) {
      nextHue = 60 * (((green - blue) / delta) % 6)
    } else if (max === green) {
      nextHue = 60 * (((blue - red) / delta) + 2)
    } else {
      nextHue = 60 * (((red - green) / delta) + 4)
    }
  }

  return {
    hue: ((nextHue % 360) + 360) % 360,
    saturation: max === 0 ? 0 : delta / max,
    value: max
  }
}

function emitColor() {
  const { red, green, blue } = hsvToRgb(hue.value, saturation.value, value.value)
  emit('update:modelValue', rgbToHex(red, green, blue))
}

function syncFromHex(nextHex) {
  const hsv = hexToHsv(nextHex)

  if (!hsv) {
    return
  }

  hue.value = hsv.hue
  saturation.value = hsv.saturation
  value.value = hsv.value
}

function normalizeHexInput(inputValue) {
  const normalized = typeof inputValue === 'string' ? inputValue.trim().replace('#', '') : ''
  const expanded = normalized.length === 3
    ? normalized.split('').map((channel) => `${channel}${channel}`).join('')
    : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return null
  }

  return `#${expanded.toLowerCase()}`
}

watch(
  () => props.modelValue,
  (nextColor) => {
    syncFromHex(nextColor)

    if (!isHexEditing.value) {
      draftHex.value = typeof nextColor === 'string' && nextColor.length ? nextColor : '#b4c9a6'
    }
  },
  { immediate: true }
)

function beginHexEdit() {
  isHexEditing.value = true
  draftHex.value = activeColor.value

  nextTick(() => {
    hexInputRef.value?.focus()
    hexInputRef.value?.select()
  })
}

function cancelHexEdit() {
  isHexEditing.value = false
  draftHex.value = activeColor.value
}

function applyHexEdit() {
  const normalizedHex = normalizeHexInput(draftHex.value)

  if (!normalizedHex) {
    cancelHexEdit()
    return
  }

  isHexEditing.value = false
  draftHex.value = normalizedHex
  emit('update:modelValue', normalizedHex)
}

function handleHexInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    applyHexEdit()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    cancelHexEdit()
  }
}

function getWheelPoint(event) {
  const wheel = wheelRef.value

  if (!wheel) {
    return null
  }

  const bounds = wheel.getBoundingClientRect()
  const centerX = bounds.left + bounds.width / 2
  const centerY = bounds.top + bounds.height / 2

  return {
    x: event.clientX - centerX,
    y: event.clientY - centerY
  }
}

function updateHueFromPointer(event) {
  const point = getWheelPoint(event)

  if (!point) {
    return
  }

  const angle = Math.atan2(point.y, point.x)
  hue.value = ((angle * 180) / Math.PI + 90 + 360) % 360
  emitColor()
}

function updateDiskFromPointer(event) {
  const disk = diskRef.value

  if (!disk) {
    return
  }

  const bounds = disk.getBoundingClientRect()
  const centerX = bounds.left + bounds.width / 2
  const centerY = bounds.top + bounds.height / 2
  const rawX = event.clientX - centerX
  const rawY = event.clientY - centerY
  const rawRadius = Math.hypot(rawX, rawY)
  const maxRadius = bounds.width / 2
  const radiusRatio = rawRadius > maxRadius ? maxRadius / rawRadius : 1
  const x = rawX * radiusRatio
  const y = rawY * radiusRatio

  const normalizedX = x / maxRadius
  const normalizedY = y / maxRadius
  const angle = Math.atan2(normalizedY, normalizedX)
  const edgeScale = Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))) || 1
  const squareX = clamp(normalizedX / edgeScale, -1, 1)
  const squareY = clamp(normalizedY / edgeScale, -1, 1)

  saturation.value = (squareX + 1) / 2
  value.value = 1 - (squareY + 1) / 2
  emitColor()
}

function handlePointerMove(event) {
  if (activePointer === 'wheel') {
    updateHueFromPointer(event)
    return
  }

  if (activePointer === 'disk') {
    updateDiskFromPointer(event)
  }
}

function stopPointerTracking() {
  activePointer = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopPointerTracking)
}

function beginPointerTracking(target) {
  activePointer = target
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopPointerTracking)
}

function handleWheelPointerDown(event) {
  beginPointerTracking('wheel')
  updateHueFromPointer(event)
}

function handleDiskPointerDown(event) {
  beginPointerTracking('disk')
  updateDiskFromPointer(event)
}

onBeforeUnmount(() => {
  stopPointerTracking()
})

const activeColor = computed(() => props.modelValue)
const pureHueColor = computed(() => {
  const { red, green, blue } = hsvToRgb(hue.value, 1, 1)
  return rgbToHex(red, green, blue)
})
const diskStyle = computed(() => ({
  background: `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #000 100%), linear-gradient(90deg, #fff 0%, ${pureHueColor.value} 100%)`
}))
const hueHandleStyle = computed(() => {
  const angleRadians = ((hue.value - 90) * Math.PI) / 180
  const x = WHEEL_CENTER + Math.cos(angleRadians) * HUE_HANDLE_RADIUS
  const y = WHEEL_CENTER + Math.sin(angleRadians) * HUE_HANDLE_RADIUS

  return {
    left: `${x}px`,
    top: `${y}px`
  }
})
const diskHandleStyle = computed(() => {
  const squareX = saturation.value * 2 - 1
  const squareY = (1 - value.value) * 2 - 1

  if (squareX === 0 && squareY === 0) {
    return {
      left: `${WHEEL_CENTER}px`,
      top: `${WHEEL_CENTER}px`
    }
  }

  const angle = Math.atan2(squareY, squareX)
  const squareRadius = Math.hypot(squareX, squareY)
  const edgeScale = Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))) || 1
  const diskRadiusRatio = Math.min(squareRadius * edgeScale, 1)
  const x = WHEEL_CENTER + Math.cos(angle) * diskRadiusRatio * DISK_HANDLE_MAX_RADIUS
  const y = WHEEL_CENTER + Math.sin(angle) * diskRadiusRatio * DISK_HANDLE_MAX_RADIUS

  return {
    left: `${x}px`,
    top: `${y}px`
  }
})
</script>

<template>
  <div class="color-picker">
    <div ref="wheelRef" class="color-wheel" @pointerdown="handleWheelPointerDown">
      <div class="color-wheel__ring" />
      <div
        ref="diskRef"
        class="color-wheel__disk"
        :style="diskStyle"
        @pointerdown.stop="handleDiskPointerDown"
      />
      <span class="color-wheel__handle color-wheel__handle--hue" :style="hueHandleStyle" />
      <span class="color-wheel__handle color-wheel__handle--disk" :style="diskHandleStyle" />
    </div>
    <div class="color-picker__swatch-row">
      <span class="color-picker__swatch" :style="{ backgroundColor: activeColor }" />
      <span
        v-if="!isHexEditing"
        class="color-picker__value color-picker__value--editable"
        role="button"
        tabindex="0"
        @click="beginHexEdit"
        @keydown.enter.prevent="beginHexEdit"
        @keydown.space.prevent="beginHexEdit"
      >
        {{ activeColor }}
      </span>
      <input
        v-else
        ref="hexInputRef"
        v-model="draftHex"
        class="color-picker__value-input"
        type="text"
        inputmode="text"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        @blur="applyHexEdit"
        @keydown="handleHexInputKeydown"
      >
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  display: grid;
  gap: 0.8rem;
}

.color-wheel {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto;
  touch-action: none;
}

.color-wheel__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    hsl(0, 100%, 50%),
    hsl(30, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(90, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(150, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(210, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(270, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(330, 100%, 50%),
    hsl(360, 100%, 50%)
  );
}

.color-wheel__ring::after {
  content: '';
  position: absolute;
  inset: 30px;
  border-radius: 50%;
  background: rgba(226, 236, 223, 0.92);
}

.color-wheel__disk {
  position: absolute;
  inset: 46px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(124, 138, 110, 0.2);
}

.color-wheel__handle {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 6px rgba(28, 38, 22, 0.22);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.color-wheel__handle--hue {
  background: transparent;
}

.color-wheel__handle--disk {
  background: transparent;
}

.color-picker__swatch-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  justify-content: center;
}

.color-picker__swatch {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 0.32rem;
  border: 1px solid rgba(78, 91, 65, 0.2);
}

.color-picker__value {
  color: rgba(68, 80, 56, 0.88);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.color-picker__value--editable {
  cursor: text;
}

.color-picker__value-input {
  width: 6.3rem;
  padding: 0.16rem 0.34rem;
  border: 1px solid rgba(109, 124, 91, 0.35);
  border-radius: 0.4rem;
  background: rgba(245, 249, 238, 0.8);
  color: rgba(68, 80, 56, 0.92);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.color-picker__value-input:focus {
  outline: 2px solid rgba(118, 146, 88, 0.4);
  outline-offset: 1px;
}

</style>