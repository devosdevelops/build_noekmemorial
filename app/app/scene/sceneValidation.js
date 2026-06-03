import {
  SCENE_KIND,
  SCENE_KIND_VALUES,
  SCENE_INTERACTION_TYPE,
  SCENE_MEDIA_KIND_VALUES,
  SCENE_SCHEMA_VERSION,
  SHAPE_ASSET_VALUES,
  getDefaultAppearance
} from './sceneContract.js'

const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function asVector3(input, fallback) {
  if (!Array.isArray(input) || input.length !== 3 || input.some((value) => !isFiniteNumber(value))) {
    return [...fallback]
  }

  return [input[0], input[1], input[2]]
}

function asVector2(input, fallback) {
  if (!Array.isArray(input) || input.length !== 2 || input.some((value) => !isFiniteNumber(value))) {
    return [...fallback]
  }

  return [input[0], input[1]]
}

function normalizeMaterialOverrides(input) {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const materialName = typeof entry.materialName === 'string' ? entry.materialName.trim() : ''
      const color = typeof entry.color === 'string' && HEX_COLOR_PATTERN.test(entry.color)
        ? entry.color
        : null
      const textureId = typeof entry.textureId === 'string' && entry.textureId.trim().length
        ? entry.textureId.trim()
        : null

      return {
        materialName,
        color,
        textureId
      }
    })
    .filter((entry) => entry.materialName.length > 0)
}

function normalizeAppearance(kind, appearanceInput, warnings, objectId) {
  const defaults = getDefaultAppearance(kind)

  if (!appearanceInput || typeof appearanceInput !== 'object') {
    return defaults
  }

  const color = typeof appearanceInput.color === 'string' ? appearanceInput.color : defaults.color
  const nextColor = HEX_COLOR_PATTERN.test(color) ? color : defaults.color

  if (nextColor !== color) {
    warnings.push(`Object "${objectId}" has invalid color; default color applied.`)
  }

  const finishInput = appearanceInput.finish
  const roughness = isFiniteNumber(finishInput?.roughness) ? finishInput.roughness : defaults.finish.roughness
  const metalness = isFiniteNumber(finishInput?.metalness) ? finishInput.metalness : defaults.finish.metalness

  let texture = null
  let materialOverrides = defaults.materialOverrides

  if (appearanceInput.texture && typeof appearanceInput.texture === 'object') {
    if (kind === SCENE_KIND.FLOOR || kind === SCENE_KIND.SHAPE) {
      texture = {
        textureId:
          typeof appearanceInput.texture.textureId === 'string' && appearanceInput.texture.textureId.length
            ? appearanceInput.texture.textureId
            : null,
        uvScale: asVector2(appearanceInput.texture.uvScale, [1, 1]),
        rotation: isFiniteNumber(appearanceInput.texture.rotation)
          ? appearanceInput.texture.rotation
          : 0,
        intensity: isFiniteNumber(appearanceInput.texture.intensity)
          ? appearanceInput.texture.intensity
          : 1
      }
    } else {
      warnings.push(`Object "${objectId}" has texture on unsupported kind "${kind}"; ignored.`)
    }
  }

  if (appearanceInput.materialOverrides !== undefined) {
    if (kind === SCENE_KIND.MODEL) {
      materialOverrides = normalizeMaterialOverrides(appearanceInput.materialOverrides)
    } else {
      warnings.push(`Object "${objectId}" has materialOverrides on unsupported kind "${kind}"; ignored.`)
    }
  }

  return {
    color: nextColor,
    texture,
    materialOverrides,
    finish: {
      roughness,
      metalness
    }
  }
}

function normalizeMetadata(metadataInput) {
  if (!metadataInput || typeof metadataInput !== 'object') {
    return null
  }

  const title = typeof metadataInput.title === 'string' ? metadataInput.title.trim() : ''
  const attribution = typeof metadataInput.attribution === 'string' ? metadataInput.attribution.trim() : ''
  const licence = typeof metadataInput.licence === 'string' ? metadataInput.licence.trim() : ''
  const sourceCategory = typeof metadataInput.sourceCategory === 'string' ? metadataInput.sourceCategory.trim() : 'model'
  const tags = Array.isArray(metadataInput.tags)
    ? metadataInput.tags
      .filter((tag) => typeof tag === 'string' && tag.trim().length)
      .map((tag) => tag.trim())
    : []
  const isCandle = metadataInput.isCandle === true

  if (!title.length && !attribution.length && !licence.length && !tags.length && !isCandle) {
    return null
  }

  return {
    title,
    attribution,
    licence,
    sourceCategory,
    tags,
    isCandle
  }
}

