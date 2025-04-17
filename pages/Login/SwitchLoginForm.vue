<template>
  <p class="text-slate-500 dark:text-slate-400 mt-4 ">
    {{ isLogin ? $t('dhac') : $t('already') || 'Already have an account?' }}
    <NuxtLink :to="isLogin ? '/register' : '/login'" class="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">
      {{ isLogin ? $t('signup') : $t('signinNormal') || 'Sign in' }}
    </NuxtLink>
  </p>
</template>

<script setup lang="ts">
defineProps({ isLogin: Boolean })
</script>
