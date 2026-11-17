<template>
  <li class="relative pl-7">
    <span
      class="absolute left-[3px] top-4 size-3 rounded-full border-2"
      :class="decided ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900 border-slate-500'"
      aria-hidden="true"
    />
    <button
      :id="`branch-${id}-header`"
      type="button"
      :data-testid="`branch-${id}`"
      :aria-expanded="open"
      :aria-controls="`branch-${id}-body`"
      class="flex w-full min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      @click="$emit('toggle')"
    >
      <span class="min-w-0 flex-1">
        <span class="block text-xs uppercase tracking-wide text-slate-400">{{ title }}</span>
        <span class="flex min-w-0 items-center gap-2">
          <span class="truncate font-medium text-slate-100">{{ answer }}</span>
          <span
            v-if="tag"
            class="shrink-0 rounded-full px-2 py-0.5 text-xs"
            :class="TAG_TONES[tag.tone]"
          >{{ tag.label }}</span>
        </span>
      </span>
      <UiIcon
        name="tabler:chevron-down"
        class="shrink-0 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>
    <div
      v-show="open"
      :id="`branch-${id}-body`"
      role="region"
      :aria-labelledby="`branch-${id}-header`"
      class="mt-2 rounded-xl bg-slate-800 p-3 sm:p-4"
    >
      <slot />
    </div>
  </li>
</template>

<script setup lang="ts">
import type { BranchTag } from '~/composables/useFilterTreeAnswers'

const TAG_TONES: Record<BranchTag['tone'], string> = {
  blue: 'bg-blue-500/20 text-blue-300',
  purple: 'bg-purple-500/20 text-purple-300',
  slate: 'bg-slate-500/20 text-slate-300',
}

defineProps<{
  id: string
  title: string
  answer: string
  open: boolean
  decided: boolean
  tag?: BranchTag | null
}>()

defineEmits<{ (e: 'toggle'): void }>()
</script>
