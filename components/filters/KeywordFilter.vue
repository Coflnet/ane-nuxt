<template>
  <div>
    <UiHeaderLabel
      :label="label ?? ''"
      :sm="true"
      :accent="true"
    />
    <UiDefaultInputBox class="p-2">
      <div
        v-for="(keyword, index) in keywords"
        :key="index"
        class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-900 text-indigo-200"
      >
        {{ keyword }}
        <UiTextButton
          label-aria="Remove Keyword"
          class="ml-2"
          @on-click="removeKeyword(index)"
        >
          <Icon
            name="tabler:trash"
            class="size-4 text-black"
          />
        </UiTextButton>
      </div>

      <div class="relative flex-grow">
        <input
          v-model="newKeyword"
          aria-label="Keyword Input"
          type="text"
          :placeholder="placeHolder"
          class="w-full px-3 py-1 border-0 bg-transparent text-white focus:outline-none focus:ring-0"
          @keydown.enter.prevent="addKeyword"
        >
      </div>
    </UiDefaultInputBox>

    <UiFooterLabel
      :label="footer"
      :xs="true"
    />
  </div>
</template>

<script setup lang='ts'>
const keywords = defineModel<string[]>()
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