function normalizeInteraction(interactionInput, warnings, objectId, kind) {
  if (!interactionInput || typeof interactionInput !== 'object') {
    return null
  }

  const interactionType = typeof interactionInput.type === 'string' ? interactionInput.type.trim() : ''

  if (!interactionType.length) {
    warnings.push(`Object "${objectId}" has interaction without a valid type; ignored.`)
    return null
  }

  if (interactionType !== SCENE_INTERACTION_TYPE.MEDIA_CAROUSEL) {
    return {
      type: interactionType
    }
  }

  const mediaKind = typeof interactionInput.mediaKind === 'string' ? interactionInput.mediaKind.trim() : ''

  if (!SCENE_MEDIA_KIND_VALUES.includes(mediaKind)) {
    warnings.push(`Object "${objectId}" has unsupported media kind "${mediaKind}"; media interaction ignored.`)
    return null
  }

  if (kind !== SCENE_KIND.MODEL) {
    warnings.push(`Object "${objectId}" uses media interaction on kind "${kind}"; expected "model".`)
  }

  return {
    type: SCENE_INTERACTION_TYPE.MEDIA_CAROUSEL,
    mediaKind
  }
}

function normalizeObject(input, index, errors, warnings, seenIds) {
  const objectId = typeof input?.id === 'string' && input.id.trim().length ? input.id.trim() : `obj-${index}`

  if (seenIds.has(objectId)) {
    errors.push(`Duplicate object id "${objectId}".`)
  }

  seenIds.add(objectId)

  const kind = typeof input?.kind === 'string' ? input.kind : SCENE_KIND.SHAPE

  if (!SCENE_KIND_VALUES.includes(kind)) {
    warnings.push(`Object "${objectId}" has unknown kind "${kind}"; it will be ignored by current renderer.`)
  }

  const transform = input?.transform ?? {}
  const positionFallback = kind === SCENE_KIND.FLOOR ? [0, -0.07, 0] : [0, 1, 0]

  const normalizedObject = {
    id: objectId,
    kind,
    assetRef: typeof input?.assetRef === 'string' ? input.assetRef : null,
    transform: {
      position: asVector3(transform.position, positionFallback),
      rotation: asVector3(transform.rotation, [0, 0, 0]),
      scale: asVector3(transform.scale, [1, 1, 1])
    },
    appearance: normalizeAppearance(kind, input?.appearance, warnings, objectId),
    metadata: normalizeMetadata(input?.metadata),
    interaction: normalizeInteraction(input?.interaction, warnings, objectId, kind)
  }

  if (kind === SCENE_KIND.SHAPE && normalizedObject.assetRef && !SHAPE_ASSET_VALUES.includes(normalizedObject.assetRef)) {
    warnings.push(`Object "${objectId}" uses unknown shape asset "${normalizedObject.assetRef}".`)
  }

  return normalizedObject
}

export function normalizeAndValidateSceneDocument(sceneDocument) {
  const errors = []
  const warnings = []

  if (!sceneDocument || typeof sceneDocument !== 'object') {
    return {
      isValid: false,
      errors: ['Scene document must be an object.'],
      warnings,
      sceneDocument: null
    }
  }

  const schemaVersion = isFiniteNumber(sceneDocument.schemaVersion)
    ? sceneDocument.schemaVersion
    : SCENE_SCHEMA_VERSION

  if (schemaVersion !== SCENE_SCHEMA_VERSION) {
    warnings.push(
      `Schema version ${schemaVersion} is not fully supported by this editor. Expected ${SCENE_SCHEMA_VERSION}.`
    )
  }

  const objectsInput = Array.isArray(sceneDocument.objects) ? sceneDocument.objects : []

  if (!Array.isArray(sceneDocument.objects)) {
    errors.push('Scene document must include an objects array.')
  }

  const seenIds = new Set()
  const objects = objectsInput.map((item, index) => normalizeObject(item, index, errors, warnings, seenIds))

  const normalizedSceneDocument = {
    id: typeof sceneDocument.id === 'string' ? sceneDocument.id : null,
    name: typeof sceneDocument.name === 'string' && sceneDocument.name.trim().length
      ? sceneDocument.name.trim()
      : 'Untitled Scene',
    schemaVersion,
    createdAt: typeof sceneDocument.createdAt === 'string' ? sceneDocument.createdAt : null,
    updatedAt: typeof sceneDocument.updatedAt === 'string' ? sceneDocument.updatedAt : null,
    editorSettings:
      sceneDocument.editorSettings && typeof sceneDocument.editorSettings === 'object'
        ? sceneDocument.editorSettings
        : null,
    objects
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sceneDocument: normalizedSceneDocument
  }
}
