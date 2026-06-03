<template>
  <div ref="containerRef" class="viewer-viewport" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { hydrateRuntimeSceneState } from '../../scene/sceneHydration.js'
import { SCENE_KIND } from '../../scene/sceneContract.js'
import { DEFAULT_LIGHTING_PRESET_ID, getLightingPresetById } from '../../config/lightingPresets.js'
import { FLOOR_TEXTURE_BY_ID } from '../../config/floorTextures.js'
import { setCameraStartPosition } from './viewport/sceneMath.js'

const props = defineProps({
  activeMode: {
    type: String,
    default: 'look-around'
  },
  sceneDocument: {
    type: Object,
    default: null
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
const runtimeSceneObjects = []
const visitorCandleMeshes = []
const visitorCandleGlowLights = new Set()
let activeSelectionMesh = null
const CANDLE_LIGHT_USERDATA_KEY = '__viewerCandleGlowLight'
const VIEWER_CANDLE_TARGET_DIAGONAL = 0.34

const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const loadedTextureCache = new Map()
const gridConfig = {
  groundSize: 160,
  cellSize: 1,
  origin: [0, 0, 0]
}

let hemiLight = null
let sunLight = null
let sceneUpdateToken = 0

const cameraFocusState = {
  active: false,
  startTime: 0,
  durationMs: 900,
  fromPosition: new THREE.Vector3(),
  toPosition: new THREE.Vector3(),
  fromTarget: new THREE.Vector3(),
  toTarget: new THREE.Vector3()
}

const defaultCameraPosition = new THREE.Vector3()
const defaultCameraTarget = new THREE.Vector3()

let pointerIsDown = false
let pointerMoved = false
let pointerDownX = 0
let pointerDownY = 0

const CLICK_MOVE_THRESHOLD = 6

function applyModeSettings() {
  if (!controls) {
    return
  }

  controls.enabled = true
  controls.enablePan = true
  controls.enableZoom = true
  controls.enableRotate = true
  controls.minDistance = 12
  controls.maxDistance = 60
  controls.minPolarAngle = THREE.MathUtils.degToRad(18)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(82)
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN
  controls.touches.ONE = THREE.TOUCH.ROTATE
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN
  controls.keyPanSpeed = 12
  controls.update()
}

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2
}

function captureDefaultCameraView() {
  if (!camera || !controls) {
    return
  }

  defaultCameraPosition.copy(camera.position)
  defaultCameraTarget.copy(controls.target)
}

function cancelCameraTransition() {
  cameraFocusState.active = false
}

function startCameraTransition(nextPosition, nextTarget, durationMs = 900) {
  if (!camera || !controls || !nextPosition || !nextTarget) {
    return
  }

  cameraFocusState.fromPosition.copy(camera.position)
  cameraFocusState.fromTarget.copy(controls.target)
  cameraFocusState.toPosition.copy(nextPosition)
  cameraFocusState.toTarget.copy(nextTarget)
  cameraFocusState.durationMs = durationMs
  cameraFocusState.startTime = performance.now()
  cameraFocusState.active = true
}

function asVector3(input, fallback) {
  if (!Array.isArray(input) || input.length !== 3) {
    return [...fallback]
  }

  return [
    Number.isFinite(input[0]) ? input[0] : fallback[0],
    Number.isFinite(input[1]) ? input[1] : fallback[1],
    Number.isFinite(input[2]) ? input[2] : fallback[2]
  ]
}

function disposeMeshResources(mesh) {
  if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
    mesh.geometry.dispose()
  }

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  materials.forEach((material) => {
    if (material && typeof material.dispose === 'function') {
      material.dispose()
    }
  })
}

function disposeGroupResources(group) {
  group.traverse((child) => {
    if (child.isMesh) {
      disposeMeshResources(child)
    }
  })
}

function clearRuntimeSceneObjects() {
  clearSelectionHighlight()

  runtimeSceneObjects.forEach((sceneObject) => {
    if (scene) {
      scene.remove(sceneObject)
    }
    if (sceneObject?.isMesh) {
      disposeMeshResources(sceneObject)
      return
    }

    if (sceneObject?.isObject3D) {
      disposeGroupResources(sceneObject)
    }
  })

  runtimeSceneObjects.length = 0
  selectableMeshes.length = 0
  meshMetaById.clear()
}

function applyLightingPresetFromSceneDocument() {
  if (!scene || !hemiLight || !sunLight || !renderer) {
    return
  }

  const presetId = props.sceneDocument?.editorSettings?.lighting?.presetId
  const lightingPreset = getLightingPresetById(
    typeof presetId === 'string' && presetId.length ? presetId : DEFAULT_LIGHTING_PRESET_ID
  )

  scene.background = new THREE.Color(lightingPreset.background)
  scene.fog = new THREE.Fog(lightingPreset.fog, 70, 180)
  hemiLight.color.set(lightingPreset.hemiSkyColor)
  hemiLight.groundColor.set(lightingPreset.hemiGroundColor)
  hemiLight.intensity = lightingPreset.hemiIntensity
  sunLight.color.set(lightingPreset.sunColor)
  sunLight.intensity = lightingPreset.sunIntensity
  sunLight.position.set(...lightingPreset.sunPosition)
  renderer.toneMappingExposure = lightingPreset.exposure
}

function applyModelAppearance(modelRoot, appearance) {
  if (!modelRoot) {
    return
  }

  const overrides = Array.isArray(appearance?.materialOverrides)
    ? appearance.materialOverrides.filter((entry) => {
        return entry
          && typeof entry.materialName === 'string'
          && entry.materialName.length
          && typeof entry.color === 'string'
          && entry.color.length
      })
    : []

  const overrideColorByMaterial = new Map(overrides.map((entry) => [entry.materialName, entry.color]))
  const globalOverrideColor = overrideColorByMaterial.get('all-materials') ?? null

  modelRoot.traverse((child) => {
    if (!child?.isMesh) {
      return
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material]

    materials.forEach((material, materialIndex) => {
      if (!material || !material.color?.set || !material.color?.getHexString) {
        return
      }

      if (!material.userData) {
        material.userData = {}
      }

      if (typeof material.userData.baseColor !== 'string' || !material.userData.baseColor.length) {
        material.userData.baseColor = `#${material.color.getHexString()}`
      }

      const materialName = typeof material.name === 'string' && material.name.length
        ? `material:${material.name}`
        : `slot:${child.name || 'mesh'}:${materialIndex}`
      const targetOverrideColor = overrideColorByMaterial.get(materialName) ?? null
      const nextColor = targetOverrideColor || globalOverrideColor || material.userData.baseColor

      material.color.set(nextColor)
      material.roughness = appearance?.finish?.roughness ?? material.roughness
      material.metalness = appearance?.finish?.metalness ?? material.metalness
      material.needsUpdate = true
    })
  })
}

function createModelLayoutFromBounds(box) {
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  const safeWidth = Math.max(size.x, 0.001)
  const safeDepth = Math.max(size.z, 0.001)
  const rawAspectRatio = safeWidth / safeDepth
  const isNearSquare = Math.abs(1 - rawAspectRatio) <= 0.12
  const maxAxisCells = Math.max(1, Math.min(24, Math.ceil(Math.max(safeWidth, safeDepth) / gridConfig.cellSize) + 2))

  let bestCandidate = null

  for (let cellsX = 1; cellsX <= maxAxisCells; cellsX += 1) {
    for (let cellsZ = 1; cellsZ <= maxAxisCells; cellsZ += 1) {
      const candidateIsSquare = cellsX === cellsZ

      if (isNearSquare && !candidateIsSquare) {
        continue
      }

      const fitScale = Math.min(
        (cellsX * gridConfig.cellSize) / safeWidth,
        (cellsZ * gridConfig.cellSize) / safeDepth
      )

      if (!(fitScale > 0)) {
        continue
      }

      const aspectPenalty = Math.abs(Math.log((cellsX / cellsZ) / rawAspectRatio))
      const scalePenalty = Math.abs(Math.log(fitScale))
      const areaPenalty = (cellsX * cellsZ) / (maxAxisCells * maxAxisCells)
      const squarePenalty = !isNearSquare && candidateIsSquare ? 0.08 : 0
      const score = aspectPenalty * 4 + scalePenalty * 2 + areaPenalty + squarePenalty

      if (!bestCandidate || score < bestCandidate.score) {
        bestCandidate = {
          cellsX,
          cellsZ,
          fitScale,
          score
        }
      }
    }
  }

  const candidate = bestCandidate ?? { cellsX: 1, cellsZ: 1, fitScale: 1 }
  const groupWidth = candidate.cellsX * gridConfig.cellSize
  const groupDepth = candidate.cellsZ * gridConfig.cellSize
  const scaledHeight = size.y * candidate.fitScale
  const groupHeight = Math.max(
    gridConfig.cellSize,
    Math.ceil(Math.max(scaledHeight, gridConfig.cellSize) / gridConfig.cellSize) * gridConfig.cellSize
  )

  return {
    center,
    minY: box.min.y,
    fitScale: candidate.fitScale,
    footprintCells: [candidate.cellsX, candidate.cellsZ],
    groupSize: new THREE.Vector3(groupWidth, groupHeight, groupDepth)
  }
}

function buildModelWrapper(modelId, gltfScene) {
  gltfScene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(gltfScene)
  const layout = createModelLayoutFromBounds(box)
  const wrapper = new THREE.Group()

  wrapper.name = `${modelId}-wrapper`
  wrapper.userData.baseUniformSize = Math.max(layout.groupSize.x, layout.groupSize.y, layout.groupSize.z)
  wrapper.userData.baseSize = layout.groupSize.clone()
  wrapper.userData.scaleProfile = 'model'
  wrapper.userData.localBounds = {
    min: [-layout.groupSize.x / 2, 0, -layout.groupSize.z / 2],
    max: [layout.groupSize.x / 2, layout.groupSize.y, layout.groupSize.z / 2]
  }
  wrapper.userData.modelFootprintCells = [...layout.footprintCells]

  gltfScene.scale.setScalar(layout.fitScale)
  gltfScene.position.set(
    -layout.center.x * layout.fitScale,
    -layout.minY * layout.fitScale,
    -layout.center.z * layout.fitScale
  )
  wrapper.add(gltfScene)

  return wrapper
}

function createBlockGeometry(shapeType) {
  if (shapeType === 'sphere') {
    return new THREE.SphereGeometry(1, 24, 18)
  }

  if (shapeType === 'cylinder') {
    return new THREE.CylinderGeometry(1, 1, 2, 28)
  }

  if (shapeType === 'cone') {
    return new THREE.ConeGeometry(1, 2, 28)
  }

  if (shapeType === 'triangle') {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      -1, -1, 1,
      1, -1, 1,
      -1, -1, -1,
      1, -1, -1,
      -1, 1, -1,
      1, 1, -1
    ])
    const indices = new Uint32Array([
      0, 1, 5,
      0, 5, 4,
      2, 3, 1,
      2, 1, 0,
      0, 4, 2,
      1, 3, 5,
      4, 5, 3,
      4, 3, 2
    ])
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.computeVertexNormals()
    return geometry
  }

  return new THREE.BoxGeometry(2, 2, 2)
}

