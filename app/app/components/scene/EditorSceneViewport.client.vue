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
  getSelectableRoot,
  registerSelectableRoot,
  resnapAllObjects,
  updateSceneObjectPosition,
  updateSceneObjectRotation,
  updateSceneObjectScale
} from './viewport/sceneObjectState.js'
import { createSelectionHighlightManager } from './viewport/selectionHighlight.js'

const containerRef = ref(null)

const props = defineProps({
  activeTool: {
    type: String,
    default: 'select'
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
let isTransforming = false
let isUsingTransformGizmo = false

let activeScaleContext = null

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
    activeScaleContext = null
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

function handlePointerDown(event) {
  if (!renderer || !camera || !scene || isTransforming) {
    return
  }

  if (event.button !== 0) {
    return
  }

  if (isUsingTransformGizmo || transformControls?.dragging) {
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

  if (pointerMoved || isTransforming) {
    return
  }

  if (isUsingTransformGizmo || transformControls?.dragging) {
    isUsingTransformGizmo = false
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

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#e9ede5')
  scene.fog = new THREE.Fog('#e9ede5', 70, 180)

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 240)
  setCameraStartPosition(camera, 28, 30, 20, THREE)
  camera.lookAt(0, 0.8, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 0.8, 0)
  controls.minDistance = 12
  controls.maxDistance = 60
  controls.minPolarAngle = THREE.MathUtils.degToRad(18)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(82)

  const hemiLight = new THREE.HemisphereLight('#f7faef', '#b9c7b2', 0.82)
  scene.add(hemiLight)

  const sunLight = new THREE.DirectionalLight('#ffffff', 0.84)
  sunLight.position.set(20, 38, 14)
  sunLight.castShadow = false
  scene.add(sunLight)

  gridTexture = poolTexture(createRoundedGridTexture(THREE, gridConfig.groundSize, gridConfig.cellSize))

  if (renderer.capabilities) {
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  }

  gridPlane = new THREE.Mesh(
    poolGeometry(new THREE.PlaneGeometry(gridConfig.groundSize, gridConfig.groundSize)),
    poolMaterial(
      new THREE.MeshBasicMaterial({
        map: gridTexture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
      })
    )
  )
  gridPlane.rotation.x = -Math.PI / 2
  gridPlane.position.y = 0
  scene.add(gridPlane)

  const plinth = new THREE.Mesh(
    poolGeometry(new THREE.BoxGeometry(10, 0.8, 10)),
    poolMaterial(
      new THREE.MeshStandardMaterial({
        color: '#7a8fa0',
        roughness: 0.86,
        metalness: 0.04
      })
    )
  )
  plinth.position.set(0, 0.4, 0)
  scene.add(plinth)

  const placeholder = new THREE.Mesh(
    poolGeometry(new THREE.BoxGeometry(2, 2, 2)),
    poolMaterial(
      new THREE.MeshStandardMaterial({
        color: '#f5b8ca',
        roughness: 0.53,
        metalness: 0.02
      })
    )
  )
  registerSelectableRoot(THREE, selectableRoots, meshById, 'placeholder', placeholder)
  resnapAllObjects(THREE, sceneObjects, gridConfig, meshById)
  scene.add(placeholder)

  composer = new EffectComposer(renderer)
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.addPass(new RenderPass(scene, camera))

  outlinePass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera)
  outlinePass.edgeStrength = 4.1
  outlinePass.edgeGlow = 0.6
  outlinePass.edgeThickness = 1.8
  outlinePass.visibleEdgeColor.set('#f2d68c')
  outlinePass.hiddenEdgeColor.set('#e6c978')
  composer.addPass(outlinePass)

  gizmoScene = new THREE.Scene()
  gizmoRenderPass = new RenderPass(gizmoScene, camera)
  gizmoRenderPass.clear = false
  gizmoRenderPass.clearDepth = true
  composer.addPass(gizmoRenderPass)

  outputPass = new OutputPass()
  composer.addPass(outputPass)

  transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.setMode('translate')
  transformControls.setTranslationSnap(gridConfig.cellSize)
  transformControls.setScaleSnap(null)
  transformControls.setRotationSnap(null)
  transformControls.showY = true
  transformControls.showX = true
  transformControls.showZ = true
  transformControls.showXY = false
  transformControls.showYZ = false
  transformControls.showXZ = false
  transformControls.size = 1.2
  transformControls.visible = false
  transformHelper = transformControls.getHelper()
  transformHelper.visible = false
  transformHelper.renderOrder = 10
  const helperHandlesToRemove = []
  transformHelper.traverse((child) => {
    child.renderOrder = 10

    if (child.name === 'E') {
      helperHandlesToRemove.push(child)
    }

    if ('material' in child) {
      const material = child.material
      const materials = Array.isArray(material) ? material : material ? [material] : []

      materials.forEach((item) => {
        item.depthTest = false
        item.depthWrite = false
        item.transparent = true
      })
    }
  })
  helperHandlesToRemove.forEach((child) => {
    child.parent?.remove(child)
  })
  transformControls.addEventListener('dragging-changed', (event) => {
    isTransforming = event.value

    if (controls) {
      controls.enabled = !event.value
    }
  })
  transformControls.addEventListener('mouseDown', () => {
    isUsingTransformGizmo = true

    if (transformControls?.getMode() === 'scale' && transformControls.object) {
      const objectId = transformControls.object.userData?.objectId

      if (typeof objectId === 'string') {
        activeScaleContext = createScaleInteractionContext(
          THREE,
          sceneObjects,
          gridConfig,
          objectId,
          transformControls.object
        )
      }
    }
  })
  transformControls.addEventListener('mouseUp', () => {
    isUsingTransformGizmo = false
    activeScaleContext = null
  })
  transformControls.addEventListener('objectChange', () => {
    if (!transformControls || !transformControls.object) {
      return
    }

    const objectId = transformControls.object.userData?.objectId

    if (typeof objectId !== 'string') {
      return
    }

    if (transformControls.getMode() === 'translate') {
      const snapped = snapVectorToGrid(THREE, gridConfig, transformControls.object.position)
      transformControls.object.position.copy(snapped)
      updateSceneObjectPosition(sceneObjects, objectId, snapped)
      return
    }

    if (transformControls.getMode() === 'scale') {
      const scaleContext = activeScaleContext ?? createScaleInteractionContext(
        THREE,
        sceneObjects,
        gridConfig,
        objectId,
        transformControls.object
      )
      activeScaleContext = scaleContext

      let nextScale

      if (scaleContext.profile === 'floor') {
        nextScale = applyFloorScaleBehavior(
          THREE,
          transformControls.object,
          scaleContext,
          gridConfig,
          MIN_SCALE_CELLS
        )
      } else if (scaleContext.profile === 'shape') {
        nextScale = applyShapeScaleBehavior(
          THREE,
          transformControls.object,
          scaleContext,
          gridConfig,
          MIN_SCALE_CELLS
        )
      } else {
        nextScale = applyModelScaleBehavior(
          THREE,
          transformControls.object,
          scaleContext,
          transformControls.axis,
          gridConfig,
          MIN_SCALE_CELLS
        )
      }

      updateSceneObjectScale(sceneObjects, objectId, nextScale)
      updateSceneObjectPosition(sceneObjects, objectId, transformControls.object.position)
      return
    }

    updateSceneObjectRotation(sceneObjects, objectId, transformControls.object.rotation)
  })
  gizmoScene.add(transformHelper)

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
