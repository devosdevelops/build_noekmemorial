import { computed } from 'vue'
import { useAuth } from './useAuth'

const GUEST_NAME_STORAGE_KEY = 'viewer_guest_name'

export function useViewerSession() {
  const { session, appUser, init, signOut } = useAuth()
  const guestName = useState('viewer-guest-name', () => '')

  const isAuthenticated = computed(() => Boolean(session.value?.user))
  const isGuest = computed(() => !isAuthenticated.value)
  const canPostMedia = computed(() => isAuthenticated.value)

  const accountLabel = computed(() => {
    if (!isAuthenticated.value) {
      return ''
    }

    const firstName = appUser.value?.first_name || ''
    const lastName = appUser.value?.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()

    return fullName || appUser.value?.email || session.value?.user?.email || 'Ingelogde gebruiker'
  })

  const effectiveDisplayName = computed(() => {
    if (isAuthenticated.value) {
      return accountLabel.value
    }

    return guestName.value || 'Gast'
  })

  async function initializeAuth() {
    await init()

    if (process.client && !guestName.value) {
      const cachedGuestName = window.localStorage.getItem(GUEST_NAME_STORAGE_KEY)
      if (cachedGuestName) {
        guestName.value = cachedGuestName
      }
    }
  }

  function setGuestName(name) {
    const nextName = String(name || '').trim()
    guestName.value = nextName

    if (process.client) {
      if (nextName.length) {
        window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, nextName)
      } else {
        window.localStorage.removeItem(GUEST_NAME_STORAGE_KEY)
      }
    }

    return nextName
  }

  return {
    session,
    appUser,
    isAuthenticated,
    isGuest,
    canPostMedia,
    guestName,
    accountLabel,
    effectiveDisplayName,
    initializeAuth,
    setGuestName,
    signOut
  }
}