function getTextureByUrl(textureUrl, { isColorTexture = false } = {}) {
  if (typeof textureUrl !== 'string' || !textureUrl.length) {
    return null
  }

  let texture = loadedTextureCache.get(textureUrl)

  if (!texture) {
    texture = textureLoader.load(textureUrl)
    loadedTextureCache.set(textureUrl, texture)
  }

  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  if (isColorTexture) {
    texture.colorSpace = THREE.SRGBColorSpace
  }

  return texture
}

function applyTextureTransform(texture, textureAppearance) {
  if (!texture) {
    return
  }

  const uvScale = Array.isArray(textureAppearance?.uvScale) ? textureAppearance.uvScale : [1, 1]

  texture.repeat.set(uvScale[0] ?? 1, uvScale[1] ?? 1)
  texture.center.set(0.5, 0.5)
  texture.rotation = typeof textureAppearance?.rotation === 'number' ? textureAppearance.rotation : 0
  texture.needsUpdate = true
}

function applyFloorAppearance(mesh, appearance) {
  if (!mesh || !mesh.material) {
    return
  }

  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  const textureAppearance = appearance?.texture
  const textureConfig = textureAppearance?.textureId
    ? FLOOR_TEXTURE_BY_ID[textureAppearance.textureId] ?? null
    : null

  material.color.set(textureConfig ? '#ffffff' : appearance?.color || '#7a8fa0')
  material.metalness = appearance?.finish?.metalness ?? 0.03

  if (!textureConfig) {
    material.map = null
    material.normalMap = null
    material.roughnessMap = null
    material.roughness = appearance?.finish?.roughness ?? 0.86
    material.needsUpdate = true
    return
  }

  const colorTexture = getTextureByUrl(textureConfig.maps.colorUrl, { isColorTexture: true })
  const normalTexture = getTextureByUrl(textureConfig.maps.normalUrl)
  const roughnessTexture = getTextureByUrl(textureConfig.maps.roughnessUrl)
  const textureIntensity = typeof textureAppearance?.intensity === 'number' ? textureAppearance.intensity : 1

  applyTextureTransform(colorTexture, textureAppearance)
  applyTextureTransform(normalTexture, textureAppearance)
  applyTextureTransform(roughnessTexture, textureAppearance)

  material.map = colorTexture
  material.normalMap = normalTexture
  material.roughnessMap = roughnessTexture
  material.roughness = 1
  material.normalScale.set(textureIntensity, textureIntensity)
  material.needsUpdate = true
}

