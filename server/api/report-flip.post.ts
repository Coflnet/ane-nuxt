import { randomUUID } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), 'data', 'reports')

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const reportId = randomUUID().split('-')[0].toUpperCase()

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

  console.log(`[FLIP-REPORT ${reportId}]`, JSON.stringify(report))

  // Persist report to file
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await appendFile(
      join(DATA_DIR, 'flip-reports.jsonl'),
      JSON.stringify(report) + '\n',
    )
  }
  catch (err) {
    console.error('[FLIP-REPORT] Failed to persist report:', err)
  }

  return { reportId }
})
