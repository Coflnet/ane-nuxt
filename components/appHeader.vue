<template>
  <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <Logo />
        <NavButton />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import Logo from './AppHeader.vue/Logo.vue';
import NavButton from './AppHeader.vue/NavButton.vue';

</script>
