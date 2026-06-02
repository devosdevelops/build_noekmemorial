export function setCameraStartPosition(camera, distance, verticalDeg, horizontalDeg, THREE) {
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

export function createRoundedGridTexture(THREE, groundSize, cellSize) {
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

function snapValueToGrid(value, cellSize, origin) {
  if (cellSize <= 0) {
    return value
  }

  return Math.round((value - origin) / cellSize) * cellSize + origin
}

export function snapVectorToGrid(THREE, gridConfig, position) {
  const [originX, originY, originZ] = gridConfig.origin
  const x = snapValueToGrid(position.x, gridConfig.cellSize, originX)
  const y = snapValueToGrid(position.y, gridConfig.cellSize, originY)
  const z = snapValueToGrid(position.z, gridConfig.cellSize, originZ)

  return new THREE.Vector3(x, y, z)
}

function snapScaleValue(value, cellSize) {
  if (cellSize <= 0) {
    return value
  }

  return Math.max(cellSize, Math.round(value / cellSize) * cellSize)
}

function snapCellCenterValue(value, cellSize, origin) {
  if (cellSize <= 0) {
    return value
  }

  const normalized = (value - origin) / cellSize
  const nearestCenterIndex = Math.round(normalized - 0.5)

  return origin + (nearestCenterIndex + 0.5) * cellSize
}

function getObjectBoundsMin(THREE, object) {
  const virtualBounds = getVirtualObjectBounds(THREE, object)

  if (virtualBounds) {
    return virtualBounds.min.clone()
  }

  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object)

  return box.min.clone()
}

function getObjectBoundsMax(THREE, object) {
  const virtualBounds = getVirtualObjectBounds(THREE, object)

  if (virtualBounds) {
    return virtualBounds.max.clone()
  }

  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object)

  return box.max.clone()
}

function getVirtualObjectBounds(THREE, object) {
  const min = object.userData?.localBounds?.min
  const max = object.userData?.localBounds?.max

  if (!Array.isArray(min) || !Array.isArray(max) || min.length !== 3 || max.length !== 3) {
    return null
  }

  object.updateMatrixWorld(true)

  const corners = [
    new THREE.Vector3(min[0], min[1], min[2]),
    new THREE.Vector3(min[0], min[1], max[2]),
    new THREE.Vector3(min[0], max[1], min[2]),
    new THREE.Vector3(min[0], max[1], max[2]),
    new THREE.Vector3(max[0], min[1], min[2]),
    new THREE.Vector3(max[0], min[1], max[2]),
    new THREE.Vector3(max[0], max[1], min[2]),
    new THREE.Vector3(max[0], max[1], max[2])
  ]
  const box = new THREE.Box3()

  corners.forEach((corner) => {
    corner.applyMatrix4(object.matrixWorld)
    box.expandByPoint(corner)
  })

  return box
}

function getSnappedObjectBoundsMin(THREE, object, gridConfig) {
  const min = getObjectBoundsMin(THREE, object)
  const [originX, originY, originZ] = gridConfig.origin

  return new THREE.Vector3(
    snapValueToGrid(min.x, gridConfig.cellSize, originX),
    snapValueToGrid(min.y, gridConfig.cellSize, originY),
    snapValueToGrid(min.z, gridConfig.cellSize, originZ)
  )
}

function getSnappedObjectBoundsMax(THREE, object, gridConfig) {
  const max = getObjectBoundsMax(THREE, object)
  const [originX, originY, originZ] = gridConfig.origin

  return new THREE.Vector3(
    snapValueToGrid(max.x, gridConfig.cellSize, originX),
    snapValueToGrid(max.y, gridConfig.cellSize, originY),
    snapValueToGrid(max.z, gridConfig.cellSize, originZ)
  )
}

