<template>
  <div class="flex items-center p-4 rounded-lg border border-slate-700 bg-slate-700/50">
    <div class="flex items-center h-5">
      <input id="none-notification" v-model="filter.notificationType" type="radio" value="Unknown"
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
    </div>
    <label for="none-notification" class="ml-3 flex items-center">
      <div class="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center mr-3">
      </div>
      <div>
        <p class="font-medium text-white">{{ $t('none') }}</p>
        <p class="text-xs text-slate-400">{{ $t('dontSendNotifications') }}</p>
      </div>
    </label>
  </div>
</template>

<script setup lang='ts'>
import type { Filter } from '~/types/FilterType';
defineProps<{ filter: Filter }>()
</script>
