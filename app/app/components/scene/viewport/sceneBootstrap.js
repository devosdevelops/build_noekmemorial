export function createSceneBootstrap({
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
  sceneObjects,
  initialLightingPreset = null
}) {
  function createGroundFadeTexture(THREE) {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not create ground fade texture context')
    }

    const center = size / 2
    const gradient = context.createRadialGradient(center, center, 0, center, center, center)

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.42, 'rgba(255, 255, 255, 0.95)')
    gradient.addColorStop(0.72, 'rgba(255, 255, 255, 0.45)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true

    return texture
  }

  function getObjectColor(objectId, fallbackColor) {
    const objectState = sceneObjects.find((item) => item.id === objectId)

    if (typeof objectState?.appearance?.color === 'string' && objectState.appearance.color.length) {
      return objectState.appearance.color
    }

    return fallbackColor
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#e9ede5')
  scene.fog = new THREE.Fog('#e9ede5', 70, 180)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 240)
  setCameraStartPosition(camera, 28, 30, 20, THREE)
  camera.lookAt(0, 0.8, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
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

  function applyLightingPreset(preset) {
    if (!preset || typeof preset !== 'object') {
      return
    }

    if (typeof preset.background === 'string' && preset.background.length) {
      scene.background = new THREE.Color(preset.background)
    }

    if (typeof preset.fog === 'string' && preset.fog.length) {
      scene.fog = new THREE.Fog(preset.fog, 70, 180)
    }

    if (typeof preset.hemiSkyColor === 'string' && preset.hemiSkyColor.length) {
      hemiLight.color.set(preset.hemiSkyColor)
    }

    if (typeof preset.hemiGroundColor === 'string' && preset.hemiGroundColor.length) {
      hemiLight.groundColor.set(preset.hemiGroundColor)
    }

    if (typeof preset.hemiIntensity === 'number' && Number.isFinite(preset.hemiIntensity)) {
      hemiLight.intensity = preset.hemiIntensity
    }

    if (typeof preset.sunColor === 'string' && preset.sunColor.length) {
      sunLight.color.set(preset.sunColor)
    }

    if (typeof preset.sunIntensity === 'number' && Number.isFinite(preset.sunIntensity)) {
      sunLight.intensity = preset.sunIntensity
    }

    if (Array.isArray(preset.sunPosition) && preset.sunPosition.length === 3) {
      sunLight.position.set(
        Number.isFinite(preset.sunPosition[0]) ? preset.sunPosition[0] : 20,
        Number.isFinite(preset.sunPosition[1]) ? preset.sunPosition[1] : 38,
        Number.isFinite(preset.sunPosition[2]) ? preset.sunPosition[2] : 14
      )
    }

    if (typeof preset.exposure === 'number' && Number.isFinite(preset.exposure)) {
      renderer.toneMappingExposure = preset.exposure
    }
  }

  applyLightingPreset(initialLightingPreset)

  const gridTexture = poolTexture(createRoundedGridTexture(THREE, gridConfig.groundSize, gridConfig.cellSize))
  const groundFadeTexture = poolTexture(createGroundFadeTexture(THREE))

  if (renderer.capabilities) {
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  }

  const extendedGroundSize = Math.max(gridConfig.groundSize * 8, 1200)
  const groundPlane = new THREE.Mesh(
    poolGeometry(new THREE.PlaneGeometry(extendedGroundSize, extendedGroundSize)),
    poolMaterial(
      new THREE.MeshStandardMaterial({
        color: '#f8f6f1',
        roughness: 0.98,
        metalness: 0,
        transparent: true,
        alphaMap: groundFadeTexture,
        opacity: 0.82,
        depthWrite: false
      })
    )
  )
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = -0.2
  scene.add(groundPlane)
  registerSelectableRoot(THREE, selectableRoots, meshById, 'ground', groundPlane)

  const gridPlane = new THREE.Mesh(
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

  const plinthThickness = 0.1
  const plinth = new THREE.Mesh(
    poolGeometry(new THREE.BoxGeometry(1, plinthThickness, 1)),
    poolMaterial(
      new THREE.MeshStandardMaterial({
        color: getObjectColor('floor', '#7a8fa0'),
        roughness: 0.86,
        metalness: 0.04
      })
    )
  )
  scene.add(plinth)
  registerSelectableRoot(THREE, selectableRoots, meshById, 'floor', plinth)
  resnapAllObjects(THREE, sceneObjects, gridConfig, meshById)

  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.addPass(new RenderPass(scene, camera))

  const outlinePass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera)
  outlinePass.edgeStrength = 4.1
  outlinePass.edgeGlow = 0.6
  outlinePass.edgeThickness = 1.8
  outlinePass.visibleEdgeColor.set('#f2d68c')
  outlinePass.hiddenEdgeColor.set('#e6c978')
  composer.addPass(outlinePass)

  const gizmoScene = new THREE.Scene()
  const gizmoRenderPass = new RenderPass(gizmoScene, camera)
  gizmoRenderPass.clear = false
  gizmoRenderPass.clearDepth = true
  composer.addPass(gizmoRenderPass)

  const outputPass = new OutputPass()
  composer.addPass(outputPass)

  return {
    scene,
    camera,
    renderer,
    controls,
    composer,
    outlinePass,
    gizmoScene,
    gizmoRenderPass,
    outputPass,
    groundPlane,
    gridTexture,
    gridPlane,
    applyLightingPreset,
    hemiLight,
    sunLight
  }
}
