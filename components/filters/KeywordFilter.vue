<template>
  <div>
    <HeaderLabel :label="label" />
    <UiDefaultInputBox class="p-2">
      <div v-for="(keyword, index) in modelValue" :key="index"
        class="inline-flex items-center px-3 py-4 rounded-md text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
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
    </UiDefaultInputBox>

    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ footer }}</p>
  </div>
</template>

<script setup lang='ts'>
import HeaderLabel from '~/pages/filters/create/HeaderLabel.vue'

var modelValue = defineModel<String[]>()
defineProps({ label: String, footer: String })

const newKeyword = ref('')

function addKeyword() {
  if (newKeyword.value.trim()) {
    modelValue.value!.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

function removeKeyword(index: number) {
  modelValue.value!.splice(index, 1)
}
</script>
