<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8">
      <FiltersTokenUnsubscribe
        :filter-id="Number(route.params.id)"
        :token="token"
        :title="$t('unsubscribeTitle')"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const token = computed(() => String(route.query.token ?? ''))

definePageMeta({
  layout: 'landing',
})

useSeoMeta({
  title: () => t('unsubscribeTitle'),
  robots: 'noindex',
})
</script>
