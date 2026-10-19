<template>
  <UiDefaultContainer class="p-6 max-w-md w-full">
    <UiHeaderLabel
      :label="title"
      class="mb-2"
    />

    <template v-if="flow.step === 'invalid'">
      <UiFooterLabel :label="$t('unsubscribeInvalidLink')" />
    </template>

    <template v-else-if="flow.step === 'done'">
      <UiFooterLabel :label="$t('unsubscribeSuccess')" />
    </template>

    <template v-else>
      <UiFooterLabel :label="flow.filterName ? $t('unsubscribeConfirmNamed', { name: flow.filterName }) : $t('unsubscribeConfirm')" />
      <div
        v-if="flow.step === 'error'"
        role="alert"
        class="mt-4 text-red-400"
      >
        {{ $t('unsubscribeError') }}
        <UiLinkButton
          class="mt-2"
          :href="localePath({ path: '/login', query: { redirectTo: '/filters' } })"
        >
          {{ $t('manageFiltersLogin') }}
        </UiLinkButton>
      </div>
      <UiButton
        warning
        class="mt-6 w-full"
        :proccessing="flow.step === 'pending'"
        @on-click="confirmUnsubscribe(flow, api)"
      >
        {{ $t('unsubscribeButton') }}
      </UiButton>
    </template>

    <slot
      :load-failed="flow.loadFailed"
      :step="flow.step"
    />
  </UiDefaultContainer>
</template>

<script setup lang="ts">
import { deleteFilterWithToken, getFilterByToken } from '~/src/api-client'
import { confirmUnsubscribe, createTokenUnsubscribeState, loadTokenFilterName } from '~/utils/tokenUnsubscribe'

const props = defineProps<{
  filterId: number
  token: string
  title: string
}>()

const localePath = useLocalePath()

const path = { id: props.filterId, token: props.token }

const api = {
  load: () => getFilterByToken({ path, composable: '$fetch' }),
  remove: () => deleteFilterWithToken({ path, composable: '$fetch' }),
}
const flow = reactive(createTokenUnsubscribeState(!!props.token && Number.isSafeInteger(props.filterId)))

onMounted(() => loadTokenFilterName(flow, api))
</script>