function applyShapeAppearance(mesh, appearance) {
  if (!mesh || !mesh.material) {
    return
  }

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const textureAppearance = appearance?.texture
  const textureConfig = textureAppearance?.textureId
    ? FLOOR_TEXTURE_BY_ID[textureAppearance.textureId] ?? null
    : null

  materials.forEach((material) => {
    if (!material) {
      return
    }

    if (material.color?.set) {
      material.color.set(appearance?.color || '#b4c9a6')
    }

    material.metalness = appearance?.finish?.metalness ?? 0.03

    if (!textureConfig) {
      material.map = null
      material.normalMap = null
      material.roughnessMap = null
      material.roughness = appearance?.finish?.roughness ?? 0.56
      material.needsUpdate = true
      return
    }

    const colorTexture = getTextureByUrl(textureConfig.maps.colorUrl, { isColorTexture: true })
    const normalTexture = getTextureByUrl(textureConfig.maps.normalUrl)
    const roughnessTexture = getTextureByUrl(textureConfig.maps.roughnessUrl)
    const textureIntensity = typeof textureAppearance?.intensity === 'number' ? textureAppearance.intensity : 1

    applyTextureTransform(colorTexture, textureAppearance)
    applyTextureTransform(normalTexture, textureAppearance)
    applyTextureTransform(roughnessTexture, textureAppearance)

    material.map = colorTexture
    material.normalMap = normalTexture
    material.roughnessMap = roughnessTexture
    material.roughness = 1
    material.normalScale.set(textureIntensity, textureIntensity)
    material.needsUpdate = true
  })
}

