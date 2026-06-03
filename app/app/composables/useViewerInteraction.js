export function useViewerInteraction() {
  const selectedElement = useState('viewer-selected-element', () => null)
  const pointerWorldPosition = useState('viewer-pointer-world-position', () => null)

  function setSelectedElement(element) {
    selectedElement.value = element && typeof element === 'object' ? element : null
  }

  function setPointerWorldPosition(position) {
    pointerWorldPosition.value = Array.isArray(position) && position.length === 3
      ? [position[0], position[1], position[2]]
      : null
  }

  function clearSelection() {
    selectedElement.value = null
    pointerWorldPosition.value = null
  }

  return {
    selectedElement,
    pointerWorldPosition,
    setSelectedElement,
    setPointerWorldPosition,
    clearSelection
  }
}
