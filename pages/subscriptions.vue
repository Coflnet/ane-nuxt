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
import { cancelSubscription, getDiscount, subscribe } from '~/src/api-client'
import { plans, type PlanId, type Plan } from '~/constants/SubscriptionConstants'
import { displayedPlan } from '~/utils/displayedPlan'

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
    // cancel the active plan the page shows, not whichever subscription record is listed first
    await userStore.refreshEntitlements()
    const subscriptionId = userStore.currentPlan?.id
    if (!subscriptionId) {
      confirmCancelation.value = false
      return
    }
    await cancelSubscription({
      composable: '$fetch',
      path: { id: subscriptionId },
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

// The store picks the active Flipper, then Collector subscription and loads the access (with grants) next to it;
// reading the raw first subscription record here could show and store an ended or lower plan.
async function getCurrentSubscription() {
  showEntitlements()
  if (!userStore.token) return
  try {
    await userStore.refreshEntitlements()
  }
  catch (error) {
    if (handleAuthError(error)) return
    push.error(`${t('errorCreatingSubscription')} ${error}`)
    console.error(error)
  }
  showEntitlements()
}

// the current plan is the highest tier however it was obtained (subscription or grant)
function showEntitlements() {
  const shown = displayedPlan(userStore.currentPlan, userStore.access)
  currentPlan.value = shown.id
  endDate.value = shown.endDate
  grant.value = ownershipGrant(userStore.access)
}

// manual grant (ownership) that is not a subscription
function ownershipGrant(access: typeof userStore.access) {
  if (access?.source !== 'ownership' || (access.tier !== 'flipper' && access.tier !== 'collector')) return null
  return { tier: access.tier, until: access.until ? new Date(access.until) : null }
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
