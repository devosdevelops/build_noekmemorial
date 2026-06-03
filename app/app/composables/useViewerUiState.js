export function useViewerUiState() {
  const isUiHidden = useState('viewer-ui-hidden', () => false)
  const activePanel = useState('viewer-active-panel', () => '')
  const activeMode = useState('viewer-active-mode', () => 'look-around')

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

  return {
    isUiHidden,
    activePanel,
    activeMode,
    isPanelOpen,
    openPanel,
    closePanel,
    toggleUi,
    setMode
  }
}