function clearVisitorCandles() {
  visitorCandleMeshes.forEach((mesh) => {
    if (scene) {
      scene.remove(mesh)
    }

    disposeGroupResources(mesh)
  })

  visitorCandleMeshes.length = 0
  visitorCandleGlowLights.clear()
}

function loadModelWrapper(downloadUrl, modelId) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      downloadUrl,
      (gltf) => {
        try {
          resolve(buildModelWrapper(modelId, gltf.scene))
        } catch (error) {
          reject(error)
        }
      },
      undefined,
      reject
    )
  })
}

function applyCandleGlowToMaterials(modelRoot) {
  if (!modelRoot) {
    return
  }

  modelRoot.traverse((child) => {
    if (!child?.isMesh) {
      return
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (!material || !('emissive' in material)) {
        return
      }

      if (!material.userData) {
        material.userData = {}
      }

      if (typeof material.userData.baseEmissiveHex !== 'number') {
        material.userData.baseEmissiveHex = material.emissive.getHex()
      }

      if (typeof material.userData.baseEmissiveIntensity !== 'number') {
        material.userData.baseEmissiveIntensity = typeof material.emissiveIntensity === 'number' ? material.emissiveIntensity : 1
      }

      material.emissive.set('#ff8c2f')
      if (typeof material.emissiveIntensity === 'number') {
        material.emissiveIntensity = Math.max(material.userData.baseEmissiveIntensity, 0.3)
      }
      material.userData.candleGlowApplied = true
      material.needsUpdate = true
    })
  })
}

function attachCandlePointLight(modelRoot) {
  if (!modelRoot) {
    return
  }

  modelRoot.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(modelRoot)
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  bounds.getCenter(center)
  bounds.getSize(size)

  const light = new THREE.PointLight(
    '#ffb057',
    0.16,
    THREE.MathUtils.clamp(size.length() * 0.22, 0.45, 1.1),
    2.4
  )
  light.userData[CANDLE_LIGHT_USERDATA_KEY] = true
  light.userData.baseIntensity = light.intensity
  light.userData.baseDistance = light.distance
  light.userData.flickerPhase = Math.random() * Math.PI * 2
  light.position.set(
    center.x,
    bounds.max.y + Math.max(0.08, size.y * 0.08),
    center.z
  )
  modelRoot.add(light)
  visitorCandleGlowLights.add(light)
}

function updateCandleFlickerAnimation(timeMs) {
  if (!visitorCandleGlowLights.size) {
    return
  }

  const staleLights = []

  visitorCandleGlowLights.forEach((light) => {
    if (!light?.parent) {
      staleLights.push(light)
      return
    }

    const baseIntensity = Number(light.userData?.baseIntensity) || 0.95
    const baseDistance = Number(light.userData?.baseDistance) || 3
    const phase = Number(light.userData?.flickerPhase) || 0
    const t = (Number.isFinite(timeMs) ? timeMs : performance.now()) / 1000

    const waveA = Math.sin((t * 11.5) + phase)
    const waveB = Math.sin((t * 23.7) + phase * 0.37)
    const intensityFactor = 0.9 + (waveA * 0.08) + (waveB * 0.04)
    const distanceFactor = 0.97 + (waveB * 0.03)

    light.intensity = Math.max(0.05, baseIntensity * intensityFactor)
    light.distance = Math.max(0.5, baseDistance * distanceFactor)
  })

  staleLights.forEach((light) => {
    visitorCandleGlowLights.delete(light)
  })
}

function applyCandleLightingEffects(modelRoot) {
  applyCandleGlowToMaterials(modelRoot)
  attachCandlePointLight(modelRoot)
}

