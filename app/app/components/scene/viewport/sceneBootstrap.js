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
  sceneObjects
}) {
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

  const gridTexture = poolTexture(createRoundedGridTexture(THREE, gridConfig.groundSize, gridConfig.cellSize))

  if (renderer.capabilities) {
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  }

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

  const plinthThickness = 0.12
  const plinth = new THREE.Mesh(
    poolGeometry(new THREE.BoxGeometry(10, plinthThickness, 10)),
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
    gridTexture,
    gridPlane
  }
}
