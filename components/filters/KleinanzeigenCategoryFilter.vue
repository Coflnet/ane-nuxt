<template>
  <div>
    <label for="marketplace" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kleinanzeigen
      Kategorie</label>
    <select id="marketplace" v-model="props.filter.kleinanzeigenCategory"
      class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      required>

      <option v-for="(o, index) in props.options" :key="index" :value="o.value">
        {{ o.value }}
      </option>

    </select>
  </div>
</template>

<script setup lang='ts'>
import type { StringStringKeyValuePair } from '~/src/api-client';


const props = defineProps({
  filter: {
    type: Object,
    required: true
  },
  options: {
    type: Object as PropType<Array<StringStringKeyValuePair> | null>,
    required: false
  }
})

</script>
