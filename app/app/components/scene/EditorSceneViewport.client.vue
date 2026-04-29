<template>
  <div ref="containerRef" class="scene-root" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const containerRef = ref<HTMLDivElement | null>(null)

const GROUND_SIZE = 160
const GRID_CELL_SIZE = 0.55

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let resizeObserver: ResizeObserver | null = null
let frameId = 0

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

function createRoundedGridTexture(): THREE.CanvasTexture {
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
  texture.repeat.set(GROUND_SIZE / GRID_CELL_SIZE, GROUND_SIZE / GRID_CELL_SIZE)
  texture.needsUpdate = true

  return texture
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
}

function animate(): void {
  if (!renderer || !scene || !camera || !controls) {
    return
  }

  frameId = window.requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
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

  const gridTexture = poolTexture(createRoundedGridTexture())

  if (renderer.capabilities) {
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  }

  const gridPlane = new THREE.Mesh(
    poolGeometry(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE)),
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
    poolGeometry(new THREE.BoxGeometry(10.5, 0.72, 10.5)),
    poolMaterial(
      new THREE.MeshStandardMaterial({
        color: '#7a8fa0',
        roughness: 0.86,
        metalness: 0.04
      })
    )
  )
  plinth.position.y = 0.36
  scene.add(plinth)

  const placeholder = new THREE.Mesh(
    poolGeometry(new THREE.BoxGeometry(1.6, 1.6, 1.6)),
    poolMaterial(
      new THREE.MeshStandardMaterial({
        color: '#f5b8ca',
        roughness: 0.53,
        metalness: 0.02
      })
    )
  )
  placeholder.position.set(0, 1.6, 0)
  scene.add(placeholder)

  resizeRenderer()
  resizeObserver = new ResizeObserver(resizeRenderer)
  resizeObserver.observe(container)

  animate()
})

onBeforeUnmount(() => {
  if (frameId) {
    window.cancelAnimationFrame(frameId)
  }

  resizeObserver?.disconnect()
  controls?.dispose()

  texturePool.forEach((texture) => texture.dispose())
  materialPool.forEach((material) => material.dispose())
  geometryPool.forEach((geometry) => geometry.dispose())

  if (renderer) {
    renderer.dispose()

    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
  }

  scene = null
  camera = null
  controls = null
  renderer = null
  resizeObserver = null
})
</script>

<style scoped>
.scene-root {
  position: absolute;
  inset: 0;
}
</style>
