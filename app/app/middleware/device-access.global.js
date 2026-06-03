const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i

function isMobileVisitor() {
  if (import.meta.server) {
    const headers = useRequestHeaders(['user-agent', 'sec-ch-ua-mobile'])
    const secMobile = headers['sec-ch-ua-mobile']

    if (secMobile === '?1') {
      return true
    }

    const userAgent = headers['user-agent'] || ''
    return MOBILE_UA_REGEX.test(userAgent)
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  const mobileByUa = MOBILE_UA_REGEX.test(userAgent)

  if (mobileByUa) {
    return true
  }

  const isNarrowViewport = typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 1024px)').matches
    : false
  const hasTouch = typeof navigator !== 'undefined' ? navigator.maxTouchPoints > 0 : false

  return hasTouch && isNarrowViewport
}

export default defineNuxtRouteMiddleware((to) => {
  const isRestrictedArea = to.path.startsWith('/dashboard') || to.path.startsWith('/editor')

  if (!isRestrictedArea) {
    return
  }

  if (!isMobileVisitor()) {
    return
  }

  return navigateTo({
    path: '/unsupported-device',
    query: {
      target: to.fullPath
    }
  })
})
