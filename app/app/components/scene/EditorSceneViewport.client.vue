<template>
  <div ref="containerRef" class="scene-root" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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
import { createHistoryRuntime } from './viewport/historyRuntime.js'
import { createCameraNavigationRuntime } from './viewport/cameraNavigationRuntime.js'
import { SCENE_KIND, SHAPE_COLOR_BY_TYPE, getDefaultAppearance } from '../../scene/sceneContract.js'
import { buildSceneDocumentFromRuntime } from '../../scene/sceneSerialization.js'
import { hydrateRuntimeSceneState } from '../../scene/sceneHydration.js'

const containerRef = ref(null)
const emit = defineEmits(['scene-document-prepared', 'scene-runtime-changed'])

const props = defineProps({
  activeInteractionMode: {
    type: String,
    default: 'select'
  },
  activeEditTool: {
    type: String,
    default: 'move'
  },
  historyAction: {
    type: Object,
    default: () => ({
      type: null,
      sequence: 0
    })
  },
  blockAction: {
    type: Object,
    default: () => ({
      type: null,
      shapeType: null,
      sequence: 0
    })
  },
  modelAction: {
    type: Object,
    default: () => ({
      type: null,
      downloadUrl: null,
      sequence: 0
    })
  },
  persistenceAction: {
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
    id: 'floor',
    kind: SCENE_KIND.FLOOR,
    assetRef: 'floor-base',
    scaleProfile: 'floor',
    position: [0, -0.07, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    appearance: {
      ...getDefaultAppearance(SCENE_KIND.FLOOR),
      color: '#7a8fa0'
    }
  },
  {
    id: 'placeholder',
    kind: SCENE_KIND.MODEL,
    assetRef: 'placeholder-model',
    scaleProfile: 'model',
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    appearance: {
      ...getDefaultAppearance(SCENE_KIND.MODEL),
      color: '#f5b8ca'
    }
  }
])

const MAX_HISTORY_ENTRIES = 50
const CAMERA_CENTER_TRANSITION_MS = 1000

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
let historyRuntime = null
let cameraNavigationRuntime = null
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
const FLOOR_ROTATION_SNAP_RADIANS = THREE.MathUtils.degToRad(90)

let createdShapeCount = 0
let isApplyingHydration = false
let isSceneReady = false

function handleEditorAction(actionType) {
  if (actionType === 'center') {
    cameraNavigationRuntime?.centerOnSelectionOrDefault()
    return
  }

  historyRuntime?.runHistoryAction(actionType)
}

function createBlockGeometry(shapeType) {
  if (shapeType === 'sphere') {
    return poolGeometry(new THREE.SphereGeometry(1, 24, 18))
  }

  if (shapeType === 'cylinder') {
    return poolGeometry(new THREE.CylinderGeometry(1, 1, 2, 28))
  }

  if (shapeType === 'cone') {
    return poolGeometry(new THREE.ConeGeometry(1, 2, 28))
  }

  return poolGeometry(new THREE.BoxGeometry(2, 2, 2))
}

function setMeshColor(mesh, colorValue) {
  if (!mesh) {
    return
  }

  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : mesh.material
      ? [mesh.material]
      : []

  materials.forEach((material) => {
    if (material?.color?.set && typeof colorValue === 'string') {
      material.color.set(colorValue)
    }
  })
}

function removeSelectableRootById(objectId) {
  const index = selectableRoots.findIndex((root) => root?.userData?.objectId === objectId)

  if (index >= 0) {
    selectableRoots.splice(index, 1)
  }

  meshById.delete(objectId)
}

function removeDynamicObjectsFromScene() {
  const idsToKeep = new Set(['floor', 'placeholder'])
  const dynamicIds = sceneObjects
    .filter((objectState) => !idsToKeep.has(objectState.id))
    .map((objectState) => objectState.id)

  dynamicIds.forEach((objectId) => {
    const mesh = meshById.get(objectId)
    if (mesh) {
      scene?.remove(mesh)
    }
    removeSelectableRootById(objectId)
  })
}

function createShapeMeshFromRuntimeObject(objectState) {
  const shapeType = typeof objectState.assetRef === 'string' ? objectState.assetRef : 'square'
  const geometry = createBlockGeometry(shapeType)
  const material = poolMaterial(
    new THREE.MeshStandardMaterial({
      color: objectState.appearance?.color || SHAPE_COLOR_BY_TYPE[shapeType] || '#b4c9a6',
      roughness: objectState.appearance?.finish?.roughness ?? 0.56,
      metalness: objectState.appearance?.finish?.metalness ?? 0.03
    })
  )
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...objectState.position)
  mesh.rotation.set(...objectState.rotation)
  mesh.scale.set(...objectState.scale)
  return mesh
}

