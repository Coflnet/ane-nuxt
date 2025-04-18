<template>
  <div class="text-center mb-8">
    <div
      class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
      <Icon name="tabler:bell" class="size-8 text-white" />
    </div>
    <HeaderLabel :label="isLogin ? $t('signIn') : $t('register')" class="mt-2" :xl="true"></HeaderLabel>
    <UiFooterLabel :label="isLogin ? $t('signintoAccount') : $t('createAccount')" />
  </div>

</template>

<script setup>
import HeaderLabel from '~/components/ui/HeaderLabel.vue';

defineProps({ isLogin: Boolean })
</script>
