<template>
  <div ref="containerRef" class="scene-root" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const containerRef = ref<HTMLDivElement | null>(null)

type EditorTool = 'select' | 'move' | 'rotate'

const props = withDefaults(defineProps<{
  activeTool?: EditorTool
}>(), {
  activeTool: 'select'
})

type SceneObjectState = {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

type GridConfig = {
  groundSize: number
  cellSize: number
  origin: [number, number, number]
}

const gridConfig = reactive<GridConfig>({
  groundSize: 160,
  cellSize: 1,
  origin: [0, 0, 0]
})

const sceneObjects = reactive<SceneObjectState[]>([
  {
    id: 'placeholder',
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  }
])

const selectedObjectId = ref<string | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let transformControls: TransformControls | null = null
let transformHelper: THREE.Object3D | null = null
let composer: EffectComposer | null = null
let outlinePass: OutlinePass | null = null
let gizmoScene: THREE.Scene | null = null
let gizmoRenderPass: RenderPass | null = null
let outputPass: OutputPass | null = null
let resizeObserver: ResizeObserver | null = null
let frameId = 0
let gridTexture: THREE.CanvasTexture | null = null
let gridPlane: THREE.Mesh | null = null
let isTransforming = false
let isUsingTransformGizmo = false

const selectableRoots: THREE.Object3D[] = []
const meshById = new Map<string, THREE.Object3D>()
const raycaster = new THREE.Raycaster()
const pointerNdc = new THREE.Vector2()
const emissiveCache = new WeakMap<THREE.Material, { color: THREE.Color; intensity: number }>()
const activeEmissiveMaterials = new Set<THREE.Material>()
const emissiveTransitions = new Map<THREE.Material, {
  fromColor: THREE.Color
  toColor: THREE.Color
  fromIntensity: number
  toIntensity: number
}>()
let emissiveAnimationFrame = 0

let pointerIsDown = false
let pointerMoved = false
let pointerDownClientX = 0
let pointerDownClientY = 0

const CLICK_MOVE_THRESHOLD_PX = 6

const GLOW_TRANSITION_MS = 300
const GLOW_TARGET_INTENSITY = 0.35

const materialPool: THREE.Material[] = []
const geometryPool: THREE.BufferGeometry[] = []
const texturePool: THREE.Texture[] = []

function poolMaterial<T extends THREE.Material>(material: T): T {
  materialPool.push(material)
  return material
}

function poolGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
  geometryPool.push(geometry)
  return geometry
}

function poolTexture<T extends THREE.Texture>(texture: T): T {
  texturePool.push(texture)
  return texture
}

function setCameraStartPosition(distance: number, verticalDeg: number, horizontalDeg: number): void {
  if (!camera) {
    return
  }

  const elevation = THREE.MathUtils.degToRad(verticalDeg)
  const azimuth = THREE.MathUtils.degToRad(horizontalDeg)
  const planarDistance = distance * Math.cos(elevation)

  const x = planarDistance * Math.sin(azimuth)
  const y = distance * Math.sin(elevation)
  const z = planarDistance * Math.cos(azimuth)

  camera.position.set(x, y, z)
}

function createRoundedGridTexture(groundSize: number, cellSize: number): THREE.CanvasTexture {
  const size = 96
  const radius = 17
  const inset = 9

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not create grid texture context')
  }

  context.clearRect(0, 0, size, size)
  context.strokeStyle = 'rgba(105, 125, 90, 0.58)'
  context.lineWidth = 3

  const min = inset
  const max = size - inset

  context.beginPath()
  context.moveTo(min + radius, min)
  context.lineTo(max - radius, min)
  context.quadraticCurveTo(max, min, max, min + radius)
  context.lineTo(max, max - radius)
  context.quadraticCurveTo(max, max, max - radius, max)
  context.lineTo(min + radius, max)
  context.quadraticCurveTo(min, max, min, max - radius)
  context.lineTo(min, min + radius)
  context.quadraticCurveTo(min, min, min + radius, min)
  context.closePath()
  context.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(groundSize / cellSize, groundSize / cellSize)
  texture.needsUpdate = true

  return texture
}

function snapValueToGrid(value: number, cellSize: number, origin: number): number {
  if (cellSize <= 0) {
    return value
  }

  return Math.round((value - origin) / cellSize) * cellSize + origin
}

