import { computed } from 'vue'

export function useViewerUiState() {
  const isUiHidden = useState('viewer-ui-hidden', () => false)
  const activePanel = useState('viewer-active-panel', () => '')
  const activeMode = useState('viewer-active-mode', () => 'look-around')
  const isMusicOn = useState('viewer-music-on', () => false)

  const isPanelOpen = computed(() => activePanel.value.length > 0)

  function openPanel(panelName) {
    activePanel.value = panelName
    isUiHidden.value = false
  }

  function closePanel() {
    activePanel.value = ''
  }

  function toggleUi() {
    isUiHidden.value = !isUiHidden.value
  }

  function setMode(mode) {
    if (!['look-around', 'flythrough', 'vr'].includes(mode)) {
      return
    }

    activeMode.value = mode
  }

  function toggleMusic() {
    isMusicOn.value = !isMusicOn.value
  }

  function setMusicOn(nextValue) {
    isMusicOn.value = Boolean(nextValue)
  }

  return {
    isUiHidden,
    activePanel,
    activeMode,
    isMusicOn,
    isPanelOpen,
    openPanel,
    closePanel,
    toggleUi,
    setMode,
    toggleMusic,
    setMusicOn
  }
}
