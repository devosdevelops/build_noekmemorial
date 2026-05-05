export function createTransformRuntime({
  THREE,
  TransformControls,
  camera,
  renderer,
  controls,
  gizmoScene,
  gridConfig,
  sceneObjects,
  interactionState,
  minScaleCells,
  createScaleInteractionContext,
  applyFloorScaleBehavior,
  applyShapeScaleBehavior,
  applyModelScaleBehavior,
  snapVectorToGrid,
  updateSceneObjectPosition,
  updateSceneObjectScale,
  updateSceneObjectRotation
}) {
  const transformControls = new TransformControls(camera, renderer.domElement)
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

  const transformHelper = transformControls.getHelper()
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
    interactionState.isTransforming = event.value

    if (controls) {
      controls.enabled = !event.value
    }
  })

  transformControls.addEventListener('mouseDown', () => {
    interactionState.isUsingTransformGizmo = true

    if (transformControls.getMode() !== 'scale' || !transformControls.object) {
      return
    }

    const objectId = transformControls.object.userData?.objectId

    if (typeof objectId !== 'string') {
      return
    }

    interactionState.activeScaleContext = createScaleInteractionContext(
      THREE,
      sceneObjects,
      gridConfig,
      objectId,
      transformControls.object
    )
  })

  transformControls.addEventListener('mouseUp', () => {
    interactionState.isUsingTransformGizmo = false
    interactionState.activeScaleContext = null
  })

  transformControls.addEventListener('objectChange', () => {
    if (!transformControls.object) {
      return
    }

    const objectId = transformControls.object.userData?.objectId

    if (typeof objectId !== 'string') {
      return
    }

    if (transformControls.getMode() === 'translate') {
      const snapped = snapVectorToGrid(THREE, gridConfig, transformControls.object.position)

      const objectState = sceneObjects.find((object) => object.id === objectId)

      if (objectState?.scaleProfile === 'floor') {
        snapped.y = objectState.position[1]
      }

      transformControls.object.position.copy(snapped)
      updateSceneObjectPosition(sceneObjects, objectId, snapped)
      return
    }

    if (transformControls.getMode() === 'scale') {
      const scaleContext = interactionState.activeScaleContext ?? createScaleInteractionContext(
        THREE,
        sceneObjects,
        gridConfig,
        objectId,
        transformControls.object
      )
      interactionState.activeScaleContext = scaleContext

      let nextScale

      if (scaleContext.profile === 'floor') {
        nextScale = applyFloorScaleBehavior(
          THREE,
          transformControls.object,
          scaleContext,
          gridConfig,
          minScaleCells
        )
      } else if (scaleContext.profile === 'shape') {
        nextScale = applyShapeScaleBehavior(
          THREE,
          transformControls.object,
          scaleContext,
          gridConfig,
          minScaleCells
        )
      } else {
        nextScale = applyModelScaleBehavior(
          THREE,
          transformControls.object,
          scaleContext,
          transformControls.axis,
          gridConfig,
          minScaleCells
        )
      }

      updateSceneObjectScale(sceneObjects, objectId, nextScale)
      updateSceneObjectPosition(sceneObjects, objectId, transformControls.object.position)
      return
    }

    updateSceneObjectRotation(sceneObjects, objectId, transformControls.object.rotation)
  })

  gizmoScene.add(transformHelper)

  return {
    transformControls,
    transformHelper
  }
}
