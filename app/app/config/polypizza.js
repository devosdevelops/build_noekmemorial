// Poly Pizza lists to load in the Models library panel.
// Add or remove list entries here to control which models appear.
// Each ID corresponds to a curated list on https://poly.pizza.
export const POLY_PIZZA_LIST_CATEGORY = {
  MODEL: 'model',
  CANDLE: 'candle',
  MESSAGE: 'message',
  IMAGE_VIDEO: 'image-video',
  AUDIO: 'audio'
}

export const POLY_PIZZA_LISTS = [
  // Core model sets
  { id: 'PG7JoV77qh', category: POLY_PIZZA_LIST_CATEGORY.MODEL },
  { id: 'lt1qOmzWvB', category: POLY_PIZZA_LIST_CATEGORY.MODEL },
  { id: 'JNxwMPvx48', category: POLY_PIZZA_LIST_CATEGORY.MODEL },
  { id: 'RggYIdGBDn', category: POLY_PIZZA_LIST_CATEGORY.MODEL },
  // Special memorial media object sets
  { id: 'hfe2dfH3fP', category: POLY_PIZZA_LIST_CATEGORY.MESSAGE },
  { id: 'zqhAh3tdip', category: POLY_PIZZA_LIST_CATEGORY.IMAGE_VIDEO },
  { id: 'lt1qOmzWvB', category: POLY_PIZZA_LIST_CATEGORY.CANDLE }, // candles
  { id: 'lWQZJLiyxP', category: POLY_PIZZA_LIST_CATEGORY.AUDIO }
]

// Backward-compatible export for existing callers that only need IDs.
export const POLY_PIZZA_LIST_IDS = POLY_PIZZA_LISTS.map((entry) => entry.id)
