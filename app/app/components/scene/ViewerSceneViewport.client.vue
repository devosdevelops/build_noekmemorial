<template>
  <div ref="containerRef" class="viewer-viewport" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  activeMode: {
    type: String,
    default: 'look-around'
  }
})

const emit = defineEmits(['element-selected'])

const containerRef = ref(null)

let renderer = null
let scene = null
let camera = null
let controls = null
let resizeObserver = null
let frameId = 0

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const selectableMeshes = []
const meshMetaById = new Map()
let activeSelectionMesh = null

let pointerIsDown = false
let pointerMoved = false
let pointerDownX = 0
let pointerDownY = 0
let flyPointerActive = false
let lastPointerClientX = 0
let lastPointerClientY = 0

const keyState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  fast: false
}

const flyState = {
  yaw: 0,
  pitch: 0,
  movementSpeed: 8,
  fastMultiplier: 1.9,
  verticalLookSensitivity: 0.0026,
  horizontalLookSensitivity: 0.0026,
  moveVector: new THREE.Vector3(),
  forwardVector: new THREE.Vector3(),
  rightVector: new THREE.Vector3()
}

const CLICK_MOVE_THRESHOLD = 6

function applyModeSettings() {
  if (!controls || !camera) {
    return
  }

  const isLookAround = props.activeMode === 'look-around' || props.activeMode === 'vr'

  controls.enabled = isLookAround
  controls.enablePan = false
  controls.enableZoom = isLookAround
  controls.minDistance = 7
  controls.maxDistance = 38
  controls.minPolarAngle = THREE.MathUtils.degToRad(18)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(86)

  if (!isLookAround) {
    controls.update()
    syncFlyAnglesFromCamera()
  }
}

function syncFlyAnglesFromCamera() {
  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)
  flyState.yaw = Math.atan2(direction.x, direction.z)
  flyState.pitch = Math.asin(THREE.MathUtils.clamp(direction.y, -0.95, 0.95))
}

function applyFlyCameraRotation() {
  camera.rotation.order = 'YXZ'
  camera.rotation.y = flyState.yaw
  camera.rotation.x = flyState.pitch
}

function createFloor() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({
      color: '#30445c',
      roughness: 0.95,
      metalness: 0.02
    })
  )

  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.02
  scene.add(floor)

  const grid = new THREE.GridHelper(120, 120, '#90a3b7', '#4b6176')
  grid.position.y = 0
  grid.material.opacity = 0.28
  grid.material.transparent = true
  scene.add(grid)
}

function createMemorialObjects() {
  const entries = [
    {
      id: 'memory-tree',
      title: 'Memory Tree',
      description: 'Tap to leave a memory near the tree.',
      geometry: new THREE.CylinderGeometry(0.7, 1.1, 4.6, 22),
      material: new THREE.MeshStandardMaterial({ color: '#7b5f43', roughness: 0.8 }),
      position: [-5.5, 2.3, -3]
    },
    {
      id: 'memory-stone',
      title: 'Memory Stone',
      description: 'A quiet place for short dedications.',
      geometry: new THREE.DodecahedronGeometry(1.4, 0),
      material: new THREE.MeshStandardMaterial({ color: '#8f9aa7', roughness: 0.7 }),
      position: [3, 1.5, -2]
    },
    {
      id: 'candle-circle',
      title: 'Candle Circle',
      description: 'Light a candle in this circle.',
      geometry: new THREE.TorusGeometry(2, 0.35, 16, 42),
      material: new THREE.MeshStandardMaterial({ color: '#d0b687', roughness: 0.45, metalness: 0.15 }),
      position: [0, 1, 6]
    },
    {
      id: 'message-wall',
      title: 'Message Wall',
      description: 'Open to read and leave messages.',
      geometry: new THREE.BoxGeometry(6.5, 3.3, 0.45),
      material: new THREE.MeshStandardMaterial({ color: '#5e768d', roughness: 0.55 }),
      position: [8, 1.7, 3]
    }
  ]

  entries.forEach((entry) => {
    const mesh = new THREE.Mesh(entry.geometry, entry.material)
    mesh.position.set(...entry.position)
    mesh.userData.selectableId = entry.id
    selectableMeshes.push(mesh)
    meshMetaById.set(entry.id, {
      id: entry.id,
      title: entry.title,
      description: entry.description
    })
    scene.add(mesh)
  })
}

function setupRendererAndScene() {
  const container = containerRef.value
  if (!container) {
    return
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a1018')
  scene.fog = new THREE.Fog('#0a1018', 28, 120)

  camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220)
  camera.position.set(0, 9, 18)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  controls.target.set(0, 1.8, 0)

  const ambient = new THREE.AmbientLight('#fffaf0', 0.5)
  const hemi = new THREE.HemisphereLight('#cbe4ff', '#456078', 0.6)
  const sun = new THREE.DirectionalLight('#fff7de', 0.75)
  sun.position.set(12, 18, 8)

  scene.add(ambient)
  scene.add(hemi)
  scene.add(sun)

  createFloor()
  createMemorialObjects()

  resizeObserver = new ResizeObserver(() => {
    syncSize()
  })
  resizeObserver.observe(container)

  syncSize()
  applyModeSettings()
  syncFlyAnglesFromCamera()
}

