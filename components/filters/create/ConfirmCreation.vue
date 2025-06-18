<template>
  <div class="items-center justify-end space-x-4 pt-6 border-t border-slate-700 mt-6 hidden md:flex">
    <NuxtLink
      to="/filters"
      aria-label="Cancel Filter Creation"
      class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors mt-4 md:mt-0"
    >
      {{ $t('cancel') }}
    </NuxtLink>
    <UiButton
      :primary="true"
      aria-label="Save Filter"
      type="submit"
      :proccessing="saving"
    >
      {{ isNewFilter ? $t('createFilter') : $t('updateFilter') }}
    </UiButton>
  </div>
  <div
    class="block md:hidden fixed right-6"
    :style="{ bottom: floatingButtonBottom }"
  >
    <UiButton
      :primary="true"
      aria-label="Save Filter"
      type="submit"
      :proccessing="saving"
      class="shadow-xl shadow-black/30"
    >
      {{ isNewFilter ? $t('createFilter') : $t('updateFilter') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
defineProps({ isNewFilter: Boolean, saving: Boolean })

const floatingButtonBottom = ref('24px')
let initialViewportHeight: number | undefined

const handleResize = () => {
  if (window.innerWidth < 768) {
    const currentViewportHeight = window.innerHeight

    // move the button up if the keyboard it open
    if (initialViewportHeight && currentViewportHeight < initialViewportHeight - 200) {
      floatingButtonBottom.value = `${initialViewportHeight - currentViewportHeight + 24}px`
    }
    else {
      floatingButtonBottom.value = '24px'
    }
  }
}

const handleVisualViewportResize = () => {
  if (window.visualViewport) {
    const keyboardOpen = window.visualViewport.height < window.innerHeight
    if (keyboardOpen) {
      floatingButtonBottom.value = `${(window.innerHeight - window.visualViewport.height) + 24}px`
    }
    else {
      floatingButtonBottom.value = '24px'
    }
  }
  else {
    handleResize()
  }
}

onMounted(() => {
  initialViewportHeight = window.innerHeight

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportResize)
  }
  else {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
  }
  else {
    window.removeEventListener('resize', handleResize)
  }
})
</script>
