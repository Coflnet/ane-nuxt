<template>
  <UiFooterLabel class="mt-4">
    {{ isLogin ? $t('dontHaveAccount') : $t('alreadyHaveAccount') }}
    <NuxtLink :to="isLogin ? '/register' : '/login'" class="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">
      {{ isLogin ? $t('signUp') : $t('signIn') }}
    </NuxtLink>
  </UiFooterLabel>


</template>

<script setup lang="ts">
import FooterLabel from '~/components/ui/FooterLabel.vue';

defineProps({ isLogin: Boolean })
</script>
