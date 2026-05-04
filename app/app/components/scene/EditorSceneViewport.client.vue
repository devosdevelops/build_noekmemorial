<template>
  <div ref="containerRef" class="scene-root" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import {
  applyFloorScaleBehavior,
  applyModelScaleBehavior,
  applyShapeScaleBehavior,
  createRoundedGridTexture,
  createScaleInteractionContext,
  getScaleProfileForObject,
  setCameraStartPosition,
  snapVectorToGrid,
  updateGridTextureRepeat
} from './viewport/sceneMath.js'
import {
  applySceneObjectState,
  getSelectableRoot,
  registerSelectableRoot,
  resnapAllObjects,
  updateSceneObjectPosition,
  updateSceneObjectRotation,
  updateSceneObjectScale
} from './viewport/sceneObjectState.js'
import { createSelectionHighlightManager } from './viewport/selectionHighlight.js'
import { createSceneBootstrap } from './viewport/sceneBootstrap.js'
import { createTransformRuntime } from './viewport/transformRuntime.js'

const containerRef = ref(null)

const props = defineProps({
  activeTool: {
    type: String,
    default: 'select'
  },
  historyAction: {
    type: Object,
    default: () => ({
      type: null,
      sequence: 0
    })
  }
})

const gridConfig = reactive({
  groundSize: 160,
  cellSize: 1,
  origin: [0, 0, 0]
})

const sceneObjects = reactive([
  {
    id: 'placeholder',
    scaleProfile: 'model',
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  }
])

const MAX_HISTORY_ENTRIES = 50
const historyState = {
  undoStack: [],
  redoStack: [],
  activeSnapshot: null
}

const selectedObjectId = ref(null)

let renderer = null
let scene = null
let camera = null
let controls = null
let transformControls = null
let transformHelper = null
let composer = null
let outlinePass = null
let gizmoScene = null
let gizmoRenderPass = null
let outputPass = null
let resizeObserver = null
let frameId = 0
let gridTexture = null
let gridPlane = null
const interactionState = {
  isTransforming: false,
  isUsingTransformGizmo: false,
  activeScaleContext: null
}

const selectableRoots = []
const meshById = new Map()
const raycaster = new THREE.Raycaster()
const pointerNdc = new THREE.Vector2()
const highlightManager = createSelectionHighlightManager(THREE)

let pointerIsDown = false
let pointerMoved = false
let pointerDownClientX = 0
let pointerDownClientY = 0

const CLICK_MOVE_THRESHOLD_PX = 6

const MIN_SCALE_CELLS = 1
const ROTATION_SNAP_RADIANS = THREE.MathUtils.degToRad(15)

function cloneSceneObject(objectState) {
  return {
    id: objectState.id,
    scaleProfile: objectState.scaleProfile,
    position: [...objectState.position],
    rotation: [...objectState.rotation],
    scale: [...objectState.scale]
  }
}

function createSceneSnapshot() {
  return sceneObjects.map((objectState) => cloneSceneObject(objectState))
}

function areSnapshotsEqual(firstSnapshot, secondSnapshot) {
  return JSON.stringify(firstSnapshot) === JSON.stringify(secondSnapshot)
}

function trimHistoryStack(stack) {
  if (stack.length <= MAX_HISTORY_ENTRIES) {
    return
  }

  stack.splice(0, stack.length - MAX_HISTORY_ENTRIES)
}

function applySceneSnapshot(snapshot) {
  const clonedSnapshot = snapshot.map((objectState) => cloneSceneObject(objectState))
  sceneObjects.splice(0, sceneObjects.length, ...clonedSnapshot)

  sceneObjects.forEach((objectState) => {
    applySceneObjectState(meshById, objectState)
  })

  if (selectedObjectId.value && !sceneObjects.some((objectState) => objectState.id === selectedObjectId.value)) {
    setSelectedObjectId(null)
    return
  }

  syncTransformControlsState()
}

function beginHistoryCapture() {
  historyState.activeSnapshot = createSceneSnapshot()
}

function commitHistoryCapture() {
  if (!historyState.activeSnapshot) {
    return
  }

  const beforeSnapshot = historyState.activeSnapshot
  historyState.activeSnapshot = null

  const afterSnapshot = createSceneSnapshot()

  if (areSnapshotsEqual(beforeSnapshot, afterSnapshot)) {
    return
  }

  historyState.undoStack.push(beforeSnapshot)
  trimHistoryStack(historyState.undoStack)
  historyState.redoStack.length = 0
}