function snapVectorToGrid(position: THREE.Vector3): THREE.Vector3 {
  const [originX, originY, originZ] = gridConfig.origin
  const x = snapValueToGrid(position.x, gridConfig.cellSize, originX)
  const y = snapValueToGrid(position.y, gridConfig.cellSize, originY)
  const z = snapValueToGrid(position.z, gridConfig.cellSize, originZ)

  return new THREE.Vector3(x, y, z)
}

function updateGridTextureRepeat(): void {
  if (!gridTexture) {
    return
  }

  gridTexture.repeat.set(gridConfig.groundSize / gridConfig.cellSize, gridConfig.groundSize / gridConfig.cellSize)
  gridTexture.needsUpdate = true
}

function applySceneObjectState(objectState: SceneObjectState): void {
  const mesh = meshById.get(objectState.id)

  if (!mesh) {
    return
  }

  mesh.position.set(...objectState.position)
  mesh.rotation.set(...objectState.rotation)
  mesh.scale.set(...objectState.scale)
}

function resnapAllObjects(): void {
  sceneObjects.forEach((objectState) => {
    const snapped = snapVectorToGrid(
      new THREE.Vector3(objectState.position[0], objectState.position[1], objectState.position[2])
    )

    objectState.position = [snapped.x, snapped.y, snapped.z]
    applySceneObjectState(objectState)
  })
}

function updateSceneObjectPosition(objectId: string, position: THREE.Vector3): void {
  const objectState = sceneObjects.find((object) => object.id === objectId)

  if (!objectState) {
    return
  }

  objectState.position = [position.x, position.y, position.z]
}

function updateSceneObjectRotation(objectId: string, rotation: THREE.Euler): void {
  const objectState = sceneObjects.find((object) => object.id === objectId)

  if (!objectState) {
    return
  }

  objectState.rotation = [rotation.x, rotation.y, rotation.z]
}

function getSelectableRoot(object: THREE.Object3D | null): THREE.Object3D | null {
  let current: THREE.Object3D | null = object

  while (current) {
    if (current.userData && current.userData.selectableRootId) {
      return current
    }

    current = current.parent
  }

  return null
}

function registerSelectableRoot(objectId: string, root: THREE.Object3D): void {
  root.userData.objectId = objectId
  root.userData.selectableRootId = objectId
  selectableRoots.push(root)
  meshById.set(objectId, root)
}

function clearEmissiveHighlight(): void {
  if (!activeEmissiveMaterials.size) {
    return
  }

  runEmissiveTransition(activeEmissiveMaterials, false)
  activeEmissiveMaterials.clear()
}

function applyEmissiveHighlight(target: THREE.Object3D | null): void {
  clearEmissiveHighlight()

  if (!target) {
    return
  }

  const highlightColor = new THREE.Color('#f3e6a2')
  const nextMaterials = new Set<THREE.Material>()

  target.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material]

    materials.forEach((material: THREE.Material) => {
      if (!('emissive' in material)) {
        return
      }

      if (!emissiveCache.has(material)) {
        emissiveCache.set(material, {
          color: material.emissive.clone(),
          intensity: 'emissiveIntensity' in material ? material.emissiveIntensity : 1
        })
      }

      nextMaterials.add(material)
    })
  })

  if (!nextMaterials.size) {
    return
  }

  activeEmissiveMaterials.clear()
  nextMaterials.forEach((material) => activeEmissiveMaterials.add(material))
  runEmissiveTransition(nextMaterials, true, highlightColor)
}

