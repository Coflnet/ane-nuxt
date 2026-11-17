<template>
  <ol
    class="relative space-y-3 before:absolute before:left-[8px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700 before:content-['']"
    :aria-label="$t('filterTree.treeLabel')"
  >
    <slot />
  </ol>
</template>