function geometryForObjectState(objectState) {
  const kind = objectState?.kind || 'shape'
  const assetRef = objectState?.assetRef || 'square'

  if (kind === 'floor') {
    return new THREE.BoxGeometry(1, 0.1, 1)
  }

  if (kind === 'shape') {
    return createBlockGeometry(assetRef)
  }

  if (kind === 'light') {
    return new THREE.SphereGeometry(0.48, 18, 14)
  }

  if (kind === 'audio') {
    return new THREE.CylinderGeometry(0.42, 0.42, 0.82, 18)
  }

  return new THREE.BoxGeometry(1.2, 1.2, 1.2)
}

function materialForObjectState(objectState) {
  const kind = objectState?.kind || 'shape'
  const appearanceColor = objectState?.appearance?.color
  const color = typeof appearanceColor === 'string' && appearanceColor.length
    ? appearanceColor
    : '#8ea3b6'

  if (kind === 'light') {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: '#ffd189',
      emissiveIntensity: 0.32,
      roughness: 0.4,
      metalness: 0.08
    })
  }

  if (kind === 'audio') {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.1
    })
  }

  if (kind === 'floor') {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.86,
      metalness: 0.02
    })
  }

  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.06
  })
}

function descriptionForObjectState(objectState) {
  const metadataTitle = objectState?.metadata?.title
  const attribution = objectState?.metadata?.attribution

  if (typeof attribution === 'string' && attribution.trim().length) {
    return attribution
  }

  if (objectState?.interaction?.type === 'media-carousel') {
    return 'Interactiepunt voor gedeelde bijdragen in deze herdenkingsruimte.'
  }

  if (typeof metadataTitle === 'string' && metadataTitle.trim().length) {
    return `Element: ${metadataTitle.trim()}`
  }

  return 'Geselecteerd scene-element.'
}

function createFloor() {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 1),
    new THREE.MeshStandardMaterial({
      color: '#7a8fa0',
      roughness: 0.86,
      metalness: 0.03
    })
  )

  floor.position.set(0, -0.07, 0)
  floor.scale.set(10, 1, 10)
  floor.userData.sourceKind = 'floor'
  floor.userData.selectableId = 'floor'
  selectableMeshes.push(floor)
  meshMetaById.set('floor', {
    id: 'floor',
    kind: 'floor',
    title: 'Vloer',
    description: 'Vloeroppervlak van de herdenkingsruimte.',
    interaction: null
  })
  scene.add(floor)
  runtimeSceneObjects.push(floor)
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
      interaction: {
        type: 'media-carousel',
        mediaKind: 'image-video'
      },
      geometry: new THREE.DodecahedronGeometry(1.4, 0),
      material: new THREE.MeshStandardMaterial({ color: '#8f9aa7', roughness: 0.7 }),
      position: [3, 1.5, -2]
    },
    {
      id: 'candle-circle',
      title: 'Candle Circle',
      description: 'Light a candle in this circle.',
      interaction: {
        type: 'media-carousel',
        mediaKind: 'audio'
      },
      geometry: new THREE.TorusGeometry(2, 0.35, 16, 42),
      material: new THREE.MeshStandardMaterial({ color: '#d0b687', roughness: 0.45, metalness: 0.15 }),
      position: [0, 1, 6]
    },
    {
      id: 'message-wall',
      title: 'Message Wall',
      description: 'Open to read and leave messages.',
      interaction: {
        type: 'media-carousel',
        mediaKind: 'message'
      },
      geometry: new THREE.BoxGeometry(6.5, 3.3, 0.45),
      material: new THREE.MeshStandardMaterial({ color: '#5e768d', roughness: 0.55 }),
      position: [8, 1.7, 3]
    }
  ]

  entries.forEach((entry) => {
    const mesh = new THREE.Mesh(entry.geometry, entry.material)
    mesh.position.set(...entry.position)
    mesh.userData.sourceKind = 'shape'
    mesh.userData.selectableId = entry.id
    selectableMeshes.push(mesh)
    meshMetaById.set(entry.id, {
      id: entry.id,
      kind: 'shape',
      title: entry.title,
      description: entry.description,
      interaction: entry.interaction ?? null
    })
    runtimeSceneObjects.push(mesh)
    scene.add(mesh)
  })
}

