<template>
  <thead>
    <tr class="border-b border-slate-200 dark:border-slate-700">
      <th v-for="(header, i) in headers" :key="i"
        class="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">{{ header }}</th>
    </tr>
  </thead>
</template>

<script setup lang="ts">
const { t } = useI18n()
const headers = [t('auction'), t('filter'), t('price'), t('matched'), t('actions')]
</script>
