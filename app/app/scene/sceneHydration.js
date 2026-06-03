import { SCENE_KIND, SHAPE_ASSET_VALUES, scaleProfileFromKind } from './sceneContract.js'
import { normalizeAndValidateSceneDocument } from './sceneValidation.js'

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

function toRuntimeObject(sceneObject, index) {
  const kind = sceneObject.kind
  const assetRef = typeof sceneObject.assetRef === 'string' && sceneObject.assetRef.length
    ? sceneObject.assetRef
    : null

  const runtimeObject = {
    id: sceneObject.id || `${kind}-${index}`,
    kind,
    assetRef,
    scaleProfile: scaleProfileFromKind(kind),
    position: asVector3(sceneObject.transform?.position, kind === SCENE_KIND.FLOOR ? [0, -0.07, 0] : [0, 1, 0]),
    rotation: asVector3(sceneObject.transform?.rotation, [0, 0, 0]),
    scale: asVector3(sceneObject.transform?.scale, [1, 1, 1]),
    appearance: sceneObject.appearance ?? null,
    metadata: sceneObject.metadata ?? null,
    interaction: sceneObject.interaction ?? null
  }

  if (kind === SCENE_KIND.SHAPE && !SHAPE_ASSET_VALUES.includes(runtimeObject.assetRef)) {
    runtimeObject.assetRef = 'square'
  }

  return runtimeObject
}

export function hydrateRuntimeSceneState(sceneDocument) {
  const normalized = normalizeAndValidateSceneDocument(sceneDocument)

  if (!normalized.isValid || !normalized.sceneDocument) {
    return {
      isValid: false,
      errors: normalized.errors,
      warnings: normalized.warnings,
      sceneDocument: normalized.sceneDocument,
      runtimeObjects: []
    }
  }

  const runtimeObjects = normalized.sceneDocument.objects.map((objectState, index) => toRuntimeObject(objectState, index))

  return {
    isValid: true,
    errors: normalized.errors,
    warnings: normalized.warnings,
    sceneDocument: normalized.sceneDocument,
    runtimeObjects
  }
}
