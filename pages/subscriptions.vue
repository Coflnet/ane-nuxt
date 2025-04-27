<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-extrabold text-white sm:text-4xl">
        Choose Your Plan
      </h1>
      <p class="mt-4 text-xl text-gray-300">
        Select the plan that best fits your needs
      </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-3 sm:grid-cols-2 sm:gap-6">
      <SubscriptionsPlanCard v-for="plan in plans" :key="plan.id" :plan="plan" :current-plan="currentPlan"
        :selected-plan="selectedPlan" @select-plan="changePlan" />
    </div>

    <UiConformationPopup :footer="$t('confirmCancelSub')" :header="$t('confirmCancel')"
      :model-value="confirmCancelation" @confirm="confirmCancelSubscription" />

  </div>
</template>

<script setup lang="ts">
import { plans, type PlanId } from '~/types/SubscriptionConstants';
const { t } = useI18n();


const currentPlan = ref<PlanId>('basic');
const selectedPlan = ref<PlanId | null>(null);
const confirmCancelation = ref(false)

const apiToken = `Bearer ${useUserStore().token}`;


async function changePlan(plan: String) {
  if (plan === currentPlan.value || plan == "basic") {
    confirmCancelation.value = true;
    return;
  };

  const url = await subscribe({
    composable: '$fetch',
    body: { planSlug: "collector", redirectSuccess: "https://ane.deals/overview", redirectCancel: "https://ane.deals/overview", },
    headers: { Authorization: apiToken },
  })

  console.log(url);

  await navigateTo(url, { external: true })

  push.success(t('planUpdated'));

}

async function confirmCancelSubscription() {
  await cancelSubscription({
    composable: '$fetch',
    path: { id: currentPlan.value },
    headers: { Authorization: apiToken },
  })

  push.success(t('cancelSubscriptionSuc'));

}

</script>
