export function createCameraNavigationRuntime({
  THREE,
  camera,
  controls,
  renderer,
  meshById,
  getActiveTool,
  getSelectedObjectId,
  transitionDurationMs
}) {
  const defaultCameraPosition = new THREE.Vector3()
  const defaultCameraTarget = new THREE.Vector3()

  const cameraTransition = {
    isActive: false,
    startTime: 0,
    duration: transitionDurationMs,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3()
  }

  let panPointerIsDown = false

  function easeInOutCubic(progress) {
    if (progress < 0.5) {
      return 4 * progress * progress * progress
    }

    return 1 - Math.pow(-2 * progress + 2, 3) / 2
  }

  function captureDefaultView() {
    defaultCameraPosition.copy(camera.position)
    defaultCameraTarget.copy(controls.target)
  }

  function syncNavigationMode() {
    const isPanActive = getActiveTool() === 'pan'

    controls.mouseButtons.LEFT = isPanActive ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE
    controls.mouseButtons.RIGHT = isPanActive ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN

    if (!renderer?.domElement) {
      return
    }

    if (isPanActive) {
      renderer.domElement.style.cursor = panPointerIsDown ? 'grabbing' : 'grab'
      return
    }

    renderer.domElement.style.cursor = ''
  }

  function startCameraTransition(nextPosition, nextTarget) {
    cameraTransition.fromPosition.copy(camera.position)
    cameraTransition.toPosition.copy(nextPosition)
    cameraTransition.fromTarget.copy(controls.target)
    cameraTransition.toTarget.copy(nextTarget)
    cameraTransition.startTime = performance.now()
    cameraTransition.duration = transitionDurationMs
    cameraTransition.isActive = true
  }

  function updateCameraTransition() {
    if (!cameraTransition.isActive) {
      return
    }

    const elapsed = performance.now() - cameraTransition.startTime
    const progress = Math.min(elapsed / cameraTransition.duration, 1)
    const easedProgress = easeInOutCubic(progress)

    camera.position.lerpVectors(cameraTransition.fromPosition, cameraTransition.toPosition, easedProgress)
    controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, easedProgress)
    camera.updateProjectionMatrix()

    if (progress >= 1) {
      cameraTransition.isActive = false
    }
  }

  function centerOnSelectionOrDefault() {
    const selectedObjectId = getSelectedObjectId()
    const selectedMesh = selectedObjectId ? meshById.get(selectedObjectId) ?? null : null
    const nextTarget = new THREE.Vector3()

    if (selectedMesh) {
      const bounds = new THREE.Box3().setFromObject(selectedMesh)
      bounds.getCenter(nextTarget)
    } else {
      nextTarget.copy(defaultCameraTarget)
    }

    const nextPosition = selectedMesh
      ? nextTarget.clone().add(camera.position.clone().sub(controls.target))
      : defaultCameraPosition.clone()

    startCameraTransition(nextPosition, nextTarget)
  }

  function cancelTransition() {
    cameraTransition.isActive = false
  }

  function handlePointerDown(event) {
    if (getActiveTool() !== 'pan') {
      return false
    }

    if (event.button !== 0) {
      return true
    }

    panPointerIsDown = true
    syncNavigationMode()
    return true
  }

  function handlePointerUp() {
    if (getActiveTool() !== 'pan') {
      return false
    }

    if (!panPointerIsDown) {
      return true
    }

    panPointerIsDown = false
    syncNavigationMode()
    return true
  }

  function handleToolChange() {
    panPointerIsDown = false
    syncNavigationMode()
  }

  return {
    captureDefaultView,
    syncNavigationMode,
    updateCameraTransition,
    centerOnSelectionOrDefault,
    cancelTransition,
    handlePointerDown,
    handlePointerUp,
    handleToolChange
  }
}