function createObjectsFromSceneDocument() {
  const sceneObjects = Array.isArray(props.sceneDocument?.objects) ? props.sceneDocument.objects : []

  if (!sceneObjects.length) {
    createFloor()
    return Promise.resolve()
  }

  const hydrationResult = hydrateRuntimeSceneState(props.sceneDocument)
  const runtimeObjects = hydrationResult.isValid ? hydrationResult.runtimeObjects : []
  const activeToken = ++sceneUpdateToken

  if (props.sceneDocument?.editorSettings?.grid && typeof props.sceneDocument.editorSettings.grid === 'object') {
    const nextCellSize = Number(props.sceneDocument.editorSettings.grid.cellSize)
    const nextGroundSize = Number(props.sceneDocument.editorSettings.grid.groundSize)
    const nextOrigin = Array.isArray(props.sceneDocument.editorSettings.grid.origin)
      ? props.sceneDocument.editorSettings.grid.origin
      : null

    if (Number.isFinite(nextCellSize) && nextCellSize > 0) {
      gridConfig.cellSize = nextCellSize
    }

    if (Number.isFinite(nextGroundSize) && nextGroundSize > 0) {
      gridConfig.groundSize = nextGroundSize
    }

    if (nextOrigin && nextOrigin.length === 3) {
      gridConfig.origin = [
        Number.isFinite(nextOrigin[0]) ? nextOrigin[0] : 0,
        Number.isFinite(nextOrigin[1]) ? nextOrigin[1] : 0,
        Number.isFinite(nextOrigin[2]) ? nextOrigin[2] : 0
      ]
    }
  }

  const objectTasks = runtimeObjects.map(async (objectState, index) => {
    if (activeToken !== sceneUpdateToken) {
      return
    }

    const selectableId = typeof objectState?.id === 'string' && objectState.id.length
      ? objectState.id
      : `scene-object-${index}`
    const position = asVector3(objectState?.position, objectState?.kind === SCENE_KIND.FLOOR ? [0, -0.07, 0] : [0, 1, 0])
    const rotation = asVector3(objectState?.rotation, [0, 0, 0])
    const scale = asVector3(objectState?.scale, [1, 1, 1])

    let rootObject = null

    if (objectState.kind === SCENE_KIND.MODEL && typeof objectState.assetRef === 'string' && objectState.assetRef.length) {
      try {
        rootObject = await loadModelWrapper(objectState.assetRef, selectableId)
        applyModelAppearance(rootObject, objectState.appearance)
        applyCandleLightingEffects(rootObject)
        rootObject.traverse((child) => {
          if (child?.isMesh) {
            child.userData.sourceKind = objectState.kind
            child.userData.selectableId = selectableId
            selectableMeshes.push(child)
          }
        })
      } catch (error) {
        console.error('[ViewerSceneViewport] Failed to load model from scene document, using primitive fallback.', error)
      }
    }

    if (!rootObject) {
      rootObject = new THREE.Mesh(
        geometryForObjectState(objectState),
        materialForObjectState(objectState)
      )
      rootObject.userData.sourceKind = objectState?.kind || 'shape'
      rootObject.userData.selectableId = selectableId
      selectableMeshes.push(rootObject)
    }

    rootObject.position.set(position[0], position[1], position[2])
    rootObject.rotation.set(rotation[0], rotation[1], rotation[2])
    rootObject.scale.set(scale[0], scale[1], scale[2])

    if (objectState.kind === SCENE_KIND.FLOOR) {
      applyFloorAppearance(rootObject, objectState.appearance)
    } else if (objectState.kind === SCENE_KIND.SHAPE) {
      applyShapeAppearance(rootObject, objectState.appearance)
    }

    runtimeSceneObjects.push(rootObject)

    const metadataTitle = objectState?.metadata?.title
    const defaultTitle = objectState?.kind === 'floor' ? 'Vloer' : 'Scene element'

    meshMetaById.set(selectableId, {
      id: selectableId,
      kind: objectState?.kind || rootObject?.userData?.sourceKind || 'shape',
      title: typeof metadataTitle === 'string' && metadataTitle.trim().length
        ? metadataTitle.trim()
        : defaultTitle,
      description: descriptionForObjectState(objectState),
      interaction: objectState?.interaction ?? null
    })

    if (activeToken === sceneUpdateToken) {
      scene.add(rootObject)
    }
  })

  return Promise.all(objectTasks)
}

function rebuildRuntimeSceneObjects() {
  if (!scene) {
    return Promise.resolve()
  }

  applyLightingPresetFromSceneDocument()
  clearRuntimeSceneObjects()
  return createObjectsFromSceneDocument()
}

function randomFrom(min, max) {
  return min + Math.random() * (max - min)
}

function getSupportMeshes() {
  return runtimeSceneObjects.filter((mesh) => {
    if (!mesh || (!mesh.isMesh && !mesh.isGroup)) {
      return false
    }

    return mesh.userData?.sourceKind !== 'floor'
  })
}

function getMeshBounds(mesh) {
  const bounds = new THREE.Box3().setFromObject(mesh)

  return {
    min: bounds.min.clone(),
    max: bounds.max.clone(),
    center: bounds.getCenter(new THREE.Vector3())
  }
}

function getCandleMeshRadius(style) {
  if (style === 'Goud') return 0.13
  if (style === 'Warm licht') return 0.12
  return 0.11
}

