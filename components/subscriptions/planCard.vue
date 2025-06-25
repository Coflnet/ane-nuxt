<template>
  <div
    :class="[
      'rounded-lg overflow-hidden shadow-lg transition-all duration-200 max-h-[470px]',
      selectedPlan === plan.id ? 'transform scale-105' : 'hover:scale-105',
      currentPlan === plan.id ? 'border-2 border-indigo-400' : 'border border-gray-700',
    ]"
  >
    <div class="bg-gray-800 p-6">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-bold text-white">
          {{ $t(plan.name) }}
        </h3>
        <span
          v-if="currentPlan === plan.id"
          class="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500 text-white"
        >
          <div>
            {{ $t('currentPlan') }}
          </div>
        </span>
        <span
          v-else-if="plan.popular"
          class="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500 text-white"
        >
          {{ $t('mostPopular') }}
        </span>
      </div>
      <div class="mt-4">
        <span class="text-4xl font-extrabold text-white">€{{ plan.price }}</span>
        <span class="text-gray-400 ml-1">{{ $t('month') }}</span>
      </div>
      <p class="mt-4 text-gray-400">
        {{ $t(plan.description) }}
      </p>
    </div>
    <div class="p-6 bg-gray-800 border-t border-gray-700">
      <ul class="space-y-4 h-full mb-8">
        <li
          v-for="(feature, index) in plan.features"
          :key="index"
          class="flex items-start"
        >
          <Icon
            v-if="feature.included"
            name="tabler:check"
            class="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5"
          />
          <Icon
            v-else
            name="tabler:x"
            class="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5"
          />
          <span :class="feature.included ? 'text-gray-300' : 'text-gray-500'">{{ featureText(feature) }}</span>
        </li>
      </ul>
      <UiButton
        :proccessing="loadingUrlButtonState"
        :primary="currentPlan !== plan.id && plan.available == true"
        :disabled="!plan.available || currentPlan === plan.id"
        class="w-full mt-8"
        @on-click="handleButtonClick"
      >
        {{ getButtonText() }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormat } from '~/composable/useFormat'
import { planPrices, type Feature, type Plan, type PlanId } from '~/constants/SubscriptionConstants'

const { t } = useI18n()
const loadingUrlButtonState = ref(false)

const featureText = (feature: Feature) => {
  if (feature.amount)
    return t(feature.text, { amount: useFormat().formatNumber(feature.amount, useI18n().locale.value) })
  return t(feature.text)
}

const props = defineProps<{
  plan: Plan
  currentPlan: PlanId | null
  selectedPlan: PlanId | null
  endDate: Date | null
}>()

const emit = defineEmits<{
  (e: 'select-plan', planId: PlanId): void
}>()

function handleButtonClick() {
  if (getButtonText() == t('upgrade'))
    loadingUrlButtonState.value = true

  emit('select-plan', props.plan.id)
}

const currentPlanText = computed(() => {
  // check if their is no end date
  if (Number.isNaN(props.endDate?.getTime()))
    return t('currentPlan')

  // Calculate the number of days left until the end date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date(props.endDate!)
  endDate.setHours(0, 0, 0, 0)

  const timeDiff = endDate.getTime() - today.getTime()
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  if (daysLeft === 0)
    return t('endsToday')
  return `${daysLeft} ${t('daysLeft')}`
})

function getButtonText(): string {
  if (props.currentPlan === props.plan.id)
    return currentPlanText.value

  if (props.plan.available == false)
    return t('comingSoon')

  if (!props.currentPlan)
    return t('selectPlan')

  if (planPrices[props.plan.id] ?? 0 > planPrices[props.currentPlan ?? '']!)
    return t('upgrade')
  return t('downgrade')
}
</script>
