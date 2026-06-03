import {
  SCENE_KIND,
  SCENE_SCHEMA_VERSION,
  SHAPE_ASSET_VALUES,
  getDefaultAppearance,
  kindFromScaleProfile
} from './sceneContract.js'
import { normalizeAndValidateSceneDocument } from './sceneValidation.js'

function cloneAppearance(kind, appearanceInput) {
  const defaults = getDefaultAppearance(kind)

  if (!appearanceInput || typeof appearanceInput !== 'object') {
    return defaults
  }

  return {
    color: typeof appearanceInput.color === 'string' ? appearanceInput.color : defaults.color,
    texture: appearanceInput.texture && typeof appearanceInput.texture === 'object'
      ? {
          textureId: typeof appearanceInput.texture.textureId === 'string'
            ? appearanceInput.texture.textureId
            : null,
          uvScale: Array.isArray(appearanceInput.texture.uvScale)
            ? [...appearanceInput.texture.uvScale]
            : [1, 1],
          rotation: typeof appearanceInput.texture.rotation === 'number'
            ? appearanceInput.texture.rotation
            : 0,
          intensity: typeof appearanceInput.texture.intensity === 'number'
            ? appearanceInput.texture.intensity
            : 1
        }
      : null,
    materialOverrides: kind === SCENE_KIND.MODEL && Array.isArray(appearanceInput.materialOverrides)
      ? appearanceInput.materialOverrides
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
          materialName: typeof entry.materialName === 'string' ? entry.materialName : '',
          color: typeof entry.color === 'string' ? entry.color : null,
          textureId: typeof entry.textureId === 'string' ? entry.textureId : null
        }))
        .filter((entry) => entry.materialName.length > 0)
      : defaults.materialOverrides,
    finish: {
      roughness: typeof appearanceInput.finish?.roughness === 'number'
        ? appearanceInput.finish.roughness
        : defaults.finish.roughness,
      metalness: typeof appearanceInput.finish?.metalness === 'number'
        ? appearanceInput.finish.metalness
        : defaults.finish.metalness
    }
  }
}

function inferAssetRef(objectState, kind) {
  if (typeof objectState.assetRef === 'string' && objectState.assetRef.length) {
    return objectState.assetRef
  }

  if (kind === SCENE_KIND.SHAPE) {
    if (typeof objectState.shapeType === 'string' && SHAPE_ASSET_VALUES.includes(objectState.shapeType)) {
      return objectState.shapeType
    }

    return 'square'
  }

  if (kind === SCENE_KIND.FLOOR) {
    return 'floor-base'
  }

  if (kind === SCENE_KIND.MODEL) {
    return 'placeholder-model'
  }

  return null
}

function toSceneObjectDocument(objectState) {
  const kind = typeof objectState.kind === 'string'
    ? objectState.kind
    : kindFromScaleProfile(objectState.scaleProfile)

  const metadata = objectState?.metadata && typeof objectState.metadata === 'object'
    ? {
        title: typeof objectState.metadata.title === 'string' ? objectState.metadata.title : '',
        attribution: typeof objectState.metadata.attribution === 'string' ? objectState.metadata.attribution : '',
        licence: typeof objectState.metadata.licence === 'string' ? objectState.metadata.licence : '',
        sourceCategory: typeof objectState.metadata.sourceCategory === 'string'
          ? objectState.metadata.sourceCategory
          : 'model',
        tags: Array.isArray(objectState.metadata.tags)
          ? objectState.metadata.tags.filter((tag) => typeof tag === 'string' && tag.length)
          : [],
        isCandle: objectState.metadata.isCandle === true
      }
    : null
  const interaction = objectState?.interaction && typeof objectState.interaction === 'object'
    ? {
        type: typeof objectState.interaction.type === 'string' ? objectState.interaction.type : null,
        mediaKind: typeof objectState.interaction.mediaKind === 'string' ? objectState.interaction.mediaKind : null
      }
    : null

  return {
    id: objectState.id,
    kind,
    assetRef: inferAssetRef(objectState, kind),
    transform: {
      position: [...objectState.position],
      rotation: [...objectState.rotation],
      scale: [...objectState.scale]
    },
    appearance: cloneAppearance(kind, objectState.appearance),
    metadata,
    interaction
  }
}

export function buildSceneDocumentFromRuntime({
  sceneId = null,
  sceneName = 'Untitled Scene',
  lightingPresetId = null,
  sceneObjects,
  gridConfig
}) {
  const now = new Date().toISOString()

  const draftSceneDocument = {
    id: sceneId,
    name: sceneName,
    schemaVersion: SCENE_SCHEMA_VERSION,
    createdAt: null,
    updatedAt: now,
    editorSettings: {
      grid: {
        cellSize: gridConfig.cellSize,
        groundSize: gridConfig.groundSize,
        origin: Array.isArray(gridConfig.origin) ? [...gridConfig.origin] : [0, 0, 0]
      },
      lighting: {
        presetId: typeof lightingPresetId === 'string' && lightingPresetId.length ? lightingPresetId : null
      }
    },
    objects: sceneObjects.map((objectState) => toSceneObjectDocument(objectState))
  }

  return normalizeAndValidateSceneDocument(draftSceneDocument)
}