function syncSize() {
  if (!containerRef.value || !renderer || !camera) {
    return
  }

  const width = containerRef.value.clientWidth || 1
  const height = containerRef.value.clientHeight || 1

  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function onPointerDown(event) {
  pointerIsDown = true
  pointerMoved = false
  pointerDownX = event.clientX
  pointerDownY = event.clientY

  if (props.activeMode === 'flythrough') {
    flyPointerActive = true
    lastPointerClientX = event.clientX
    lastPointerClientY = event.clientY
  }
}

function onPointerMove(event) {
  if (!pointerIsDown) {
    return
  }

  const deltaX = event.clientX - pointerDownX
  const deltaY = event.clientY - pointerDownY

  if (Math.abs(deltaX) > CLICK_MOVE_THRESHOLD || Math.abs(deltaY) > CLICK_MOVE_THRESHOLD) {
    pointerMoved = true
  }

  if (props.activeMode !== 'flythrough' || !flyPointerActive) {
    return
  }

  const moveX = event.clientX - lastPointerClientX
  const moveY = event.clientY - lastPointerClientY

  flyState.yaw -= moveX * flyState.horizontalLookSensitivity
  flyState.pitch -= moveY * flyState.verticalLookSensitivity
  flyState.pitch = THREE.MathUtils.clamp(flyState.pitch, -1.3, 1.3)

  lastPointerClientX = event.clientX
  lastPointerClientY = event.clientY

  applyFlyCameraRotation()
}

function emitSelectionFromPointer(event) {
  if (!renderer || !camera || !containerRef.value) {
    return
  }

  const rect = containerRef.value.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(selectableMeshes, false)

  if (!intersects.length) {
    clearSelectionHighlight()
    emit('element-selected', null)
    return
  }

  const hit = intersects[0]
  const selectableId = hit.object?.userData?.selectableId

  if (!selectableId || !meshMetaById.has(selectableId)) {
    clearSelectionHighlight()
    emit('element-selected', null)
    return
  }

  applySelectionHighlight(hit.object)

  const metadata = meshMetaById.get(selectableId)

  emit('element-selected', {
    ...metadata,
    worldPosition: [hit.point.x, hit.point.y, hit.point.z]
  })
}

function clearSelectionHighlight() {
  if (!activeSelectionMesh) {
    return
  }

  const material = activeSelectionMesh.material
  if (material && material.emissive) {
    material.emissive.setHex(0x000000)
    material.emissiveIntensity = 0
  }

  activeSelectionMesh = null
}

function applySelectionHighlight(mesh) {
  if (activeSelectionMesh === mesh) {
    return
  }

  clearSelectionHighlight()

  const material = mesh?.material
  if (material && material.emissive) {
    material.emissive.set('#ffd88c')
    material.emissiveIntensity = 0.45
  }

  activeSelectionMesh = mesh
}

function onPointerUp(event) {
  if (!pointerIsDown) {
    return
  }

  if (!pointerMoved) {
    emitSelectionFromPointer(event)
  }

  pointerIsDown = false
  flyPointerActive = false
}

function onTouchStart(event) {
  if (!event.touches?.length) {
    return
  }

  const touch = event.touches[0]
  pointerIsDown = true
  pointerMoved = false
  pointerDownX = touch.clientX
  pointerDownY = touch.clientY

  if (props.activeMode === 'flythrough') {
    flyPointerActive = true
    lastPointerClientX = touch.clientX
    lastPointerClientY = touch.clientY
  }
}

function onTouchMove(event) {
  if (!event.touches?.length) {
    return
  }

  const touch = event.touches[0]

  if (Math.abs(touch.clientX - pointerDownX) > CLICK_MOVE_THRESHOLD || Math.abs(touch.clientY - pointerDownY) > CLICK_MOVE_THRESHOLD) {
    pointerMoved = true
  }

  if (props.activeMode !== 'flythrough' || !flyPointerActive) {
    return
  }

  const moveX = touch.clientX - lastPointerClientX
  const moveY = touch.clientY - lastPointerClientY

  flyState.yaw -= moveX * flyState.horizontalLookSensitivity
  flyState.pitch -= moveY * flyState.verticalLookSensitivity
  flyState.pitch = THREE.MathUtils.clamp(flyState.pitch, -1.3, 1.3)

  lastPointerClientX = touch.clientX
  lastPointerClientY = touch.clientY

  applyFlyCameraRotation()
}

function onTouchEnd(event) {
  if (!pointerIsDown) {
    return
  }

  const changedTouch = event.changedTouches?.[0]

  if (!pointerMoved && changedTouch) {
    emitSelectionFromPointer(changedTouch)
  }

  pointerIsDown = false
  flyPointerActive = false
}

function onKeyDown(event) {
  if (props.activeMode !== 'flythrough') {
    return
  }

  if (event.code === 'KeyW') keyState.forward = true
  if (event.code === 'KeyS') keyState.backward = true
  if (event.code === 'KeyA') keyState.left = true
  if (event.code === 'KeyD') keyState.right = true
  if (event.code === 'Space') keyState.up = true
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keyState.down = true
  if (event.code === 'AltLeft' || event.code === 'AltRight') keyState.fast = true
}

function onKeyUp(event) {
  if (event.code === 'KeyW') keyState.forward = false
  if (event.code === 'KeyS') keyState.backward = false
  if (event.code === 'KeyA') keyState.left = false
  if (event.code === 'KeyD') keyState.right = false
  if (event.code === 'Space') keyState.up = false
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keyState.down = false
  if (event.code === 'AltLeft' || event.code === 'AltRight') keyState.fast = false
}

function updateFlythrough(deltaSeconds) {
  if (props.activeMode !== 'flythrough') {
    return
  }

  flyState.moveVector.set(0, 0, 0)

  if (keyState.forward) flyState.moveVector.z -= 1
  if (keyState.backward) flyState.moveVector.z += 1
  if (keyState.left) flyState.moveVector.x -= 1
  if (keyState.right) flyState.moveVector.x += 1
  if (keyState.up) flyState.moveVector.y += 1
  if (keyState.down) flyState.moveVector.y -= 1

  if (flyState.moveVector.lengthSq() === 0) {
    return
  }

  flyState.moveVector.normalize()

  camera.getWorldDirection(flyState.forwardVector)
  flyState.forwardVector.y = 0
  if (flyState.forwardVector.lengthSq() === 0) {
    flyState.forwardVector.set(0, 0, -1)
  }
  flyState.forwardVector.normalize()

  flyState.rightVector.crossVectors(flyState.forwardVector, new THREE.Vector3(0, 1, 0)).normalize()

  const speed = flyState.movementSpeed * (keyState.fast ? flyState.fastMultiplier : 1)
  const distance = deltaSeconds * speed

  camera.position.addScaledVector(flyState.forwardVector, -flyState.moveVector.z * distance)
  camera.position.addScaledVector(flyState.rightVector, flyState.moveVector.x * distance)
  camera.position.y += flyState.moveVector.y * distance
  camera.position.y = Math.max(1.2, Math.min(20, camera.position.y))
}

let lastFrameTime = 0

function animate(time) {
  const safeTime = Number.isFinite(time) ? time : performance.now()
  if (!lastFrameTime) {
    lastFrameTime = safeTime
  }

  const deltaSeconds = Math.min((safeTime - lastFrameTime) / 1000, 0.1)
  lastFrameTime = safeTime

  if (props.activeMode === 'look-around' || props.activeMode === 'vr') {
    controls?.update()
  } else {
    updateFlythrough(deltaSeconds)
  }

  renderer?.render(scene, camera)
  frameId = requestAnimationFrame(animate)
}

function bindDomListeners() {
  const domElement = renderer?.domElement

  if (!domElement) {
    return
  }

  domElement.addEventListener('pointerdown', onPointerDown)
  domElement.addEventListener('pointermove', onPointerMove)
  domElement.addEventListener('pointerup', onPointerUp)
  domElement.addEventListener('pointerleave', onPointerUp)

  domElement.addEventListener('touchstart', onTouchStart, { passive: true })
  domElement.addEventListener('touchmove', onTouchMove, { passive: true })
  domElement.addEventListener('touchend', onTouchEnd)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
}

function unbindDomListeners() {
  const domElement = renderer?.domElement

  if (domElement) {
    domElement.removeEventListener('pointerdown', onPointerDown)
    domElement.removeEventListener('pointermove', onPointerMove)
    domElement.removeEventListener('pointerup', onPointerUp)
    domElement.removeEventListener('pointerleave', onPointerUp)

    domElement.removeEventListener('touchstart', onTouchStart)
    domElement.removeEventListener('touchmove', onTouchMove)
    domElement.removeEventListener('touchend', onTouchEnd)
  }

  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
}

onMounted(() => {
  setupRendererAndScene()
  bindDomListeners()
  frameId = requestAnimationFrame(animate)
})

watch(
  () => props.activeMode,
  () => {
    applyModeSettings()
  }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  unbindDomListeners()

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  controls?.dispose()
  renderer?.dispose()

  meshMetaById.clear()
  selectableMeshes.length = 0
  activeSelectionMesh = null

  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.viewer-viewport {
  position: absolute;
  inset: 0;
  touch-action: none;
}
</style>
