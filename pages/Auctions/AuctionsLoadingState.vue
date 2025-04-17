<template>
  <div v-if="noAuctions" class="py-12 text-center">
    <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">{{ $t('noAu') }}</h3>
    <p class="text-slate-500 dark:text-slate-400">{{ $t('filAdj') }}</p>
  </div>

  <div v-if="loading" class="text-center text-sm text-slate-500 py-6 flex flex-col items-center mt-8">
    <Icon name="svg-spinners:90-ring-with-bg" class="size-8 mb-2" />
    {{ $t('loadmo') }}
  </div>

</template>

<script setup lang="ts">
import { Icon } from '#components';

defineProps({ noAuctions: Boolean, loading: Boolean })
</script>
