<template>
  <NuxtImg
    v-if="src && !failed"
    ref="image"
    :src="src"
    :alt="alt"
    :loading="loading"
    referrerpolicy="no-referrer"
    :class="imageClass"
    @error="failed = true"
  />
  <div
    v-else
    class="w-full h-full flex items-center justify-center text-slate-600"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
    data-testid="product-image-placeholder"
  >
    <Icon
      name="tabler:photo"
      :class="iconClass"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Product photo that degrades to the photo placeholder when the marketplace image is gone (the
 * listing was removed, so the URL answers 404). The error event of an image that failed before
 * hydration is never seen by Vue, so a finished-but-empty image is also checked on mount.
 */
const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  imageClass?: string
  iconClass?: string
  loading?: 'lazy' | 'eager'
}>(), {
  src: null,
  alt: '',
  imageClass: 'w-full h-full object-cover',
  iconClass: 'w-12 h-12',
  loading: 'lazy',
})

const failed = ref(false)
const image = ref<{ $el?: Element } | null>(null)

watch(() => props.src, () => {
  failed.value = false
  nextTick(checkBrokenImage)
})

function checkBrokenImage() {
  const element = image.value?.$el
  if (element instanceof HTMLImageElement && element.complete && element.naturalWidth === 0 && element.currentSrc) {
    failed.value = true
  }
}

onMounted(checkBrokenImage)
</script>
