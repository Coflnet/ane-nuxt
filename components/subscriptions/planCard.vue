<template>
  <div :class="[
    'rounded-lg overflow-hidden shadow-lg transition-all duration-200 max-h-[470px]',
    selectedPlan === plan.id ? 'transform scale-105' : 'hover:scale-105',
    currentPlan === plan.id ? 'border-2 border-indigo-400' : 'border border-gray-700',
  ]">
    <div class="bg-gray-800 p-6">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-bold text-white">{{ $t(plan.name) }}</h3>
        <span v-if="currentPlan === plan.id"
          class="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500 text-white">
          <div>
            {{ $t('currentPlan') }}
          </div>
        </span>
        <span v-else-if="plan.popular" class="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500 text-white">
          {{ $t('mostPopular') }}
        </span>
      </div>
      <div class="mt-4">
        <span class="text-4xl font-extrabold text-white">${{ plan.price }}</span>
        <span class="text-gray-400 ml-1">{{ $t('month') }}</span>
      </div>
      <p class="mt-4 text-gray-400">{{ $t(plan.description) }}</p>
    </div>
    <div class="p-6 bg-gray-800 border-t border-gray-700">
      <ul class="space-y-4 h-full">
        <li v-for="(feature, index) in plan.features" :key="index" class="flex items-start">
          <Icon name="tabler:check" v-if="feature.included" class="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
          <Icon v-else name="tabler:x" class="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
          <span :class="feature.included ? 'text-gray-300' : 'text-gray-500'">{{ featureText(feature) }}</span>
        </li>
      </ul>
      <button @click="$emit('select-plan', plan.id)" :class="[
        'mt-8 w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500',
        currentPlan === plan.id
          ? 'bg-gray-700 text-gray-300 cursor-default'
          : selectedPlan === plan.id
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : plan.available == false
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-500 text-white hover:bg-indigo-600 disabled'
      ]" :disabled="currentPlan === plan.id || plan.available == false">
        {{ getButtonText() }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { planPrices, type Feature, type Plan, type PlanId } from '~/types/SubscriptionConstants';
const { t } = useI18n();

const featureText = (feature: Feature) => {
  if (feature.amount)
    return t(feature.text, feature.amount);
  return t(feature.text);
}

const props = defineProps<{
  plan: Plan;
  currentPlan: PlanId | null;
  selectedPlan: PlanId | null;
  endDate: Date | null;
}>();

defineEmits<{
  (e: 'select-plan', planId: PlanId): void;
}>();

const currentPlanText = computed(() => {
  console.log(props.endDate)
  if (props.endDate === null) {
    return t('currentPlan');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(props.endDate);
    endDate.setHours(0, 0, 0, 0);


    const timeDiff = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysLeft === 0)
      return t('endsToday');
    return `${daysLeft} ${t('daysLeft')}`;
  }
});

function getButtonText(): string {
  if (props.currentPlan === props.plan.id)
    return currentPlanText.value;

  if (props.plan.available == false)
    return t('comingSoon');

  if (!props.currentPlan)
    return t('selectPlan');

  console.log(props.plan.id)
  console.log(props.plan.name)

  if (planPrices[props.plan.id] ?? 0 > planPrices[props.currentPlan ?? '']! ?? 0)
    return t('upgrade');
  return t('downgrade');
}
</script>
