import { useState } from '#imports'
import { useLabelingApi } from '~/composables/useLabelingApi'
import { useUserStore } from '~/stores/user'

/**
 * Whether the signed-in account may label photo pairs. Resolved in the browser only, because
 * some routes are cached on the server and the answer depends on the visitor.
 */
export function useLabelingAccess() {
  const canLabel = useState<boolean>('labeling-can-label', () => false)
  const userStore = useUserStore()

  async function load() {
    if (!userStore.isLoggedIn || !userStore.token) {
      canLabel.value = false
      return
    }
    try {
      canLabel.value = (await useLabelingApi().me()).canLabel
    }
    catch {
      canLabel.value = false
    }
  }

  return { canLabel, load }
}
