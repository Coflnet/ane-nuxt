<template>
  <a
    aria-label="Create Navigation Button"
    class="text-white hover:text-indigo-300 hover:underline bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg hover:cursor-pointer flex items-center"
    :to="localePath('/filters/create')"
    @click.prevent="checkForAvaiableFilters(localePath('/filters/create'))"
  >
    <Icon
      name="tabler:plus"
      class="size-5 mr-2"
    />
    <span class="mr-1">{{ $t('createFilter') }}</span>
  </a>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

async function checkForAvaiableFilters(url: string) {
  // the cached allowance may predate an upgrade or grant, so the store reloads it before refusing
  if (await useUserStore().canCreateFilter()) {
    navigateTo(url)
    return
  }
  push.error(t('noAvailableFilters'))
}
</script>
