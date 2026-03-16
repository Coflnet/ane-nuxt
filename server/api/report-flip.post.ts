import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const reportId = randomUUID().split('-')[0].toUpperCase()

  console.log(`[FLIP-REPORT ${reportId}]`, JSON.stringify({
    reportId,
    timestamp: new Date().toISOString(),
    listing: body?.listing,
    profit: body?.profit,
    medianPrice: body?.medianPrice,
    recentSells: body?.recentSells,
    reason: body?.reason,
  }))

  return { reportId }
})
