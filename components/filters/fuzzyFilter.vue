<template>
  <div class="flex">
    <div>
      <div class="flex items-center mb-2">
        <UiHeaderLabel
          class="mt-1"
          :label="$t('fuzzy')"
          :sm="true"
          :accent="true"
        />
        <UiTooltipHover
          :text="$t('fuzzyInfo')"
          class="mr-2 mt-1"
        >
          <UiQuestionMarkIcon />
        </UiTooltipHover>
        <div
          v-if="hasBasicPlan"
          class="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full"
        >
          {{ $t('pricing.plans.collector.name') }}
        </div>
      </div>
      <UiDropdown
        v-model="model!.fuzzyness"
        :label="''"
        :options="fuzzyOptions"
        :disabled-string="$t('basicPlanFuzzy')"
        :disabled-array="hasBasicPlan ? ['4', '2', '1'] : []"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { fuzzyOptions } from '~/constants/CreateFilterConstants'
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()

const hasBasicPlan = useUserStore().currentPlan?.product == 'basic' || !useUserStore().currentPlan?.product
</script>