function runEmissiveTransition(
  materials: Set<THREE.Material>,
  toHighlight: boolean,
  highlightColor = new THREE.Color('#f3e6a2')
): void {
  if (emissiveAnimationFrame) {
    cancelAnimationFrame(emissiveAnimationFrame)
  }

  emissiveTransitions.clear()

  materials.forEach((material) => {
    if (!('emissive' in material)) {
      return
    }

    const cached = emissiveCache.get(material)

    if (!cached) {
      return
    }

    const fromColor = material.emissive.clone()
    const toColor = toHighlight ? highlightColor.clone() : cached.color.clone()
    const fromIntensity = 'emissiveIntensity' in material ? material.emissiveIntensity : cached.intensity
    const toIntensity = toHighlight ? GLOW_TARGET_INTENSITY : cached.intensity

    emissiveTransitions.set(material, { fromColor, toColor, fromIntensity, toIntensity })
  })

  if (!emissiveTransitions.size) {
    return
  }

  const start = performance.now()

  const tick = (now: number) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / GLOW_TRANSITION_MS, 1)
    const eased = progress * progress * (3 - 2 * progress)

    emissiveTransitions.forEach((transition, material) => {
      if (!('emissive' in material)) {
        return
      }

      material.emissive.copy(transition.fromColor).lerp(transition.toColor, eased)

      if ('emissiveIntensity' in material) {
        material.emissiveIntensity = THREE.MathUtils.lerp(
          transition.fromIntensity,
          transition.toIntensity,
          eased
        )
      }
    })

    if (progress < 1) {
      emissiveAnimationFrame = requestAnimationFrame(tick)
      return
    }

    emissiveAnimationFrame = 0
    emissiveTransitions.clear()
  }

  emissiveAnimationFrame = requestAnimationFrame(tick)
}

function setSelectedObjectId(objectId: string | null): void {
  selectedObjectId.value = objectId

  const selectedMesh = objectId ? meshById.get(objectId) ?? null : null

  if (outlinePass) {
    outlinePass.selectedObjects = selectedMesh ? [selectedMesh] : []
  }

  applyEmissiveHighlight(selectedMesh)

  syncTransformControlsState()
}

function syncTransformControlsState(): void {
  if (!transformControls) {
    return
  }

  const selectedMesh = selectedObjectId.value ? meshById.get(selectedObjectId.value) ?? null : null
  const isMoveActive = props.activeTool === 'move'
  const isRotateActive = props.activeTool === 'rotate'

  if (!selectedMesh || (!isMoveActive && !isRotateActive)) {
    transformControls.detach()
    transformControls.enabled = false
    transformControls.visible = false
    if (transformHelper) {
      transformHelper.visible = false
    }
    return
  }

  transformControls.attach(selectedMesh)
  transformControls.setMode(isMoveActive ? 'translate' : 'rotate')
  transformControls.setSpace('world')
  transformControls.enabled = true
  transformControls.visible = true
  transformControls.setTranslationSnap(isMoveActive ? gridConfig.cellSize : null)
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

function handlePointerDown(event: PointerEvent): void {
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

function handlePointerMove(event: PointerEvent): void {
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

function handlePointerUp(event: PointerEvent): void {
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

function resizeRenderer(): void {
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

function animate(): void {
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
  setCameraStartPosition(28, 30, 20)
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

  gridTexture = poolTexture(createRoundedGridTexture(gridConfig.groundSize, gridConfig.cellSize))

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
  registerSelectableRoot('placeholder', placeholder)
  resnapAllObjects()
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
  transformControls.showY = true
  transformControls.showX = true
  transformControls.showZ = true
  transformControls.size = 1.2
  transformControls.visible = false
  transformHelper = transformControls.getHelper()
  transformHelper.visible = false
  transformHelper.renderOrder = 10
  transformHelper.traverse((child: THREE.Object3D) => {
    child.renderOrder = 10

    if ('material' in child) {
      const material = child.material as THREE.Material | THREE.Material[] | undefined
      const materials = Array.isArray(material) ? material : material ? [material] : []

      materials.forEach((item) => {
        item.depthTest = false
        item.depthWrite = false
        item.transparent = true
      })
    }
  })
  transformControls.addEventListener('dragging-changed', (event: { value: boolean }) => {
    isTransforming = event.value

    if (controls) {
      controls.enabled = !event.value
    }
  })
  transformControls.addEventListener('mouseDown', () => {
    isUsingTransformGizmo = true
  })
  transformControls.addEventListener('mouseUp', () => {
    isUsingTransformGizmo = false
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
      const snapped = snapVectorToGrid(transformControls.object.position)
      transformControls.object.position.copy(snapped)
      updateSceneObjectPosition(objectId, snapped)
      return
    }

    updateSceneObjectRotation(objectId, transformControls.object.rotation)
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

      updateGridTextureRepeat()
      if (transformControls?.getMode() === 'translate') {
        transformControls.setTranslationSnap(cellSize)
      }
      resnapAllObjects()
    }
  )

  syncTransformControlsState()

  animate()
})

onBeforeUnmount(() => {
  if (frameId) {
    window.cancelAnimationFrame(frameId)
  }

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
