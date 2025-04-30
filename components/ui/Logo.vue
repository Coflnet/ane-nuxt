<template>
  <NuxtLink :to="location" class="flex items-center space-x-2">
    <div
      class="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold p-1">
      <svg viewBox="0 0 109 73" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M30.164 5.109c2.16-4.213 10.284-4.615 12.237 0l16 46.391c.234.587.797.595 1 0L75.295 5.109c.937-2.603 2.668-4.618 7.347-4.61h23.419c4.79.07 4.622 7.572 0 7.73l-19.547.386c-1.94-.026-4.07.96-4.694 2.885l-6.883 20.34c-.424 1.336.61 1.649 1.866 1.66H95.45c4.87 0 4.87 6.719 0 6.719l-20.483.056c-1.987-.025-2.64.421-2.99 1.425l-6.964 20.802c-.794 2.394.665 4.86 2.781 4.812H96.41c4.135.016 4.277 7.499 0 7.454L59.82 75c-3.638-.11-4.203-1.508-5.144-3.862L37.003 15.362c-.241-.715-1.334-.747-1.605 0L22.294 43.25c-.618 1.188-.183 1.685 1.138 1.65h16.47c1.088-.008 1.958.573 2.5 2.101l1.5 4.5c.273.829-.206 1.04-1.24 1.053H22.295c-2.038.028-3.672.94-4.833 2.834L7.895 72.979C6.382 76.39-1.366 73.332.4 69.62L30.164 5.11Z"
          fill="#fff" />
      </svg>
    </div>
    <span class="text-xl font-bold text-white">ANE</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({ location: String })
</script>
