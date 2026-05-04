import { snapVectorToGrid } from './sceneMath.js'

export function applySceneObjectState(meshById, objectState) {
  const mesh = meshById.get(objectState.id)

  if (!mesh) {
    return
  }

  mesh.position.set(...objectState.position)
  mesh.rotation.set(...objectState.rotation)
  mesh.scale.set(...objectState.scale)
}

export function resnapAllObjects(THREE, sceneObjects, gridConfig, meshById) {
  sceneObjects.forEach((objectState) => {
    const snapped = snapVectorToGrid(
      THREE,
      gridConfig,
      new THREE.Vector3(objectState.position[0], objectState.position[1], objectState.position[2])
    )

    objectState.position = [snapped.x, snapped.y, snapped.z]
    applySceneObjectState(meshById, objectState)
  })
}

export function updateSceneObjectPosition(sceneObjects, objectId, position) {
  const objectState = sceneObjects.find((object) => object.id === objectId)

  if (!objectState) {
    return
  }

  objectState.position = [position.x, position.y, position.z]
}

export function updateSceneObjectRotation(sceneObjects, objectId, rotation) {
  const objectState = sceneObjects.find((object) => object.id === objectId)

  if (!objectState) {
    return
  }

  objectState.rotation = [rotation.x, rotation.y, rotation.z]
}

export function updateSceneObjectScale(sceneObjects, objectId, scale) {
  const objectState = sceneObjects.find((object) => object.id === objectId)

  if (!objectState) {
    return
  }

  objectState.scale = [scale.x, scale.y, scale.z]
}

export function getSelectableRoot(object) {
  let current = object

  while (current) {
    if (current.userData && current.userData.selectableRootId) {
      return current
    }

    current = current.parent
  }

  return null
}

export function registerSelectableRoot(THREE, selectableRoots, meshById, objectId, root) {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const baseUniformSize = Math.max(size.x, size.y, size.z, 1)
  const baseSize = new THREE.Vector3(
    Math.max(size.x, 1),
    Math.max(size.y, 1),
    Math.max(size.z, 1)
  )

  root.userData.objectId = objectId
  root.userData.selectableRootId = objectId
  root.userData.baseUniformSize = baseUniformSize
  root.userData.baseSize = baseSize
  selectableRoots.push(root)
  meshById.set(objectId, root)
}