function findNearestBlockingDistance(candidatePosition, minDistance) {
  const candidate = new THREE.Vector3(candidatePosition[0], candidatePosition[1], candidatePosition[2])

  let shortest = Infinity
  const runtimeCenters = runtimeSceneObjects
    .filter((mesh) => mesh?.isMesh || mesh?.isGroup)
    .map((mesh) => getMeshBounds(mesh).center)
  const candleCenters = visitorCandleMeshes.map((mesh) => mesh.position.clone())

  ;[...runtimeCenters, ...candleCenters].forEach((center) => {
    const distance = candidate.distanceTo(center)
    shortest = Math.min(shortest, distance)
  })

  return shortest >= minDistance
}

function clampPlacement(position) {
  return [
    THREE.MathUtils.clamp(position[0], -24, 24),
    THREE.MathUtils.clamp(position[1], 0.04, 20),
    THREE.MathUtils.clamp(position[2], -24, 24)
  ]
}

function pickCandlePlacement(style = 'Klassiek') {
  const supportMeshes = getSupportMeshes()
  const placementRadius = getCandleMeshRadius(style) + 0.65

  if (!supportMeshes.length) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const fallbackPosition = clampPlacement([randomFrom(-8, 8), 0.06, randomFrom(-8, 8)])
      if (findNearestBlockingDistance(fallbackPosition, placementRadius)) {
        return {
          worldPosition: fallbackPosition,
          anchorObjectId: null
        }
      }
    }

    return {
      worldPosition: [0, 0.06, 0],
      anchorObjectId: null
    }
  }

  const shuffledSupports = [...supportMeshes].sort(() => Math.random() - 0.5)

  for (let supportIndex = 0; supportIndex < shuffledSupports.length; supportIndex += 1) {
    const supportMesh = shuffledSupports[supportIndex]
    const supportBounds = getMeshBounds(supportMesh)
    const supportCenter = supportBounds.center
    const placeOnTop = Math.random() < 0.35

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = placeOnTop
        ? [
            supportCenter.x + randomFrom(-0.25, 0.25),
            supportBounds.max.y + 0.08,
            supportCenter.z + randomFrom(-0.25, 0.25)
          ]
        : [
            supportCenter.x + randomFrom(-1.8, 1.8),
            0.06,
            supportCenter.z + randomFrom(-1.8, 1.8)
          ]

      const clamped = clampPlacement(candidate)

      if (findNearestBlockingDistance(clamped, placementRadius)) {
        return {
          worldPosition: clamped,
          anchorObjectId: supportMesh.userData?.selectableId || null
        }
      }
    }
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const randomSupport = shuffledSupports[Math.floor(Math.random() * shuffledSupports.length)]
    const center = getMeshBounds(randomSupport).center
    const fallbackNearObject = clampPlacement([
      center.x + randomFrom(-2.2, 2.2),
      0.06,
      center.z + randomFrom(-2.2, 2.2)
    ])

    if (findNearestBlockingDistance(fallbackNearObject, placementRadius)) {
      return {
        worldPosition: fallbackNearObject,
        anchorObjectId: randomSupport.userData?.selectableId || null
      }
    }
  }

  return {
    worldPosition: [0, 0.06, 0],
    anchorObjectId: null
  }
}

function createVisitorCandleMesh(candleStyle) {
  const candleGroup = new THREE.Group()

  const style = typeof candleStyle === 'string' ? candleStyle : 'Klassiek'
  const isWarm = style === 'Warm licht'
  const isGold = style === 'Goud'

  const waxColor = isGold ? '#d6b267' : isWarm ? '#f1e0c3' : '#efe9df'
  const flameColor = isGold ? '#ffb347' : '#ffd06a'

  const waxGeometry = new THREE.CylinderGeometry(0.07, 0.085, 0.16, 20)
  const waxMaterial = new THREE.MeshStandardMaterial({
    color: waxColor,
    roughness: 0.72,
    metalness: isGold ? 0.18 : 0.03
  })

  const waxMesh = new THREE.Mesh(waxGeometry, waxMaterial)
  waxMesh.position.y = 0.08
  candleGroup.add(waxMesh)

  const flameGeometry = new THREE.SphereGeometry(0.03, 14, 10)
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: flameColor,
    emissive: flameColor,
    emissiveIntensity: 0.78,
    roughness: 0.24,
    metalness: 0
  })
  const flameMesh = new THREE.Mesh(flameGeometry, flameMaterial)
  flameMesh.position.y = 0.2
  candleGroup.add(flameMesh)

  candleGroup.userData.isVisitorCandle = true
  candleGroup.userData.candleStyle = style

  return candleGroup
}

function startCameraFocusTransition(targetPosition) {
  if (!camera || !controls || !Array.isArray(targetPosition) || targetPosition.length !== 3) {
    return
  }

  const targetVector = new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2])
  const currentDistance = camera.position.distanceTo(controls.target)
  const nextDistance = THREE.MathUtils.clamp(currentDistance * 0.72, 7, 22)
  const viewOffset = camera.position.clone().sub(controls.target)

  if (viewOffset.lengthSq() === 0) {
    viewOffset.copy(defaultCameraPosition).sub(defaultCameraTarget)
  }

  viewOffset.setLength(nextDistance)

  const nextPosition = targetVector.clone().add(viewOffset)
  startCameraTransition(nextPosition, targetVector, 900)
}

