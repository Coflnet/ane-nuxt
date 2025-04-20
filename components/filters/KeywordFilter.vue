<template>
  <div>
    <UiHeaderLabel :label="label ?? ''" :sm="true" :accent="true" />
    <UiDefaultInputBox class="p-2">
      <div v-for="(keyword, index) in keywords" :key="index"
        class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
        {{ keyword }}
        <UiTextButton @on-click="removeKeyword(index)" class="ml-2">
          <Icon name="tabler:trash" class="size-4 text-black" />
        </UiTextButton>
      </div>

      <div class="relative flex-grow">
        <input v-model="newKeyword" @keydown.enter.prevent="addKeyword" type="text" :placeholder="placeHolder"
          class="w-full px-3 py-1 border-0 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0" />
      </div>
    </UiDefaultInputBox>

    <UiFooterLabel :label="footer" :xs="true" />
  </div>
</template>

<script setup lang='ts'>


var keywords = defineModel<String[]>()
defineProps({ label: String, footer: String, placeHolder: String })

const newKeyword = ref('')

function addKeyword() {
  if (newKeyword.value.trim()) {
    keywords.value!.push(newKeyword.value.trim())
    newKeyword.value = ''
  }
}

function removeKeyword(index: number) {
  keywords.value!.splice(index, 1)
}
</script>