function alignObjectBoundsToAnchorsByAxis(THREE, object, anchorMin, anchorMax, anchorModes) {
  const currentMin = getObjectBoundsMin(THREE, object)
  const currentMax = getObjectBoundsMax(THREE, object)
  const offset = new THREE.Vector3(
    anchorModes.x === 'max'
      ? anchorMax.x - currentMax.x
      : anchorModes.x === 'min'
        ? anchorMin.x - currentMin.x
        : 0,
    anchorModes.y === 'max'
      ? anchorMax.y - currentMax.y
      : anchorModes.y === 'min'
        ? anchorMin.y - currentMin.y
        : 0,
    anchorModes.z === 'max'
      ? anchorMax.z - currentMax.z
      : anchorModes.z === 'min'
        ? anchorMin.z - currentMin.z
        : 0
  )

  object.position.add(offset)
  object.updateMatrixWorld(true)
}

function getObjectBaseUniformSize(THREE, object) {
  const fromUserData = object.userData?.baseUniformSize

  if (typeof fromUserData === 'number' && Number.isFinite(fromUserData) && fromUserData > 0) {
    return fromUserData
  }

  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  box.getSize(size)

  const maxDimension = Math.max(size.x, size.y, size.z)

  return maxDimension > 0 ? maxDimension : 1
}

function getObjectBaseSize(THREE, object) {
  const fromUserData = object.userData?.baseSize

  if (fromUserData && typeof fromUserData.x === 'number') {
    return new THREE.Vector3(fromUserData.x, fromUserData.y, fromUserData.z)
  }

  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  box.getSize(size)

  return new THREE.Vector3(
    Math.max(size.x, 1),
    Math.max(size.y, 1),
    Math.max(size.z, 1)
  )
}

function snapScaleAxisForObject(cellSize, minScaleCells, baseSize, scaleValue) {
  if (baseSize <= 0) {
    return scaleValue
  }

  const worldSize = baseSize * scaleValue
  const snappedWorldSize = Math.max(cellSize * minScaleCells, snapScaleValue(worldSize, cellSize))

  return snappedWorldSize / baseSize
}

