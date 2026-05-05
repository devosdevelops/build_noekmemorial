export const SCENE_SCHEMA_VERSION = 1

export const SCENE_KIND = {
  FLOOR: 'floor',
  SHAPE: 'shape',
  MODEL: 'model',
  LIGHT: 'light',
  AUDIO: 'audio'
}

export const SCENE_KIND_VALUES = Object.values(SCENE_KIND)

export const SHAPE_ASSET_VALUES = ['square', 'sphere', 'cylinder', 'cone']

export const SHAPE_COLOR_BY_TYPE = {
  square: '#b4c9a6',
  sphere: '#dfc08f',
  cylinder: '#9eb8c8',
  cone: '#d8a59f'
}

const DEFAULT_COLOR_BY_KIND = {
  [SCENE_KIND.FLOOR]: '#7a8fa0',
  [SCENE_KIND.SHAPE]: '#b4c9a6',
  [SCENE_KIND.MODEL]: '#f5b8ca',
  [SCENE_KIND.LIGHT]: '#fff5cc',
  [SCENE_KIND.AUDIO]: '#9aa09a'
}

export function getDefaultColorForKind(kind) {
  return DEFAULT_COLOR_BY_KIND[kind] ?? '#b4c9a6'
}

export function getDefaultAppearance(kind) {
  return {
    color: getDefaultColorForKind(kind),
    texture: null,
    materialOverrides: kind === SCENE_KIND.MODEL ? [] : null,
    finish: {
      roughness: 0.56,
      metalness: 0.03
    }
  }
}

export function scaleProfileFromKind(kind) {
  if (kind === SCENE_KIND.FLOOR) {
    return 'floor'
  }

  if (kind === SCENE_KIND.SHAPE) {
    return 'shape'
  }

  return 'model'
}

export function kindFromScaleProfile(scaleProfile) {
  if (scaleProfile === 'floor') {
    return SCENE_KIND.FLOOR
  }

  if (scaleProfile === 'shape') {
    return SCENE_KIND.SHAPE
  }

  return SCENE_KIND.MODEL
}
