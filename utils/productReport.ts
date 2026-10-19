import type { IssueType, ProductIssueReport } from '~/src/api-client/types.gen'

/** Report types the generated client does not know yet (WrongMatch, SameProductAs). */
export type ReportType = IssueType | 'WrongMatch' | 'SameProductAs'

export const MAX_REPORT_COMMENT = 500

/**
 * Accepts a pasted ane.deals product URL (`/product/<id>`, optionally behind a locale prefix and
 * followed by a query/hash) or a bare product id, and returns the product id. Null when nothing usable.
 */
export function extractProductId(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  const fromPath = (path: string) => /(?:^|\/)product\/([^/?#\s]+)/.exec(path)?.[1] ?? null
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith('/') || value.includes('/')) {
    let path = value
    try {
      path = new URL(value, 'https://ane.deals').pathname
    }
    catch {
      // fall through with the raw value
    }
    const id = fromPath(path)
    if (!id) return null
    try {
      return decodeURIComponent(id)
    }
    catch {
      return id
    }
  }
  return /^[^\s?#]+$/.test(value) ? value : null
}

export interface ReportBodyInput {
  type: ReportType
  listingId?: string | null
  productId?: string | null
  otherProductId?: string | null
  comment?: string | null
  suggestion?: string | null
}

/** Builds the JSON body; the comment is sent as `description`, trimmed and capped. */
export function buildReportBody(input: ReportBodyInput): ProductIssueReport & Record<string, unknown> {
  const description = input.comment?.trim().slice(0, MAX_REPORT_COMMENT) || undefined
  const body: ProductIssueReport & Record<string, unknown> = { type: input.type as IssueType, description }
  if (input.suggestion) body.suggestion = input.suggestion
  if (input.listingId) body.listingId = input.listingId
  if (input.productId) body.productId = input.productId
  if (input.type === 'SameProductAs' && input.otherProductId) body.otherProductId = input.otherProductId
  return body
}

/** Maps a failed report request to a message for the user. */
export function reportErrorMessage(status: number): string {
  if (status === 429) return 'You have sent too many reports. Please try again later.'
  if (status === 400) return 'Please check the other product link or id.'
  if (status === 401) return 'Please log in to send a report.'
  return 'The report could not be sent. Please try again.'
}
