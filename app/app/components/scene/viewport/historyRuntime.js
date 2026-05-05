export function createHistoryRuntime({
  sceneObjects,
  meshById,
  applySceneObjectState,
  getActiveTool,
  getSelectedObjectId,
  setSelectedObjectId,
  syncTransformControlsState,
  maxHistoryEntries
}) {
  const historyState = {
    undoStack: [],
    redoStack: [],
    activeSnapshot: null
  }

  const initialObjectStateById = new Map()

  function cloneSceneObject(objectState) {
    return {
      id: objectState.id,
      scaleProfile: objectState.scaleProfile,
      position: [...objectState.position],
      rotation: [...objectState.rotation],
      scale: [...objectState.scale]
    }
  }

  function createSceneSnapshot() {
    return sceneObjects.map((objectState) => cloneSceneObject(objectState))
  }

  function captureInitialObjectState() {
    initialObjectStateById.clear()
    sceneObjects.forEach((objectState) => {
      initialObjectStateById.set(objectState.id, cloneSceneObject(objectState))
    })
  }

  function areSnapshotsEqual(firstSnapshot, secondSnapshot) {
    return JSON.stringify(firstSnapshot) === JSON.stringify(secondSnapshot)
  }

  function trimHistoryStack(stack) {
    if (stack.length <= maxHistoryEntries) {
      return
    }

    stack.splice(0, stack.length - maxHistoryEntries)
  }

  function applySceneSnapshot(snapshot) {
    const clonedSnapshot = snapshot.map((objectState) => cloneSceneObject(objectState))
    sceneObjects.splice(0, sceneObjects.length, ...clonedSnapshot)

    sceneObjects.forEach((objectState) => {
      applySceneObjectState(meshById, objectState)
    })

    const selectedObjectId = getSelectedObjectId()
    if (selectedObjectId && !sceneObjects.some((objectState) => objectState.id === selectedObjectId)) {
      setSelectedObjectId(null)
      return
    }

    syncTransformControlsState()
  }

  function beginHistoryCapture() {
    historyState.activeSnapshot = createSceneSnapshot()
  }

  function commitHistoryCapture() {
    if (!historyState.activeSnapshot) {
      return
    }

    const beforeSnapshot = historyState.activeSnapshot
    historyState.activeSnapshot = null

    const afterSnapshot = createSceneSnapshot()

    if (areSnapshotsEqual(beforeSnapshot, afterSnapshot)) {
      return
    }

    historyState.undoStack.push(beforeSnapshot)
    trimHistoryStack(historyState.undoStack)
    historyState.redoStack.length = 0
  }

  function runHistoryAction(actionType) {
    if (actionType === 'undo') {
      const previousSnapshot = historyState.undoStack.pop()

      if (!previousSnapshot) {
        return
      }

      historyState.redoStack.push(createSceneSnapshot())
      trimHistoryStack(historyState.redoStack)
      applySceneSnapshot(previousSnapshot)
      return
    }

    if (actionType === 'redo') {
      const nextSnapshot = historyState.redoStack.pop()

      if (!nextSnapshot) {
        return
      }

      historyState.undoStack.push(createSceneSnapshot())
      trimHistoryStack(historyState.undoStack)
      applySceneSnapshot(nextSnapshot)
      return
    }

    if (actionType !== 'reset') {
      return
    }

    const selectedObjectId = getSelectedObjectId()

    if (!selectedObjectId) {
      return
    }

    const targetObject = sceneObjects.find((objectState) => objectState.id === selectedObjectId)
    const initialObjectState = initialObjectStateById.get(selectedObjectId)

    if (!targetObject || !initialObjectState) {
      return
    }

    const beforeSnapshot = createSceneSnapshot()
    const activeTool = getActiveTool()

    if (activeTool === 'move') {
      targetObject.position = [...initialObjectState.position]
    } else if (activeTool === 'rotate') {
      targetObject.rotation = [...initialObjectState.rotation]
    } else if (activeTool === 'scale') {
      targetObject.scale = [...initialObjectState.scale]
    } else {
      return
    }

    applySceneObjectState(meshById, targetObject)
    syncTransformControlsState()

    const afterSnapshot = createSceneSnapshot()

    if (areSnapshotsEqual(beforeSnapshot, afterSnapshot)) {
      return
    }

    historyState.undoStack.push(beforeSnapshot)
    trimHistoryStack(historyState.undoStack)
    historyState.redoStack.length = 0
  }

  function clearHistory() {
    historyState.undoStack.length = 0
    historyState.redoStack.length = 0
    historyState.activeSnapshot = null
  }

  return {
    beginHistoryCapture,
    commitHistoryCapture,
    runHistoryAction,
    captureInitialObjectState,
    clearHistory
  }
}