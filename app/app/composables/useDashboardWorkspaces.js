import { ref } from 'vue'
import { useSupabaseClient } from './useSupabaseClient'

const workspaces = ref([])
const isLoading = ref(false)
const loadError = ref('')
let loadPromise = null

function mapWorkspace(workspace, currentUserId = '') {
  const deceasedName = [workspace.deceased_first_name, workspace.deceased_last_name].filter(Boolean).join(' ').trim()

  return {
    id: workspace.id,
    title: workspace.name || (deceasedName ? `In liefdevolle herinnering aan ${deceasedName}` : 'Onbenoemde herdenkingsruimte'),
    deceasedName,
    slug: workspace.slug,
    visibility: workspace.visibility,
    approvalMode: workspace.approval_mode,
    ownerId: workspace.owner_id,
    isOwned: Boolean(currentUserId) && workspace.owner_id === currentUserId,
    lastUpdated: workspace.updated_at ? new Date(workspace.updated_at) : new Date(),
    pendingCount: 0
  }
}

export function useDashboardWorkspaces() {
  const supabase = useSupabaseClient()

  function mapWorkspaceLoadError(error) {
    const rawMessage = error?.message || ''

    if (/infinite recursion detected in policy/i.test(rawMessage)) {
      return 'Er is een toegangsprobleem in de databankconfiguratie. Contacteer de beheerder of probeer opnieuw nadat de policy-patch is toegepast.'
    }

    return rawMessage || 'Kon dashboardruimtes niet laden.'
  }

  async function loadWorkspaces({ force = false } = {}) {
    if (loadPromise && !force) return loadPromise

    loadPromise = (async () => {
      isLoading.value = true
      loadError.value = ''

      const { data, error } = await supabase
        .from('app_workspaces')
        .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, updated_at')
        .order('updated_at', { ascending: false })

      if (error) {
        throw error
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const currentUserId = sessionData?.session?.user?.id || ''

      workspaces.value = Array.isArray(data)
        ? data.map((workspace) => mapWorkspace(workspace, currentUserId))
        : []
      return workspaces.value
    })()
      .catch((error) => {
        loadError.value = mapWorkspaceLoadError(error)
        workspaces.value = []
        return workspaces.value
      })
      .finally(() => {
        isLoading.value = false
        loadPromise = null
      })

    return loadPromise
  }

  return {
    workspaces,
    isLoading,
    loadError,
    loadWorkspaces
  }
}