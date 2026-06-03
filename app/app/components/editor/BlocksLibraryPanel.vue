<script setup>
import { onMounted, ref } from 'vue'
import * as THREE from 'three'
import CloseIconButton from '../ui/CloseIconButton.vue'
import OverlayCard from '../ui/OverlayCard.vue'

const emit = defineEmits(['close', 'select-block'])

const availableBlocks = [
  { id: 'square', label: 'Vierkant' },
  { id: 'sphere', label: 'Bol' },
  { id: 'cylinder', label: 'Cilinder' },
  { id: 'cone', label: 'Kegel' },
  { id: 'triangle', label: 'Helling' }
]

const blockPreviews = ref({})
const previewsLoading = ref(true)

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
      -1, -1, 1,    // 0: front-left
      1, -1, 1,     // 1: front-right
      -1, -1, -1,   // 2: back-left-bottom
      1, -1, -1,    // 3: back-right-bottom
      -1, 1, -1,    // 4: back-left-top
      1, 1, -1      // 5: back-right-top
    ])
    const indices = new Uint32Array([
      // Top sloped surface
      0, 1, 5,
      0, 5, 4,
      // Bottom face
      2, 3, 1,
      2, 1, 0,
      // Left side (diagonal)
      0, 4, 2,
      // Right side (diagonal)
      1, 3, 5,
      // Back face
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

function generateBlockPreview(shapeType) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf6f8f2)

  const light1 = new THREE.DirectionalLight(0xffffff, 0.8)
  light1.position.set(5, 5, 5)
  scene.add(light1)

  const light2 = new THREE.DirectionalLight(0xffffff, 0.4)
  light2.position.set(-5, 3, -5)
  scene.add(light2)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const geometry = createBlockGeometry(shapeType)
  const material = new THREE.MeshStandardMaterial({
    color: 0xa8ba9e,
    roughness: 0.56,
    metalness: 0.03
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
  camera.position.z = 4

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(256, 256)
  renderer.setPixelRatio(window.devicePixelRatio || 1)

  renderer.render(scene, camera)

  return canvas.toDataURL('image/png')
}

function handleAddBlock(blockType) {
  emit('select-block', blockType)
}

function handleClose() {
  emit('close')
}

onMounted(() => {
  try {
    availableBlocks.forEach((block) => {
      blockPreviews.value[block.id] = generateBlockPreview(block.id)
    })
  } catch (err) {
    console.error('Failed to generate block previews:', err)
  } finally {
    previewsLoading.value = false
  }
})
</script>

<template>
  <OverlayCard class="blocks-library" aria-label="Blokkenbibliotheek">
    <header class="library-header">
      <h2 class="library-title">Blokken</h2>
      <CloseIconButton @click="handleClose" />
    </header>

    <p class="library-subtitle">Kies een basisblok om aan de scène toe te voegen.</p>

    <p v-if="previewsLoading" class="library-status">Voorbeelden laden...</p>

    <div v-else class="blocks-grid">
      <button
        v-for="block in availableBlocks"
        :key="block.id"
        type="button"
        class="block-card"
        :title="block.label"
        @click="handleAddBlock(block.id)"
      >
        <img
          :src="blockPreviews[block.id]"
          :alt="block.label"
          class="block-thumbnail"
        />
        <span class="block-label">{{ block.label }}</span>
      </button>
    </div>
  </OverlayCard>
</template>

<style scoped>
.blocks-library {
  top: 28%;
  left: calc(14.2rem + 0.8rem);
  z-index: 3;
  width: min(22rem, calc(100vw - 2rem));
  padding: 0.9rem;
  border-radius: 0.9rem;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.library-title {
  margin: 0;
  color: #4e5b41;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.close-button {
  padding: 0.42rem 0.62rem;
  font-size: 0.84rem;
}

.library-subtitle {
  margin: 0.66rem 0 0.72rem;
  color: rgba(68, 80, 56, 0.82);
  font-size: 0.88rem;
}

.library-status {
  margin: 0;
  color: rgba(68, 80, 56, 0.5);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem 0;
}

.blocks-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  max-height: 22rem;
  overflow-y: auto;
}

.block-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem;
  border: 1px solid rgba(124, 138, 110, 0.28);
  border-radius: 0.6rem;
  background: linear-gradient(180deg, #f6f8f2, #e4ebda);
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease;
  text-align: center;
}

.block-card:hover {
  border-color: rgba(114, 131, 98, 0.55);
  box-shadow: 0 2px 8px rgba(73, 88, 60, 0.12);
}

.block-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.4rem;
  background: rgba(68, 80, 56, 0.06);
}

.block-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #4e5b41;
  line-height: 1.2;
  word-break: break-word;
}

@media (max-width: 900px) {
  .blocks-library {
    left: 1rem;
    top: auto;
    bottom: 12.4rem;
    width: min(20rem, calc(100vw - 2rem));
  }
}
</style>
