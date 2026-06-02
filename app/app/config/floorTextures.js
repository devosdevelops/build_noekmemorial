import woodFloor014Base from '../assets/textures/Wood_Floor_014_SD/Wood_Floor_014_basecolor.png'
import woodFloor014Normal from '../assets/textures/Wood_Floor_014_SD/Wood_Floor_014_normal.png'
import woodFloor014Roughness from '../assets/textures/Wood_Floor_014_SD/Wood_Floor_014_roughness.png'
import woodFloor016Base from '../assets/textures/Wood Floor_016_SD/Wood_Floor_016_basecolor.png'
import woodFloor016Normal from '../assets/textures/Wood Floor_016_SD/Wood_Floor_016_normal.png'
import woodFloor016Roughness from '../assets/textures/Wood Floor_016_SD/Wood_Floor_016_roughness.png'
import marbleWhite006Base from '../assets/textures/Marble_White_006_SD/Marble_White_006_basecolor.jpg'
import marbleWhite006Normal from '../assets/textures/Marble_White_006_SD/Marble_White_006_normal.jpg'
import marbleWhite006Roughness from '../assets/textures/Marble_White_006_SD/Marble_White_006_roughness.jpg'
import tatami001Base from '../assets/textures/Tatami_001_SD/Tatami_001_basecolor.jpg'
import tatami001Normal from '../assets/textures/Tatami_001_SD/Tatami_001_normal.jpg'
import tatami001Roughness from '../assets/textures/Tatami_001_SD/Tatami_001_roughness.jpg'
import porcelainMosaic001Base from '../assets/textures/Tiles_Matte_Porcelain_Mosaic_001_SD/Tiles_Matte_Porcelain_Mosaic_001_basecolor.png'
import porcelainMosaic001Normal from '../assets/textures/Tiles_Matte_Porcelain_Mosaic_001_SD/Tiles_Matte_Porcelain_Mosaic_001_normal.png'
import porcelainMosaic001Roughness from '../assets/textures/Tiles_Matte_Porcelain_Mosaic_001_SD/Tiles_Matte_Porcelain_Mosaic_001_roughness.png'
import fabricRug009Base from '../assets/textures/Fabric_Rug_009_SD/Fabric_Rug_009_basecolor.png'
import fabricRug009Normal from '../assets/textures/Fabric_Rug_009_SD/Fabric_Rug_009_normal.png'
import fabricRug009Roughness from '../assets/textures/Fabric_Rug_009_SD/Fabric_Rug_009_roughness.png'

export const FLOOR_TEXTURE_OPTIONS = [
  {
    id: 'wood-floor-014',
    label: 'Hout Licht',
    previewUrl: woodFloor014Base,
    maps: {
      colorUrl: woodFloor014Base,
      normalUrl: woodFloor014Normal,
      roughnessUrl: woodFloor014Roughness
    },
    defaultTexture: {
      textureId: 'wood-floor-014',
      uvScale: [3, 3],
      rotation: 0,
      intensity: 1
    }
  },
  {
    id: 'wood-floor-016',
    label: 'Hout Donker',
    previewUrl: woodFloor016Base,
    maps: {
      colorUrl: woodFloor016Base,
      normalUrl: woodFloor016Normal,
      roughnessUrl: woodFloor016Roughness
    },
    defaultTexture: {
      textureId: 'wood-floor-016',
      uvScale: [3, 3],
      rotation: 0,
      intensity: 1
    }
  },
  {
    id: 'marble-white-006',
    label: 'Marmer Wit',
    previewUrl: marbleWhite006Base,
    maps: {
      colorUrl: marbleWhite006Base,
      normalUrl: marbleWhite006Normal,
      roughnessUrl: marbleWhite006Roughness
    },
    defaultTexture: {
      textureId: 'marble-white-006',
      uvScale: [2, 2],
      rotation: 0,
      intensity: 1
    }
  },
  {
    id: 'tatami-001',
    label: 'Tatami',
    previewUrl: tatami001Base,
    maps: {
      colorUrl: tatami001Base,
      normalUrl: tatami001Normal,
      roughnessUrl: tatami001Roughness
    },
    defaultTexture: {
      textureId: 'tatami-001',
      uvScale: [2, 2],
      rotation: 0,
      intensity: 1
    }
  },
  {
    id: 'porcelain-mosaic-001',
    label: 'Porselein Mozaiek',
    previewUrl: porcelainMosaic001Base,
    maps: {
      colorUrl: porcelainMosaic001Base,
      normalUrl: porcelainMosaic001Normal,
      roughnessUrl: porcelainMosaic001Roughness
    },
    defaultTexture: {
      textureId: 'porcelain-mosaic-001',
      uvScale: [4, 4],
      rotation: 0,
      intensity: 1
    }
  },
  {
    id: 'fabric-rug-009',
    label: 'Tapijt',
    previewUrl: fabricRug009Base,
    maps: {
      colorUrl: fabricRug009Base,
      normalUrl: fabricRug009Normal,
      roughnessUrl: fabricRug009Roughness
    },
    defaultTexture: {
      textureId: 'fabric-rug-009',
      uvScale: [2, 2],
      rotation: 0,
      intensity: 1
    }
  }
]

export const FLOOR_TEXTURE_BY_ID = Object.fromEntries(
  FLOOR_TEXTURE_OPTIONS.map((option) => [option.id, option])
)