function applyHydratedSceneDocument(sceneDocument) {
  if (!scene || !camera || !renderer) {
    return
  }

  const hydrationResult = hydrateRuntimeSceneState(sceneDocument)

  if (!hydrationResult.isValid) {
    console.warn('Loaded scene document failed validation and was not applied.', hydrationResult)
    return
  }

  isApplyingHydration = true

  try {
    const runtimeObjects = hydrationResult.runtimeObjects
    const nextFloorState = runtimeObjects.find((item) => item.kind === SCENE_KIND.FLOOR) || {
      id: 'floor',
      kind: SCENE_KIND.FLOOR,
      assetRef: 'floor-base',
      scaleProfile: 'floor',
      position: [0, -0.07, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      appearance: getDefaultAppearance(SCENE_KIND.FLOOR)
    }
    const nextModelState = runtimeObjects.find((item) => item.kind === SCENE_KIND.MODEL) || {
      id: 'placeholder',
      kind: SCENE_KIND.MODEL,
      assetRef: 'placeholder-model',
      scaleProfile: 'model',
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      appearance: getDefaultAppearance(SCENE_KIND.MODEL)
    }
    const nextShapeObjects = runtimeObjects
      .filter((item) => item.kind === SCENE_KIND.SHAPE)
      .map((item, index) => {
        if (item.id === 'floor' || item.id === 'placeholder') {
          return {
            ...item,
            id: `shape-${index}-${Date.now()}`
          }
        }

        return item
      })

    removeDynamicObjectsFromScene()

    const floorMesh = meshById.get('floor')
    if (floorMesh) {
      floorMesh.position.set(...nextFloorState.position)
      floorMesh.rotation.set(...nextFloorState.rotation)
      floorMesh.scale.set(...nextFloorState.scale)
      setMeshColor(floorMesh, nextFloorState.appearance?.color)
    }

    const placeholderMesh = meshById.get('placeholder')
    if (placeholderMesh) {
      placeholderMesh.position.set(...nextModelState.position)
      placeholderMesh.rotation.set(...nextModelState.rotation)
      placeholderMesh.scale.set(...nextModelState.scale)
      setMeshColor(placeholderMesh, nextModelState.appearance?.color)
    }

    nextShapeObjects.forEach((objectState) => {
      const mesh = createShapeMeshFromRuntimeObject(objectState)
      scene.add(mesh)
      registerSelectableRoot(THREE, selectableRoots, meshById, objectState.id, mesh)
    })

    sceneObjects.splice(0, sceneObjects.length, {
      ...nextFloorState,
      id: 'floor',
      scaleProfile: 'floor'
    }, {
      ...nextModelState,
      id: 'placeholder',
      scaleProfile: 'model'
    }, ...nextShapeObjects.map((objectState) => ({
      ...objectState,
      scaleProfile: 'shape'
    })))

    if (sceneDocument?.editorSettings?.grid && typeof sceneDocument.editorSettings.grid === 'object') {
      const nextCellSize = Number(sceneDocument.editorSettings.grid.cellSize)
      const nextGroundSize = Number(sceneDocument.editorSettings.grid.groundSize)

      if (Number.isFinite(nextCellSize) && nextCellSize > 0) {
        gridConfig.cellSize = nextCellSize
      }

      if (Number.isFinite(nextGroundSize) && nextGroundSize > 0) {
        gridConfig.groundSize = nextGroundSize
      }
    }

    createdShapeCount = nextShapeObjects.length
    setSelectedObjectId(null)
    historyRuntime?.clearHistory()
    historyRuntime?.captureInitialObjectState()
    syncTransformControlsState()

    if (hydrationResult.warnings.length) {
      console.info('Scene hydration warnings:', hydrationResult.warnings)
    }
  } finally {
    isApplyingHydration = false
  }
}

function addBlockToScene(shapeType) {
  if (!scene) {
    return
  }

  const blockId = `block-${shapeType}-${Date.now()}-${createdShapeCount}`
  createdShapeCount += 1

  const geometry = createBlockGeometry(shapeType)
  const material = poolMaterial(
    new THREE.MeshStandardMaterial({
      color: SHAPE_COLOR_BY_TYPE[shapeType] ?? '#b4c9a6',
      roughness: 0.56,
      metalness: 0.03
    })
  )
  const mesh = new THREE.Mesh(geometry, material)

  const spawnPosition = snapVectorToGrid(THREE, gridConfig, new THREE.Vector3(0, 1, 0))
  mesh.position.copy(spawnPosition)
  mesh.rotation.set(0, 0, 0)
  mesh.scale.set(1, 1, 1)

  scene.add(mesh)
  registerSelectableRoot(THREE, selectableRoots, meshById, blockId, mesh)

  sceneObjects.push({
    id: blockId,
    kind: SCENE_KIND.SHAPE,
    assetRef: shapeType,
    scaleProfile: 'shape',
    position: [spawnPosition.x, spawnPosition.y, spawnPosition.z],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    appearance: {
      ...getDefaultAppearance(SCENE_KIND.SHAPE),
      color: SHAPE_COLOR_BY_TYPE[shapeType] ?? '#b4c9a6'
    }
  })

  setSelectedObjectId(blockId)
  historyRuntime?.clearHistory()
  historyRuntime?.captureInitialObjectState()
}

const gltfLoader = new GLTFLoader()

function addModelToScene(downloadUrl) {
  if (!scene || !downloadUrl) return

  const modelId = `model-${Date.now()}`

  gltfLoader.load(
    downloadUrl,
    (gltf) => {
      const root = gltf.scene

      // Normalise scale so the model fits within a consistent bounding box.
      const box = new THREE.Box3().setFromObject(root)
      const size = new THREE.Vector3()
      box.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim > 0) {
        const targetSize = 2
        root.scale.setScalar(targetSize / maxDim)
      }

      // Re-centre at ground level after scaling.
      box.setFromObject(root)
      const center = new THREE.Vector3()
      box.getCenter(center)
      root.position.x -= center.x
      root.position.z -= center.z
      root.position.y -= box.min.y

      const spawnPosition = snapVectorToGrid(THREE, gridConfig, new THREE.Vector3(0, 0, 0))
      root.position.x += spawnPosition.x
      root.position.z += spawnPosition.z

      scene.add(root)
      registerSelectableRoot(THREE, selectableRoots, meshById, modelId, root)

      sceneObjects.push({
        id: modelId,
        kind: SCENE_KIND.MODEL,
        assetRef: downloadUrl,
        scaleProfile: 'model',
        position: [root.position.x, root.position.y, root.position.z],
        rotation: [0, 0, 0],
        scale: [root.scale.x, root.scale.y, root.scale.z],
        appearance: getDefaultAppearance(SCENE_KIND.MODEL)
      })

      setSelectedObjectId(modelId)
      historyRuntime?.clearHistory()
      historyRuntime?.captureInitialObjectState()
    },
    undefined,
    (err) => {
      console.error(`[EditorSceneViewport] Failed to load model "${downloadUrl}":`, err)
    }
  )
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
  const isSelectionMode = props.activeInteractionMode === 'select'
  const isMoveActive = props.activeEditTool === 'move'
  const isRotateActive = props.activeEditTool === 'rotate'
  const isScaleActive = props.activeEditTool === 'scale'
  const scaleProfile = getScaleProfileForObject(sceneObjects, selectedObjectId.value ?? '')
  const isFloorSelection = scaleProfile === 'floor'

  if (!selectedMesh || !isSelectionMode || (!isMoveActive && !isRotateActive && !isScaleActive)) {
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
    transformControls.showX = true
    transformControls.showY = true
    transformControls.showZ = true
    if (isMoveActive && isFloorSelection) {
      transformControls.showY = false
    } else if (isRotateActive && isFloorSelection) {
      transformControls.showX = false
      transformControls.showY = true
      transformControls.showZ = false
    } else if (isScaleActive && isFloorSelection) {
      transformControls.showY = false
  }
  transformControls.enabled = true
  transformControls.visible = true
  transformControls.setTranslationSnap(isMoveActive ? gridConfig.cellSize : null)
  transformControls.setScaleSnap(null)
    transformControls.setRotationSnap(
      isRotateActive
        ? isFloorSelection
          ? FLOOR_ROTATION_SNAP_RADIANS
          : ROTATION_SNAP_RADIANS
        : null
    )
  if (transformHelper) {
    transformHelper.visible = true
    transformHelper.updateMatrixWorld(true)
  }
}

function prepareSceneDocumentForSave() {
  const result = buildSceneDocumentFromRuntime({
    sceneName: 'Editor Scene',
    sceneObjects,
    gridConfig
  })

  emit('scene-document-prepared', result)
}

function handlePersistenceAction(action) {
  if (!action || typeof action !== 'object') {
    return
  }

  if (action.type === 'prepare-save') {
    prepareSceneDocumentForSave()
    return
  }

  if (action.type === 'hydrate-scene') {
    applyHydratedSceneDocument(action.sceneDocument)
  }
}

watch(
  () => [props.activeInteractionMode, props.activeEditTool],
  () => {
    syncTransformControlsState()
    cameraNavigationRuntime?.handleToolChange()
  }
)

watch(
  () => props.historyAction.sequence,
  () => {
    if (!props.historyAction?.type || interactionState.isTransforming) {
      return
    }

    handleEditorAction(props.historyAction.type)
  }
)

watch(
  () => props.blockAction.sequence,
  () => {
    if (props.blockAction?.type !== 'add-block') {
      return
    }

    if (typeof props.blockAction.shapeType !== 'string' || !props.blockAction.shapeType.length) {
      return
    }

    addBlockToScene(props.blockAction.shapeType)
  }
)

watch(
  () => props.persistenceAction.sequence,
  () => {
    if (!props.persistenceAction?.type) {
      return
    }

    handlePersistenceAction(props.persistenceAction)
  }
)

watch(
  sceneObjects,
  () => {
    if (!isSceneReady || isApplyingHydration) {
      return
    }

    emit('scene-runtime-changed')
  },
  { deep: true }
)

function handlePointerDown(event) {
  if (!renderer || !camera || !scene || interactionState.isTransforming) {
    return
  }

  cameraNavigationRuntime?.cancelTransition()

  if (cameraNavigationRuntime?.handlePointerDown(event)) {
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

  if (cameraNavigationRuntime?.handlePointerUp()) {
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
  cameraNavigationRuntime?.updateCameraTransition()
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

  cameraNavigationRuntime = createCameraNavigationRuntime({
    THREE,
    camera,
    controls,
    renderer,
    meshById,
    getActiveTool: () => props.activeInteractionMode,
    getSelectedObjectId: () => selectedObjectId.value,
    transitionDurationMs: CAMERA_CENTER_TRANSITION_MS
  })
  cameraNavigationRuntime.captureDefaultView()

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

  historyRuntime = createHistoryRuntime({
    sceneObjects,
    meshById,
    applySceneObjectState,
    getActiveTool: () => props.activeEditTool,
    getSelectedObjectId: () => selectedObjectId.value,
    setSelectedObjectId,
    syncTransformControlsState,
    maxHistoryEntries: MAX_HISTORY_ENTRIES
  })
  historyRuntime.captureInitialObjectState()

  transformControls.addEventListener('mouseDown', historyRuntime.beginHistoryCapture)
  transformControls.addEventListener('mouseUp', historyRuntime.commitHistoryCapture)

  cameraNavigationRuntime.syncNavigationMode()

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
  isSceneReady = true

  animate()
})

onBeforeUnmount(() => {
  if (frameId) {
    window.cancelAnimationFrame(frameId)
  }

  if (transformControls && historyRuntime) {
    transformControls.removeEventListener('mouseDown', historyRuntime.beginHistoryCapture)
    transformControls.removeEventListener('mouseUp', historyRuntime.commitHistoryCapture)
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
  historyRuntime = null
  cameraNavigationRuntime = null
  isSceneReady = false
  isApplyingHydration = false
})
</script>

<style scoped>
.scene-root {
  position: absolute;
  inset: 0;
}
</style>
