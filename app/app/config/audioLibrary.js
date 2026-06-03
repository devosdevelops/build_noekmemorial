const AUDIO_CATEGORY = {
  AMBIENT: 'ambient',
  MUSIC: 'music'
}

const CATEGORY_FILES = {
  [AUDIO_CATEGORY.AMBIENT]: [
    'birds-marsh.mp3',
    'birds-rainforrest.mp3',
    'crowd.mp3',
    'fire-crackle.mp3',
    'fire-cracle-2.mp3',
    'grassfield.mp3',
    'nighttime-by-the-water.mp3',
    'soft rain.mp3',
    'stream.mp3',
    'suburbs.mp3',
    'vinyl crackle.mp3',
    'waves hitting shore.mp3',
    'wind-forrest.mp3'
  ],
  [AUDIO_CATEGORY.MUSIC]: [
    'celestial melody.mp3',
    'ceremonial music.mp3',
    'guitar.mp3',
    'piano.mp3',
    'wandering.mp3'
  ]
}

function toTrackLabel(filename) {
  return String(filename)
    .replace(/\.mp3$/i, '')
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function toTrackUrl(categoryId, filename) {
  return `/audio/${encodeURIComponent(categoryId)}/${encodeURIComponent(filename)}`
}

export const AUDIO_TRACKS = Object.entries(CATEGORY_FILES).flatMap(([categoryId, filenames]) => {
  return filenames.map((filename) => ({
    id: `${categoryId}:${filename}`,
    categoryId,
    filename,
    label: toTrackLabel(filename),
    url: toTrackUrl(categoryId, filename)
  }))
})

export const AUDIO_CATEGORIES = [
  { id: AUDIO_CATEGORY.AMBIENT, label: 'Ambient' },
  { id: AUDIO_CATEGORY.MUSIC, label: 'Muziek' }
]
