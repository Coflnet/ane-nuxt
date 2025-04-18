<template>
  <div class="flex items-start justify-between mb-3">
    <div>
      <h3 class="font-medium text-lg text-slate-900 dark:text-white">{{ filter.name }}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ filter.marketplace }}</p>
    </div>
    <div class="flex flex-row gap-x-1">
      <div class="flex items-center space-x-1">
        <UiTextButton @on-click="navigateTo(`/filters/create?id=${filter.id}`)">
          <UiIcon name="tabler:edit" />
        </UiTextButton>
      </div>
      <div class="flex items-center space-x-1">
        <FilterCardDelete :itemId="filter.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterCardDelete from '~/components/filters/FilterCardDelete.vue';



defineProps<{ filter: FilterFace }>()

</script>
