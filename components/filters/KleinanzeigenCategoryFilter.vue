<template>
  <div>
    <label for="marketplace" class="block text-sm font-medium text-slate-300 mb-1">Kleinanzeigen
      Kategorie</label>
    <select id="marketplace" v-model="props.filter.kleinanzeigenCategory"
      class="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
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