function runHistoryAction(actionType) {
  if (actionType === 'undo') {
    const previousSnapshot = historyState.undoStack.pop()

    if (!previousSnapshot) {
      return
    }

    historyState.redoStack.push(createSceneSnapshot())
    trimHistoryStack(historyState.redoStack)
    applySceneSnapshot(previousSnapshot)
    return
  }

  if (actionType === 'redo') {
    const nextSnapshot = historyState.redoStack.pop()

    if (!nextSnapshot) {
      return
    }

    historyState.undoStack.push(createSceneSnapshot())
    trimHistoryStack(historyState.undoStack)
    applySceneSnapshot(nextSnapshot)
  }
}

const materialPool = []
const geometryPool = []
const texturePool = []

function poolMaterial(material) {
  materialPool.push(material)
  return material
}

function poolGeometry(geometry) {
  geometryPool.push(geometry)
  return geometry
}

function poolTexture(texture) {
  texturePool.push(texture)
  return texture
}

function setSelectedObjectId(objectId) {
  selectedObjectId.value = objectId

  const selectedMesh = objectId ? meshById.get(objectId) ?? null : null

  if (outlinePass) {
    outlinePass.selectedObjects = selectedMesh ? [selectedMesh] : []
  }

  highlightManager.applyEmissiveHighlight(selectedMesh)

  syncTransformControlsState()
}

function syncTransformControlsState() {
  if (!transformControls) {
    return
  }

  const selectedMesh = selectedObjectId.value ? meshById.get(selectedObjectId.value) ?? null : null
  const isMoveActive = props.activeTool === 'move'
  const isRotateActive = props.activeTool === 'rotate'
  const isScaleActive = props.activeTool === 'scale'

  if (!selectedMesh || (!isMoveActive && !isRotateActive && !isScaleActive)) {
    transformControls.detach()
    transformControls.enabled = false
    transformControls.visible = false
    interactionState.activeScaleContext = null
    if (transformHelper) {
      transformHelper.visible = false
    }
    return
  }

  transformControls.attach(selectedMesh)
  if (isMoveActive) {
    transformControls.setMode('translate')
  } else if (isRotateActive) {
    transformControls.setMode('rotate')
  } else {
    transformControls.setMode('scale')
  }
  transformControls.setSpace('world')
  if (isScaleActive) {
    const scaleProfile = getScaleProfileForObject(sceneObjects, selectedObjectId.value ?? '')
    transformControls.showY = scaleProfile !== 'floor'
  } else {
    transformControls.showY = true
  }
  transformControls.enabled = true
  transformControls.visible = true
  transformControls.setTranslationSnap(isMoveActive ? gridConfig.cellSize : null)
  transformControls.setScaleSnap(null)
  transformControls.setRotationSnap(isRotateActive ? ROTATION_SNAP_RADIANS : null)
  if (transformHelper) {
    transformHelper.visible = true
    transformHelper.updateMatrixWorld(true)
  }
}

watch(
  () => props.activeTool,
  () => {
    syncTransformControlsState()
  }
)

watch(
  () => props.historyAction.sequence,
  () => {
    if (!props.historyAction?.type || interactionState.isTransforming) {
      return
    }

    runHistoryAction(props.historyAction.type)
  }
)

function handlePointerDown(event) {
  if (!renderer || !camera || !scene || interactionState.isTransforming) {
    return
  }

  if (event.button !== 0) {
    return
  }

  if (interactionState.isUsingTransformGizmo || transformControls?.dragging) {
    return
  }

  pointerIsDown = true
  pointerMoved = false
  pointerDownClientX = event.clientX
  pointerDownClientY = event.clientY
}

function handlePointerMove(event) {
  if (!pointerIsDown) {
    return
  }

  const deltaX = event.clientX - pointerDownClientX
  const deltaY = event.clientY - pointerDownClientY
  const distanceSq = deltaX * deltaX + deltaY * deltaY

  if (distanceSq > CLICK_MOVE_THRESHOLD_PX * CLICK_MOVE_THRESHOLD_PX) {
    pointerMoved = true
  }
}

function handlePointerUp(event) {
  if (!renderer || !camera || !scene) {
    return
  }

  if (!pointerIsDown) {
    return
  }

  pointerIsDown = false

  if (pointerMoved || interactionState.isTransforming) {
    return
  }

  if (interactionState.isUsingTransformGizmo || transformControls?.dragging) {
    interactionState.isUsingTransformGizmo = false
    return
  }

  const rect = renderer.domElement.getBoundingClientRect()
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointerNdc, camera)
  const hits = raycaster.intersectObjects(selectableRoots, true)

  if (!hits.length) {
    setSelectedObjectId(null)
    return
  }

  const selectedRoot = getSelectableRoot(hits[0].object)
  const objectId = selectedRoot?.userData?.objectId

  if (typeof objectId === 'string') {
    setSelectedObjectId(objectId)
  }
}

