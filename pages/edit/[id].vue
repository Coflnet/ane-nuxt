<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-8 mb-8">
      <FiltersTokenUnsubscribe
        v-slot="{ step, loadFailed }"
        :filter-id="Number(route.params.id)"
        :token="token"
        :title="$t('editFilter')"
      >
        <template v-if="step !== 'done' && step !== 'invalid'">
          <UiFooterLabel
            v-if="loadFailed"
            class="mt-6"
            :label="$t('editFilterLinkExpired')"
          />
          <UiLinkButton
            class="mt-4 justify-center"
            primary
            :href="editPath"
          >
            {{ $t('editFilter') }}
          </UiLinkButton>
        </template>
      </FiltersTokenUnsubscribe>
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const userStore = useUserStore()
const token = computed(() => String(route.query.token ?? ''))
// login state is only known in the browser, so the server renders the login link
const loggedIn = ref(false)
onMounted(() => loggedIn.value = userStore.isLoggedIn)

// The e-mail token only allows reading and deleting; editing happens in the filter UI,
// which needs a real (non-anonymous) login.
const editPath = computed(() => {
  const target = `/filters/create?id=${encodeURIComponent(String(route.params.id))}`
  if (loggedIn.value)
    return localePath(target)
  return localePath({ path: '/login', query: { redirectTo: target } })
})

definePageMeta({
  layout: 'landing',
})

useSeoMeta({
  title: () => t('editFilter'),
  robots: 'noindex',
})
</script>
