import type { LabelAnswer } from './labelingQueue'

export type LabelingShortcut = { type: 'answer', label: LabelAnswer } | { type: 'undo' }

export const ANSWER_KEYS: Record<string, LabelAnswer> = {
  1: 'same_item',
  2: 'same_model_other_variant',
  3: 'different',
  4: 'unsure',
}

export interface ShortcutEventLike {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  repeat?: boolean
  target?: { tagName?: string, isContentEditable?: boolean } | null
}

const TEXT_TARGETS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function isTextTarget(target: ShortcutEventLike['target']): boolean {
  if (!target) return false
  return !!target.isContentEditable || TEXT_TARGETS.has((target.tagName ?? '').toUpperCase())
}

/** Maps a key press to a labeling action; null while typing in a field or with modifier keys. */
export function shortcutFor(event: ShortcutEventLike): LabelingShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return null
  if (isTextTarget(event.target)) return null
  if (event.key === 'z' || event.key === 'Z' || event.key === 'Backspace') return { type: 'undo' }
  const label = ANSWER_KEYS[event.key]
  return label ? { type: 'answer', label } : null
}