function getActiveAxisScaleValue(scale, axis) {
  if (!axis) {
    return Math.max(scale.x, scale.y, scale.z)
  }

  const values = []

  if (axis.includes('X')) {
    values.push(scale.x)
  }

  if (axis.includes('Y')) {
    values.push(scale.y)
  }

  if (axis.includes('Z')) {
    values.push(scale.z)
  }

  if (!values.length) {
    return Math.max(scale.x, scale.y, scale.z)
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function snapUniformScaleForObject(THREE, object, scale, axis, gridConfig, minScaleCells) {
  const baseUniformSize = getObjectBaseUniformSize(THREE, object)
  const nextUniformScale = Math.max(0.01, getActiveAxisScaleValue(scale, axis))
  const nextWorldSize = baseUniformSize * nextUniformScale
  const snappedWorldSize = snapScaleValue(nextWorldSize, gridConfig.cellSize)
  const minWorldSize = gridConfig.cellSize * minScaleCells

  return Math.max(minWorldSize, snappedWorldSize) / baseUniformSize
}

function quantizeModelFootprintCells(rawCells) {
  if (rawCells <= 0) {
    return 0.5
  }

  return Math.max(0.5, Math.round(rawCells * 2) / 2)
}

function snapUniformModelScaleForObject(THREE, object, scale, axis, gridConfig) {
  const baseSize = getObjectBaseSize(THREE, object)
  const baseHorizontalSize = Math.max(baseSize.x, baseSize.z, 0.001)
  const nextUniformScale = Math.max(0.01, getActiveAxisScaleValue(scale, axis))
  const nextHorizontalWorldSize = baseHorizontalSize * nextUniformScale
  const rawFootprintCells = nextHorizontalWorldSize / gridConfig.cellSize
  const snappedFootprintCells = quantizeModelFootprintCells(rawFootprintCells)

  return (snappedFootprintCells * gridConfig.cellSize) / baseHorizontalSize
}

export function getObjectWorldSizeFromBase(THREE, object) {
  const baseSize = getObjectBaseSize(THREE, object)

  return new THREE.Vector3(
    baseSize.x * object.scale.x,
    baseSize.y * object.scale.y,
    baseSize.z * object.scale.z
  )
}

export function alignObjectCenterToGridCellByAxis(THREE, object, gridConfig, axisModes) {
  const min = getObjectBoundsMin(THREE, object)
  const max = getObjectBoundsMax(THREE, object)
  const [originX, originY, originZ] = gridConfig.origin
  const center = new THREE.Vector3(
    (min.x + max.x) * 0.5,
    (min.y + max.y) * 0.5,
    (min.z + max.z) * 0.5
  )
  const targetCenter = center.clone()

  if (axisModes?.x) {
    targetCenter.x = snapCellCenterValue(center.x, gridConfig.cellSize, originX)
  }

  if (axisModes?.y) {
    targetCenter.y = snapCellCenterValue(center.y, gridConfig.cellSize, originY)
  }

  if (axisModes?.z) {
    targetCenter.z = snapCellCenterValue(center.z, gridConfig.cellSize, originZ)
  }

  object.position.add(targetCenter.sub(center))
  object.updateMatrixWorld(true)

  return object.position.clone()
}

function alignModelFootprintToReservedCells(THREE, object, gridConfig) {
  const min = getObjectBoundsMin(THREE, object)
  const max = getObjectBoundsMax(THREE, object)
  const [originX, , originZ] = gridConfig.origin
  const sizeX = max.x - min.x
  const sizeZ = max.z - min.z
  const reserveCellsX = Math.max(1, Math.ceil(sizeX / gridConfig.cellSize))
  const reserveCellsZ = Math.max(1, Math.ceil(sizeZ / gridConfig.cellSize))
  const reserveSizeX = reserveCellsX * gridConfig.cellSize
  const reserveSizeZ = reserveCellsZ * gridConfig.cellSize
  const marginX = Math.max(0, (reserveSizeX - sizeX) * 0.5)
  const marginZ = Math.max(0, (reserveSizeZ - sizeZ) * 0.5)
  const reserveMinX = min.x - marginX
  const reserveMinZ = min.z - marginZ
  const snappedReserveMinX = snapValueToGrid(reserveMinX, gridConfig.cellSize, originX)
  const snappedReserveMinZ = snapValueToGrid(reserveMinZ, gridConfig.cellSize, originZ)
  const targetMinX = snappedReserveMinX + marginX
  const targetMinZ = snappedReserveMinZ + marginZ
  const offset = new THREE.Vector3(targetMinX - min.x, 0, targetMinZ - min.z)

  if (offset.x !== 0 || offset.z !== 0) {
    object.position.add(offset)
    object.updateMatrixWorld(true)
  }

  return object.position.clone()
}

export function getScaleProfileForObject(sceneObjects, objectId) {
  const objectState = sceneObjects.find((object) => object.id === objectId)

  return objectState?.scaleProfile ?? 'model'
}

export function createScaleInteractionContext(
  THREE,
  sceneObjects,
  gridConfig,
  objectId,
  object,
  axisAnchorModeInput
) {
  const defaultAxisAnchorMode = {
    x: 'min',
    y: 'min',
    z: 'min'
  }

  const axisAnchorMode = axisAnchorModeInput
    ? {
      x: axisAnchorModeValueOrDefault(axisAnchorModeInput.x),
      y: axisAnchorModeValueOrDefault(axisAnchorModeInput.y),
      z: axisAnchorModeValueOrDefault(axisAnchorModeInput.z)
    }
    : defaultAxisAnchorMode

  return {
    objectId,
    profile: getScaleProfileForObject(sceneObjects, objectId),
    anchorMin: getSnappedObjectBoundsMin(THREE, object, gridConfig),
    anchorMax: getSnappedObjectBoundsMax(THREE, object, gridConfig),
    axisAnchorMode,
    initialScale: object.scale.clone()
  }
}

export function snapObjectToGridByBounds(THREE, object, gridConfig, axisAnchorModeInput) {
  const modeOrNull = (mode) => {
    if (mode === 'max') {
      return 'max'
    }

    if (mode === 'min') {
      return 'min'
    }

    return null
  }

  const axisAnchorMode = axisAnchorModeInput
    ? {
      x: modeOrNull(axisAnchorModeInput.x) ?? 'min',
      y: modeOrNull(axisAnchorModeInput.y),
      z: modeOrNull(axisAnchorModeInput.z) ?? 'min'
    }
    : {
      x: 'min',
      y: 'min',
      z: 'min'
    }

  const anchorMin = getSnappedObjectBoundsMin(THREE, object, gridConfig)
  const anchorMax = getSnappedObjectBoundsMax(THREE, object, gridConfig)

  alignObjectBoundsToAnchorsByAxis(THREE, object, anchorMin, anchorMax, axisAnchorMode)

  if (object.userData?.scaleProfile === 'model') {
    alignModelFootprintToReservedCells(THREE, object, gridConfig)
  }

  return object.position.clone()
}

function axisAnchorModeValueOrDefault(mode) {
  return mode === 'max' ? 'max' : 'min'
}

export function applyModelScaleBehavior(THREE, object, context, axis, gridConfig, minScaleCells) {
  const snappedUniformScale = snapUniformModelScaleForObject(
    THREE,
    object,
    object.scale,
    axis,
    gridConfig
  )
  const nextScale = new THREE.Vector3(snappedUniformScale, snappedUniformScale, snappedUniformScale)
  object.scale.copy(nextScale)
  alignObjectBoundsToAnchorsByAxis(
    THREE,
    object,
    context.anchorMin,
    context.anchorMax,
    context.axisAnchorMode
  )

  alignModelFootprintToReservedCells(THREE, object, gridConfig)

  return nextScale
}

export function applyFloorScaleBehavior(THREE, object, context, gridConfig, minScaleCells) {
  const baseSize = getObjectBaseSize(THREE, object)
  const nextScale = object.scale.clone()

  nextScale.x = snapScaleAxisForObject(gridConfig.cellSize, minScaleCells, baseSize.x, nextScale.x)
  nextScale.y = context.initialScale.y
  nextScale.z = snapScaleAxisForObject(gridConfig.cellSize, minScaleCells, baseSize.z, nextScale.z)

  object.scale.copy(nextScale)
  alignObjectBoundsToAnchorsByAxis(
    THREE,
    object,
    context.anchorMin,
    context.anchorMax,
    {
      x: context.axisAnchorMode.x,
      y: null,
      z: context.axisAnchorMode.z
    }
  )

  return nextScale
}

export function applyShapeScaleBehavior(THREE, object, context, gridConfig, minScaleCells) {
  const baseSize = getObjectBaseSize(THREE, object)
  const nextScale = object.scale.clone()

  nextScale.x = snapScaleAxisForObject(gridConfig.cellSize, minScaleCells, baseSize.x, nextScale.x)
  nextScale.y = snapScaleAxisForObject(gridConfig.cellSize, minScaleCells, baseSize.y, nextScale.y)
  nextScale.z = snapScaleAxisForObject(gridConfig.cellSize, minScaleCells, baseSize.z, nextScale.z)

  object.scale.copy(nextScale)
  alignObjectBoundsToAnchorsByAxis(
    THREE,
    object,
    context.anchorMin,
    context.anchorMax,
    context.axisAnchorMode
  )

  return nextScale
}

export function updateGridTextureRepeat(gridTexture, gridConfig) {
  if (!gridTexture) {
    return
  }

  gridTexture.repeat.set(
    gridConfig.groundSize / gridConfig.cellSize,
    gridConfig.groundSize / gridConfig.cellSize
  )
  gridTexture.needsUpdate = true
}
