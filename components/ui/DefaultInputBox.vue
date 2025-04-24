<template>
  <div class="flex flex-wrap items-center gap-2 rounded-lg border  "
    :class="accent ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-700 border-slate-600'">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({ accent: Boolean })

</script>
