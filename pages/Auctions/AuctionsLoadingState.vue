<template>
  <div v-if="noAuctions" class="py-12 text-center">
    <Icon name="tabler:Search" class="size-9" />
    <HeaderLabel :label="$t('noAuctions')" />
    <UiFooterLabel :label="$t('tryAdjustedFilters')" />
  </div>

  <div v-if="loading" class="text-center text-sm text-slate-500 py-6 flex flex-col items-center mt-8">
    <Icon name="svg-spinners:90-ring-with-bg" class="size-8 mb-2" />
    {{ $t('loadMoreAuctions') }}
  </div>

</template>

<script setup lang="ts">
import { Icon } from '#components';
import HeaderLabel from '~/components/ui/HeaderLabel.vue';

defineProps({ noAuctions: Boolean, loading: Boolean })
</script>
