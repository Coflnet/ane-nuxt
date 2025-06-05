<template>
  <div>
    <div class="flex">
      <UiHeaderLabel
        :label="$t('location')"
        :accent="true"
        :sm="true"
      />
      <UiTooltipHover
        :text="$t('countryShipping')"
        class="max-w-8"
      >
        <div
          class="border bg-slate-700 text-white border-slate-800 text-sm rounded-full size-6 text-center ml-2 -translate-y-0.5"
        >
          ?
        </div>
      </UiTooltipHover>
    </div>

    <select
      id="country"
      v-model="model!.country"
      class="w-full px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      autocomplete="country"
      name="country"
    >
      <option value="EU,US,GB">
        {{ $t('anyCountry') }}
      </option>
      <option value="EU">
        {{ $t('europe') }}
      </option>
      <option value="US">
        {{ $t('unitedStates') }}
      </option>
      <option value="CA">
        {{ $t('canada') }}
      </option>
      <option value="GB">
        {{ $t('unitedKingdom') }}
      </option>
      <option value="DE">
        {{ $t('germany') }}
      </option>
      <option value="FR">
        {{ $t('france') }}
      </option>
      <option value="IT">
        {{ $t('italy') }}
      </option>
      <option value="JP">
        {{ $t('japan') }}
      </option>
      <option value="NL">
        {{ $t('netherlands') }}
      </option>
      <option value="AU">
        {{ $t('australia') }}
      </option>
    </select>

    <UiFooterLabel
      :label="$t('sendingCountry')"
      :xs="true"
    />
  </div>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const model = defineModel<Filter>()
</script>
