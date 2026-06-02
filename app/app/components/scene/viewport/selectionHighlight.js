export function createSelectionHighlightManager(
  THREE,
  {
    transitionMs = 300,
    targetIntensity = 0.35,
    highlightHex = '#f3e6a2'
  } = {}
) {
  const emissiveCache = new WeakMap()
  const activeEmissiveMaterials = new Set()
  const emissiveTransitions = new Map()
  const highlightColor = new THREE.Color(highlightHex)
  let emissiveAnimationFrame = 0

  function stopAnimation() {
    if (!emissiveAnimationFrame) {
      return
    }

    cancelAnimationFrame(emissiveAnimationFrame)
    emissiveAnimationFrame = 0
    emissiveTransitions.clear()
  }

  function runEmissiveTransition(transitionsByMaterial) {
    stopAnimation()

    transitionsByMaterial.forEach((target, material) => {
      if (!('emissive' in material)) {
        return
      }

      const cached = emissiveCache.get(material)

      if (!cached) {
        return
      }

      const fromColor = material.emissive.clone()
      const toColor = target.toHighlight ? highlightColor.clone() : cached.color.clone()
      const fromIntensity = 'emissiveIntensity' in material ? material.emissiveIntensity : cached.intensity
      const toIntensity = target.toHighlight ? targetIntensity : cached.intensity

      emissiveTransitions.set(material, { fromColor, toColor, fromIntensity, toIntensity })
    })

    if (!emissiveTransitions.size) {
      return
    }

    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / transitionMs, 1)
      const eased = progress * progress * (3 - 2 * progress)

      emissiveTransitions.forEach((transition, material) => {
        if (!('emissive' in material)) {
          return
        }

        material.emissive.copy(transition.fromColor).lerp(transition.toColor, eased)

        if ('emissiveIntensity' in material) {
          material.emissiveIntensity = THREE.MathUtils.lerp(
            transition.fromIntensity,
            transition.toIntensity,
            eased
          )
        }
      })

      if (progress < 1) {
        emissiveAnimationFrame = requestAnimationFrame(tick)
        return
      }

      emissiveAnimationFrame = 0
      emissiveTransitions.clear()
    }

    emissiveAnimationFrame = requestAnimationFrame(tick)
  }

  function clearEmissiveHighlight() {
    if (!activeEmissiveMaterials.size) {
      return
    }

    const transitionsByMaterial = new Map()
    activeEmissiveMaterials.forEach((material) => {
      transitionsByMaterial.set(material, { toHighlight: false })
    })

    runEmissiveTransition(transitionsByMaterial)
    activeEmissiveMaterials.clear()
  }

  function applyEmissiveHighlight(target) {
    const previousMaterials = new Set(activeEmissiveMaterials)
    const nextMaterials = new Set()

    if (target) {
      target.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
          return
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material]

        materials.forEach((material) => {
          if (!('emissive' in material)) {
            return
          }

          if (!emissiveCache.has(material)) {
            emissiveCache.set(material, {
              color: material.emissive.clone(),
              intensity: 'emissiveIntensity' in material ? material.emissiveIntensity : 1
            })
          }

          nextMaterials.add(material)
        })
      })
    }

    const transitionsByMaterial = new Map()

    previousMaterials.forEach((material) => {
      transitionsByMaterial.set(material, { toHighlight: false })
    })

    nextMaterials.forEach((material) => {
      transitionsByMaterial.set(material, { toHighlight: true })
    })

    activeEmissiveMaterials.clear()
    nextMaterials.forEach((material) => activeEmissiveMaterials.add(material))

    if (!transitionsByMaterial.size) {
      return
    }

    runEmissiveTransition(transitionsByMaterial)
  }

  function dispose() {
    clearEmissiveHighlight()
    stopAnimation()
  }

  return {
    applyEmissiveHighlight,
    clearEmissiveHighlight,
    dispose
  }
}
