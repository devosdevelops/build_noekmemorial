export function useViewerAuthGate() {
  const hasEnteredViewer = useState('viewer-has-entered', () => false)

  function enterViewer() {
    hasEnteredViewer.value = true
  }

  function resetViewerGate() {
    hasEnteredViewer.value = false
  }

  return {
    hasEnteredViewer,
    enterViewer,
    resetViewerGate
  }
}
