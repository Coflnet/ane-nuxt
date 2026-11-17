<template>
  <div>
    <FiltersNotificationSettingsFilter v-model="model" />
    <p
      v-if="model.notificationType === 'Unknown'"
      class="mt-3 text-sm text-slate-400"
      data-testid="notify-none-hint"
    >
      {{ $t('filterTree.notify.noneHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>({ required: true })
</script>
