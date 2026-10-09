import { decideOpen, isPlainLeftClick, runAvailabilityCheck } from '~/utils/listingOpen'

interface OpenListingOptions {
  listingId: string | number | null | undefined
  url: string | null | undefined
  /** Called when the listing turned out to be sold or removed (the tab is already closed). */
  onUnavailable: () => void
  /** Only for clicks that are not on a real anchor: opens the url without the check (popup blocked or modified click). */
  fallback?: () => void
}

/**
 * Click-time sold check. The tab is opened synchronously inside the click so the browser keeps
 * the user activation, then pointed at the listing once the (time limited) check passed.
 */
export function useListingOpener() {
  const { checkAvailability } = useAvailabilityCheck()

  async function openListing(e: MouseEvent, { listingId, url, onUnavailable, fallback }: OpenListingOptions): Promise<void> {
    if (!url) return
    if (!isPlainLeftClick(e)) {
      // Modified click on a real anchor keeps native behaviour; non-anchor rows open directly
      fallback?.()
      return
    }

    const tab = window.open('', '_blank')
    if (!tab) {
      // Popup blocked: let a real anchor navigate, otherwise use the caller's fallback
      if (fallback) {
        e.preventDefault()
        fallback()
      }
      return
    }
    e.preventDefault()
    tab.opener = null

    const result = listingId
      ? await runAvailabilityCheck(() => checkAvailability(listingId, url))
      : 'available'
    if (decideOpen(true, result) === 'close-tab-mark-unavailable') {
      tab.close()
      onUnavailable()
    }
    else {
      tab.location.replace(url)
    }
  }

  return { openListing }
}
