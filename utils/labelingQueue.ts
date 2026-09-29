export type LabelAnswer = 'same_item' | 'same_model_other_variant' | 'different' | 'unsure'

export interface LabelingSide {
  platform: string
  listingId: string
  imageUrl: string
  listingUrl: string
}

export interface LabelingPair {
  pairId: string
  similarity?: number | null
  secondBest?: number | null
  decision?: string | null
  groupKey?: string | null
  clusterSeoId?: string | null
  textSeoId?: string | null
  createdAt?: string | null
  a: LabelingSide
  b: LabelingSide
}

export interface AnsweredPair {
  pair: LabelingPair
  label: LabelAnswer
}

/** Immutable queue state: `current` is on screen, `queue` are the pairs behind it. */
export interface LabelingQueueState {
  current: LabelingPair | null
  queue: LabelingPair[]
  history: AnsweredPair[]
}

/** Number of pairs (including the visible one) at or below which the next batch is fetched. */
export const REFILL_THRESHOLD = 3
export const BATCH_SIZE = 10
const HISTORY_LIMIT = 50

export function createQueueState(): LabelingQueueState {
  return { current: null, queue: [], history: [] }
}

/** Adds fetched pairs, skipping ones already on screen, queued or just answered. */
export function enqueue(state: LabelingQueueState, pairs: LabelingPair[]): LabelingQueueState {
  const known = new Set<string>()
  if (state.current) known.add(state.current.pairId)
  state.queue.forEach(p => known.add(p.pairId))
  state.history.forEach(h => known.add(h.pair.pairId))

  const fresh: LabelingPair[] = []
  for (const pair of pairs) {
    if (known.has(pair.pairId)) continue
    known.add(pair.pairId)
    fresh.push(pair)
  }

  const queue = [...state.queue, ...fresh]
  if (state.current) return { ...state, queue }
  return { ...state, current: queue[0] ?? null, queue: queue.slice(1) }
}

export function upcoming(state: LabelingQueueState): LabelingPair | null {
  return state.queue[0] ?? null
}

export function remaining(state: LabelingQueueState): number {
  return state.queue.length + (state.current ? 1 : 0)
}

export function needsRefill(state: LabelingQueueState, threshold = REFILL_THRESHOLD): boolean {
  return remaining(state) <= threshold
}

/** Records the answer for the visible pair and shows the next one at once. */
export function answer(state: LabelingQueueState, label: LabelAnswer): { state: LabelingQueueState, answered: AnsweredPair | null } {
  if (!state.current) return { state, answered: null }
  const answered = { pair: state.current, label }
  return {
    answered,
    state: {
      current: state.queue[0] ?? null,
      queue: state.queue.slice(1),
      history: [...state.history, answered].slice(-HISTORY_LIMIT),
    },
  }
}

/** Brings the last answered pair back; the pair that was on screen goes to the front of the queue. */
export function undo(state: LabelingQueueState): { state: LabelingQueueState, restored: AnsweredPair | null } {
  const restored = state.history[state.history.length - 1]
  if (!restored) return { state, restored: null }
  return {
    restored,
    state: {
      current: restored.pair,
      queue: state.current ? [state.current, ...state.queue] : state.queue,
      history: state.history.slice(0, -1),
    },
  }
}

/**
 * The answer could not be saved: the pair returns to the front of the queue so it is asked again.
 * A no-op when the pair was already undone (it is then on screen or queued again).
 */
export function rollback(state: LabelingQueueState, pairId: string): { state: LabelingQueueState, restored: boolean } {
  const entry = state.history.find(h => h.pair.pairId === pairId)
  if (!entry) return { state, restored: false }
  const history = state.history.filter(h => h.pair.pairId !== pairId)
  if (!state.current) return { state: { ...state, history, current: entry.pair }, restored: true }
  return { state: { ...state, history, queue: [entry.pair, ...state.queue] }, restored: true }
}
