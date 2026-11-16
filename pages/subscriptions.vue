<template>
  <div class="py-6 sm:py-12 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-extrabold text-white sm:text-4xl">
        {{ $t('chooseYourPlan') }}
      </h1>
      <p class="mt-4 text-xl text-gray-300">
        {{ $t('selectPlanDetail') }}
      </p>
    </div>

    <SubscriptionsPlanComparison class="mb-8" />

    <!-- Discount Code Input -->
    <div class="max-w-md mx-auto mb-8">
      <div class="flex gap-2">
        <input
          v-model="discountCode"
          type="text"
          :placeholder="$t('enterDiscountCode')"
          class="min-w-0 flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
        >
        <button
          class="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          @click="applyDiscount"
        >
          {{ $t('apply') }}
        </button>
      </div>
      <p
        v-if="discountApplied"
        class="mt-2 text-sm text-green-400"
      >
        {{ discountName ? `${discountName}: ` : '' }}{{ $t('discountApplied', { percent: discountPercent }) }}
      </p>
    </div>

    <p
      v-if="grantLabel"
      data-testid="access-grant"
      class="max-w-md mx-auto mb-8 text-center text-sm text-green-400"
    >
      {{ grantLabel }}
    </p>

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
import { getAccess } from '~/src/api-client'

interface AuthErrorLike {
  response?: {
    status?: number
  }
  statusCode?: number
}

interface DiscountResponse {
  discountPercent?: number | null
  name?: string | null
}

const { t } = useI18n()
const userStore = useUserStore()

const currentPlan = ref<PlanId>('basic')
const selectedPlan = ref<PlanId | null>(null)
const confirmCancelation = ref(false)
const endDate = ref<Date | null>(null)
const subscriptionCanceled = computed(() => Number.isNaN(endDate.value?.getTime()))
// manual grant (ownership) that is not a subscription, so it has nothing to cancel
const grant = ref<{ tier: string, until: Date | null } | null>(null)
const grantLabel = computed(() => {
  if (!grant.value) return ''
  const plan = grant.value.tier === 'flipper' ? 'Flipper' : 'Collector'
  if (!grant.value.until) return t('grantActive', { plan })
  return t('grantActiveUntil', { plan, date: grant.value.until.toLocaleDateString() })
})
const discountCode = ref('')
const discountApplied = ref(false)
const discountPercent = ref(0)
const discountName = ref('')
const localePath = useLocalePath()

const displayPlans = computed<Plan[]>(() => {
  if (!discountApplied.value) return plans
  return plans.map((p) => {
    if (p.id === 'basic') return p
    return {
      ...p,
      originalPrice: p.price,
      price: Math.round(p.price * (1 - discountPercent.value / 100) * 100) / 100,
    }
  })
})

function getApiToken() {
  return `Bearer ${userStore.token}`
}

async function ensureAuth() {
  if (!userStore.token) {
    navigateTo(localePath(`/login?redirectTo=${encodeURIComponent('/subscriptions')}`))
    return false
  }
  return true
}

function handleAuthError(error: unknown) {
  const authError = error as AuthErrorLike
  const status = authError.response?.status ?? authError.statusCode ?? 0
  if (status === 401 || status === 403) {
    userStore.token = null
    const redirect = discountCode.value
      ? `/subscriptions?discount=${encodeURIComponent(discountCode.value)}`
      : '/subscriptions'
    navigateTo(localePath(`/login?redirectTo=${encodeURIComponent(redirect)}`))
    return true
  }
  return false
}

async function applyDiscount() {
  if (!discountCode.value.trim()) return
  try {
    const res = await getDiscount({
      composable: '$fetch',
      path: { code: discountCode.value.trim() },
    }) as DiscountResponse
    discountPercent.value = res.discountPercent ?? 0
    discountApplied.value = true
    discountName.value = res.name ?? ''
  }
  catch (error) {
    discountApplied.value = false
    push.error(t('invalidDiscountCode'))
  }
}

async function changePlan(plan: string) {
  if (plan === currentPlan.value || plan == 'basic') {
    confirmCancelation.value = true
    return
  }
  if (!(await ensureAuth())) return

  try {
    const url = await subscribe({
      composable: '$fetch',
      body: {
        planSlug: plan as PlanId,
        redirectSuccess: 'https://ane.deals/overview',
        redirectCancel: 'https://ane.deals/overview',
        discountCode: discountApplied.value ? discountCode.value.trim() : undefined,
      },
      headers: { Authorization: getApiToken() },
    })

    userStore.noPremium = false
    await navigateTo(url, { external: true })
  }
  catch (error) {
    if (handleAuthError(error)) return
    push.error(`${t('errorCreatingSubscription')} ${error}`)
  }
}

async function confirmCancelSubscription() {
  if (!subscriptionCanceled.value) {
    confirmCancelation.value = false
    return
  }
  if (!(await ensureAuth())) return
  try {
    const result = await getSubscription({ composable: '$fetch', headers: { Authorization: getApiToken() } })
    if (!result[0]) {
      confirmCancelation.value = false
      return
    }
    await cancelSubscription({
      composable: '$fetch',
      path: { id: result[0]?.id ?? '' },
      headers: { Authorization: getApiToken() },
    })

    push.success(t('cancelSubscriptionSuccess'))
    confirmCancelation.value = false
    getCurrentSubscription()
  }
  catch (error) {
    if (handleAuthError(error)) return
    push.error(`${t('errorCreatingSubscription')} ${error}`)
  }
}

async function getCurrentSubscription() {
  // accessing the product from the same type that is returned from the api
  currentPlan.value = userStore.currentPlan?.product as PlanId ?? 'basic'
  endDate.value = userStore.currentPlan?.endsAt != null ? new Date(userStore.currentPlan?.endsAt) : null

  if (!userStore.token) return
  // independent of the subscription branches: a grant can exist next to a lapsed or lower subscription
  await loadGrant()
  try {
    const result = await getSubscription({ composable: '$fetch', headers: { Authorization: getApiToken() } })
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
    if (handleAuthError(error)) return
    push.error(`${t('errorCreatingSubscription')} ${error}`)
    console.error(error)
  }
}

async function loadGrant() {
  grant.value = null
  try {
    const access = await getAccess({ composable: '$fetch', headers: { Authorization: getApiToken() } })
    userStore.access = access
    if (access.source !== 'ownership' || (access.tier !== 'flipper' && access.tier !== 'collector')) return
    grant.value = { tier: access.tier, until: access.until ? new Date(access.until) : null }
  }
  catch (error) {
    console.error('Failed to load access grant:', error)
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