function resizeRenderer() {
  if (!renderer || !camera || !containerRef.value) {
    return
  }

  const { clientWidth, clientHeight } = containerRef.value

  if (clientWidth === 0 || clientHeight === 0) {
    return
  }

  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()

  renderer.setSize(clientWidth, clientHeight)

  composer?.setSize(clientWidth, clientHeight)
  outlinePass?.setSize(clientWidth, clientHeight)
}

function animate() {
  if (!renderer || !scene || !camera || !controls) {
    return
  }

  frameId = window.requestAnimationFrame(animate)
  controls.update()
  if (composer) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }
}

onMounted(() => {
  const container = containerRef.value

  if (!container) {
    return
  }

  const sceneBootstrap = createSceneBootstrap({
    THREE,
    OrbitControls,
    EffectComposer,
    RenderPass,
    OutlinePass,
    OutputPass,
    container,
    gridConfig,
    poolMaterial,
    poolGeometry,
    poolTexture,
    setCameraStartPosition,
    createRoundedGridTexture,
    registerSelectableRoot,
    resnapAllObjects,
    selectableRoots,
    meshById,
    sceneObjects
  })

  scene = sceneBootstrap.scene
  camera = sceneBootstrap.camera
  renderer = sceneBootstrap.renderer
  controls = sceneBootstrap.controls
  composer = sceneBootstrap.composer
  outlinePass = sceneBootstrap.outlinePass
  gizmoScene = sceneBootstrap.gizmoScene
  gizmoRenderPass = sceneBootstrap.gizmoRenderPass
  outputPass = sceneBootstrap.outputPass
  gridTexture = sceneBootstrap.gridTexture
  gridPlane = sceneBootstrap.gridPlane

  const transformRuntime = createTransformRuntime({
    THREE,
    TransformControls,
    camera,
    renderer,
    controls,
    gizmoScene,
    gridConfig,
    sceneObjects,
    interactionState,
    minScaleCells: MIN_SCALE_CELLS,
    createScaleInteractionContext,
    applyFloorScaleBehavior,
    applyShapeScaleBehavior,
    applyModelScaleBehavior,
    snapVectorToGrid,
    updateSceneObjectPosition,
    updateSceneObjectScale,
    updateSceneObjectRotation
  })

  transformControls = transformRuntime.transformControls
  transformHelper = transformRuntime.transformHelper
  transformControls.addEventListener('mouseDown', beginHistoryCapture)
  transformControls.addEventListener('mouseUp', commitHistoryCapture)

  resizeRenderer()
  resizeObserver = new ResizeObserver(resizeRenderer)
  resizeObserver.observe(container)

  renderer.domElement.addEventListener('pointerdown', handlePointerDown)
  renderer.domElement.addEventListener('pointermove', handlePointerMove)
  renderer.domElement.addEventListener('pointerup', handlePointerUp)

  watch(
    () => gridConfig.cellSize,
    (cellSize) => {
      if (cellSize <= 0) {
        return
      }

      updateGridTextureRepeat(gridTexture, gridConfig)
      if (transformControls?.getMode() === 'translate') {
        transformControls.setTranslationSnap(cellSize)
      }
      resnapAllObjects(THREE, sceneObjects, gridConfig, meshById)
    }
  )

  syncTransformControlsState()

  animate()
})

onBeforeUnmount(() => {
  if (frameId) {
    window.cancelAnimationFrame(frameId)
  }

  highlightManager.dispose()

  resizeObserver?.disconnect()
  controls?.dispose()
  transformControls?.dispose()

  texturePool.forEach((texture) => texture.dispose())
  materialPool.forEach((material) => material.dispose())
  geometryPool.forEach((geometry) => geometry.dispose())

  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
    renderer.domElement.removeEventListener('pointermove', handlePointerMove)
    renderer.domElement.removeEventListener('pointerup', handlePointerUp)
    renderer.dispose()

    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
  }

  scene = null
  camera = null
  controls = null
  transformControls = null
  transformHelper = null
  composer = null
  outlinePass = null
  gizmoScene = null
  gizmoRenderPass = null
  outputPass = null
  renderer = null
  resizeObserver = null
  gridTexture = null
  gridPlane = null
})
</script>

<style scoped>
.scene-root {
  position: absolute;
  inset: 0;
}
</style>
