<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Keywords</label>
    <div
      class="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
      <div v-for="(keyword, index) in filter.keywords" :key="index"
        class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
        {{ keyword }}
        <button type="button" @click="removeKeyword(index)"
          class="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 mt-1.5">
          <Icon name="tabler:trash" class="size-4 text-black"></Icon>
        </button>
      </div>

      <div class="relative flex-grow">
        <input v-model="newKeyword" @keydown.enter.prevent="addKeyword" type="text"
          placeholder="Add keyword and press Enter"
          class="w-full px-3 py-1 border-0 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0" />
      </div>
    </div>
    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Add keywords that describe what you're looking
      for</p>
  </div>

</template>

<script setup lang='ts'>
const props = defineProps({
  filter: {
    type: Object,
    required: true
  }
})

const newKeyword = ref('')

function addKeyword() {
  if (newKeyword.value.trim()) {
    props.filter.keywords.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

function removeKeyword(index: number) {
  props.filter.keywords.splice(index, 1)
}
</script>
