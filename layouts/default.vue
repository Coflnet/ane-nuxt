<template>
  <div class="flex flex-col min-h-screen  bg-slate-900 border-slate-800">
    <AppHeader />
    <main class="flex-grow container mx-auto px-4 py-8">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
