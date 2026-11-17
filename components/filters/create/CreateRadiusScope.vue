<template>
  <div
    v-if="zipSet && radiusApplicable(model.deliveryMethod)"
    class="col-span-full space-y-2"
    data-testid="radius-scope"
  >
    <p
      v-if="!choiceNeeded"
      class="text-sm text-slate-400"
      data-testid="radius-scope-pickup-only"
    >
      {{ $t('radiusScope.pickupOnlyHint', { radius: model.searchRadius ?? 0 }) }}
    </p>
    <template v-else>
      <label
        v-for="option in options"
        :key="option.scope"
        class="flex items-start gap-3 cursor-pointer"
      >
        <input
          v-model="model.radiusScope"
          type="radio"
          name="radius-scope"
          :value="option.scope"
          :data-testid="`radius-scope-${option.scope}`"
          class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
        >
        <span>
          <span class="block font-medium text-white">{{ $t(`radiusScope.${option.scope}`) }}</span>
          <span class="block text-xs text-slate-400">{{ $t(`radiusScope.${option.scope}Hint`) }}</span>
        </span>
      </label>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'
import { needsRadiusScopeChoice, radiusApplicable } from '~/utils/radiusScope'

const model = defineModel<Filter>({ required: true })

const options = [{ scope: 'all' }, { scope: 'pickup' }] as const
const zipSet = computed(() => model.value.zipcode !== '')
const choiceNeeded = computed(() => needsRadiusScopeChoice(model.value.deliveryMethod))
</script>