function updateCameraFocusTransition(now) {
  if (!cameraFocusState.active || !camera || !controls) {
    return
  }

  const elapsed = now - cameraFocusState.startTime
  const rawProgress = Math.min(Math.max(elapsed / cameraFocusState.durationMs, 0), 1)
  const easedProgress = easeInOutCubic(rawProgress)

  camera.position.lerpVectors(
    cameraFocusState.fromPosition,
    cameraFocusState.toPosition,
    easedProgress
  )
  controls.target.lerpVectors(
    cameraFocusState.fromTarget,
    cameraFocusState.toTarget,
    easedProgress
  )

  if (rawProgress >= 1) {
    cameraFocusState.active = false
  }

  controls.update()
}

function focusCameraOnPosition(targetPosition) {
  startCameraFocusTransition(targetPosition)
}

function resetCameraView() {
  if (!camera || !controls) {
    return
  }

  startCameraTransition(defaultCameraPosition, defaultCameraTarget, 1100)
}

async function placeVisitorCandle({ candleStyle = 'Klassiek', candleModel = null } = {}) {
  if (!scene) {
    return null
  }

  const placement = pickCandlePlacement(candleStyle)

  let candleMesh = null

  if (typeof candleModel?.downloadUrl === 'string' && candleModel.downloadUrl.length) {
    try {
      candleMesh = await loadModelWrapper(
        candleModel.downloadUrl,
        `visitor-candle-${Date.now().toString(36)}`,
        { targetDiagonal: VIEWER_CANDLE_TARGET_DIAGONAL }
      )
    } catch (error) {
      console.error('[ViewerSceneViewport] Failed to load candle model, using fallback candle mesh.', error)
    }
  }

  if (!candleMesh) {
    candleMesh = createVisitorCandleMesh(candleStyle)
  }

  candleMesh.position.set(placement.worldPosition[0], placement.worldPosition[1], placement.worldPosition[2])
  candleMesh.userData.isVisitorCandle = true
  candleMesh.userData.candleStyle = candleStyle
  candleMesh.userData.candleModelId = candleModel?.id || null

  scene.add(candleMesh)
  visitorCandleMeshes.push(candleMesh)
  applyCandleLightingEffects(candleMesh)

  startCameraFocusTransition(placement.worldPosition)

  return placement
}

function setupRendererAndScene() {
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

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 0.8, 0)
  controls.listenToKeyEvents(window)

  hemiLight = new THREE.HemisphereLight('#f7faef', '#b9c7b2', 0.82)
  sunLight = new THREE.DirectionalLight('#ffffff', 0.84)
  sunLight.position.set(20, 38, 14)

  scene.add(hemiLight)
  scene.add(sunLight)

  rebuildRuntimeSceneObjects()

  resizeObserver = new ResizeObserver(() => {
    syncSize()
  })
  resizeObserver.observe(container)

  syncSize()
  captureDefaultCameraView()
  applyModeSettings()
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
  cancelCameraTransition()
  pointerIsDown = true
  pointerMoved = false
  pointerDownX = event.clientX
  pointerDownY = event.clientY
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
}

function onTouchStart(event) {
  if (!event.touches?.length) {
    return
  }

  cancelCameraTransition()

  const touch = event.touches[0]
  pointerIsDown = true
  pointerMoved = false
  pointerDownX = touch.clientX
  pointerDownY = touch.clientY
}

function onTouchMove(event) {
  if (!event.touches?.length) {
    return
  }

  const touch = event.touches[0]

  if (Math.abs(touch.clientX - pointerDownX) > CLICK_MOVE_THRESHOLD || Math.abs(touch.clientY - pointerDownY) > CLICK_MOVE_THRESHOLD) {
    pointerMoved = true
  }

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
}

function animate(time) {
  const safeTime = Number.isFinite(time) ? time : performance.now()

  updateCandleFlickerAnimation(safeTime)
  updateCameraFocusTransition(safeTime)
  controls?.update()

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
}

onMounted(() => {
  setupRendererAndScene()
  bindDomListeners()
  frameId = requestAnimationFrame(animate)
})

defineExpose({
  placeVisitorCandle,
  focusCameraOnPosition,
  resetCameraView
})

watch(
  () => props.sceneDocument,
  () => {
    rebuildRuntimeSceneObjects()
  },
  { deep: true }
)

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
  controls?.stopListenToKeyEvents()
  renderer?.dispose()

  clearRuntimeSceneObjects()
  clearVisitorCandles()

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
