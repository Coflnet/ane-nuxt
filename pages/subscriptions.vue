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
        :end-date="endDate" :selected-plan="selectedPlan" @select-plan="changePlan" />
    </div>

    <UiConformationPopup :footer="$t('confirmCancelSub')" :header="$t('confirmCancel')"
      :model-value="confirmCancelation" @confirm="confirmCancelSubscription" />

  </div>
</template>

<script setup lang="ts">
import { plans, type PlanId } from '~/types/SubscriptionConstants';
const { t } = useI18n();
const userStore = useUserStore();

const currentPlan = ref<PlanId>('basic');
const selectedPlan = ref<PlanId | null>(null);
const confirmCancelation = ref(false)
const endDate = ref<Date | null>(null);

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

}

async function confirmCancelSubscription() {

  const result = await getSubscription({ composable: '$fetch', headers: { Authorization: apiToken } })
  await cancelSubscription({
    composable: '$fetch',
    path: { id: result[0]?.id ?? "" },
    headers: { Authorization: apiToken },
  })

  push.success(t('cancelSubscriptionSuc'));
}

async function getCurrentSubscription() {
  // accessing the product from the same type that is returned from the api
  currentPlan.value = userStore.currentPlan?.product as PlanId ?? "basic";
  endDate.value = userStore.currentPlan?.endsAt ? new Date(userStore.currentPlan?.endsAt) : null;

  try {
    const result = await getSubscription({ composable: '$fetch', headers: { Authorization: apiToken } })
    console.log(result);
    if (result.length == 0)
      return;

    currentPlan.value = result[0]?.product as PlanId;
    userStore.currentPlan = result[0];
    if (result[0]?.endsAt !== "")
      endDate.value = new Date(result[0]?.endsAt ?? "");
  } catch (error) {
    push.error("error requesting your")

  }
}

onMounted(() => getCurrentSubscription())

</script>
