<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-extrabold text-white sm:text-4xl">
        {{ $t('chooseYourPlan') }}
      </h1>
      <p class="mt-4 text-xl text-gray-300">
        {{ $t('selectPlanDetail') }}
      </p>
    </div>

    <!-- Discount Code Input -->
    <div class="max-w-md mx-auto mb-8">
      <div class="flex gap-2">
        <input
          v-model="discountCode"
          type="text"
          :placeholder="$t('enterDiscountCode')"
          class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
        >
        <button
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          @click="applyDiscount"
        >
          {{ $t('apply') }}
        </button>
      </div>
      <p
        v-if="discountApplied"
        class="mt-2 text-sm text-green-400"
      >
        {{ $t('discountApplied', { percent: discountPercent }) }}
      </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-3 sm:grid-cols-2 sm:gap-6">
      <SubscriptionsPlanCard
        v-for="plan in displayPlans"
        :key="plan.id"
        :plan="plan"
        :current-plan="currentPlan"
        :end-date="endDate"
        :selected-plan="selectedPlan"
        @select-plan="changePlan"
      />
    </div>

    <UiConformationPopup
      :hide-cancel="!subscriptionCanceled"
      :footer="subscriptionCanceled ? $t('confirmCancelSub') : $t('subscriptionAlreadyCanceledFooter')"
      :header="subscriptionCanceled ? $t('confirmCancel') : $t('subscriptionAlreadyCanceledHeader')"
      :primary="!subscriptionCanceled"
      :model-value="confirmCancelation"
      :confirm-text="subscriptionCanceled ? $t('confirm') : $t('soundsGood')"
      @confirm="confirmCancelSubscription"
      @cancel="confirmCancelation = false"
    />
  </div>
</template>

<script setup lang="ts">
import { plans, type PlanId, type Plan } from '~/constants/SubscriptionConstants'

const { t } = useI18n()
const userStore = useUserStore()

const currentPlan = ref<PlanId>('basic')
const selectedPlan = ref<PlanId | null>(null)
const confirmCancelation = ref(false)
const endDate = ref<Date | null>(null)
const subscriptionCanceled = computed(() => Number.isNaN(endDate.value?.getTime()))
const discountCode = ref('')
const discountApplied = ref(false)
const discountPercent = ref(0)

const displayPlans = computed<Plan[]>(() => {
  if (!discountApplied.value) return plans
  return plans.map(p => {
    if (p.id === 'basic') return p
    return { ...p, price: Math.round(p.price * (1 - discountPercent.value / 100) * 100) / 100 }
  })
})

async function applyDiscount() {
  if (!discountCode.value.trim()) return
  try {
    const res = await $fetch<{ code: string, discountPercent: number }>(`/api/payment/discount/${encodeURIComponent(discountCode.value.trim())}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    discountPercent.value = res.discountPercent
    discountApplied.value = true
  }
  catch {
    discountApplied.value = false
    push.error(t('invalidDiscountCode'))
  }
}

const apiToken = `Bearer ${useUserStore().token}`

async function changePlan(plan: string) {
  if (plan === currentPlan.value || plan == 'basic') {
    confirmCancelation.value = true
    return
  };

  const url = await subscribe({
    composable: '$fetch',
    body: {
      planSlug: plan as PlanId,
      redirectSuccess: 'https://ane.deals/overview',
      redirectCancel: 'https://ane.deals/overview',
      discountCode: discountApplied.value ? discountCode.value.trim() : undefined,
    },
    headers: { Authorization: apiToken },
  })

  useUserStore().noPremium = false
  await navigateTo(url, { external: true })
}

async function confirmCancelSubscription() {
  if (!subscriptionCanceled.value) {
    confirmCancelation.value = false
    return
  }
  const result = await getSubscription({ composable: '$fetch', headers: { Authorization: apiToken } })
  await cancelSubscription({
    composable: '$fetch',
    path: { id: result[0]?.id ?? '' },
    headers: { Authorization: apiToken },
  })

  push.success(t('cancelSubscriptionSuccess'))
  confirmCancelation.value = false
  getCurrentSubscription()
}

async function getCurrentSubscription() {
  // accessing the product from the same type that is returned from the api
  currentPlan.value = userStore.currentPlan?.product as PlanId ?? 'basic'
  endDate.value = userStore.currentPlan?.endsAt != null ? new Date(userStore.currentPlan?.endsAt) : null

  try {
    const result = await getSubscription({ composable: '$fetch', headers: { Authorization: apiToken } })
    if (result.length == 0) {
      if (currentPlan.value !== 'basic')
        resetSubscription()
      return
    }
    currentPlan.value = result[0]?.product as PlanId
    userStore.currentPlan = result[0]
    if (result[0]?.endsAt == '')
      return

    if (new Date(result[0]?.endsAt ?? '') < new Date()) {
      resetSubscription()
      return
    }

    if (result[0]?.endsAt !== '')
      endDate.value = new Date(result[0]?.endsAt ?? '')
  }
  catch (error) {
    push.error(`${t('errorCreatingSubscription')} ${error}`)
    console.error(error)
  }
}

async function resetSubscription() {
  currentPlan.value = 'basic'
  userStore.currentPlan = null
  endDate.value = null
}

const route = useRoute()

onMounted(async () => {
  getCurrentSubscription()
  // Auto-apply discount code from URL parameter (e.g. ?discount=EARLY)
  const urlDiscount = route.query.discount as string | undefined
  if (urlDiscount) {
    discountCode.value = urlDiscount
    await applyDiscount()
  }
})
</script>
