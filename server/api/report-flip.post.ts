import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const reportId = (randomUUID().split('-')[0] ?? '').toUpperCase()

  const report = {
    reportId,
    timestamp: new Date().toISOString(),
    listing: body?.listing,
    profit: body?.profit,
    medianPrice: body?.medianPrice,
    recentSells: body?.recentSells,
    reason: body?.reason,
    suggestedSlug: body?.suggestedSlug,
  }

  // stdout only: the container root filesystem is read-only, the log collector keeps the reports
  console.log(`[FLIP-REPORT ${reportId}]`, JSON.stringify(report))

  return { reportId }
})
