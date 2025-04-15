<template>
  <div>
    <label for="marketplace" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {{ $t('market') }}
    </label>
    <select id="marketplace" :v-model="modelValue"
      class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      required>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const modelValue = defineModel();

const options = [
  { value: 'all', label: t('allMarket') },
  { value: 'Ebay', label: 'eBay' },
  { value: 'kleinanzeigen', label: 'eBay Kleinanzeigen' },
]
</script>
