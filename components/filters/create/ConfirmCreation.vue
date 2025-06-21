<template>
  <div class="items-center justify-end space-x-4 pt-6 border-t border-slate-700 mt-6 hidden md:flex">
    <NuxtLink
      to="/filters"
      aria-label="Cancel Filter Creation"
      class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors mt-4 md:mt-0"
    >
      {{ $t('cancel') }}
    </NuxtLink>
    <UiButton
      :primary="true"
      aria-label="Save Filter"
      type="submit"
      :proccessing="saving"
    >
      {{ isNewFilter ? $t('createFilter') : $t('updateFilter') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
defineProps({ isNewFilter: Boolean, saving: Boolean })
</script>

