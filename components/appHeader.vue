<template>
  <header class="bg-slate-900 border-b border-slate-800">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <UiLogo location="/overview" />
        <NavButton />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import NavButton from './AppHeader/NavButton.vue';

</script>
