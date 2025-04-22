<template>
  <div class="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
    <NuxtLink to="/filters"
      class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
      {{ $t('cancel') }}
    </NuxtLink>
    <UiButton :primary="true" type="submit" :proccessing="saving">
      {{ isNewFilter ? $t('createFilter') : $t('updateFilter') }}
    </UiButton>
  </div>

</template>

<script setup lang="ts">

defineProps({ isNewFilter: Boolean, saving: Boolean })
</script>
