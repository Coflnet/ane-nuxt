import type { LabelAnswer, ReviewMode } from './labelingQueue'

/**
 * Sends answers in the background. Answers for the same pair are chained so that an answer
 * given after "Undo" is always stored after the first one and overwrites it.
 */
export function createLabelSender(post: (pairId: string, label: LabelAnswer, reviewMode?: ReviewMode) => Promise<void>) {
  const chains = new Map<string, Promise<unknown>>()
  return function send(pairId: string, label: LabelAnswer, reviewMode?: ReviewMode): Promise<void> {
    const previous = chains.get(pairId) ?? Promise.resolve()
    const run = previous.catch(() => {}).then(() => post(pairId, label, reviewMode))
    const tail = run.catch(() => {})
    chains.set(pairId, tail)
    void tail.then(() => {
      if (chains.get(pairId) === tail) chains.delete(pairId)
    })
    return run
  }
}
