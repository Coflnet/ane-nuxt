<template>
  <div>
    <div class="justify-between flex items-end mb-4">
      <div class="flex items-center">
        <UiHeaderLabel
          class="min-w-28 mt-1"
          :label="$t('whitelistKeywords')"
          :sm="true"
          :accent="true"
        />
        <UiTooltipHover
          :text="$t('whitelistInfo')"
          class="mr-2 mt-1"
        >
          <UiQuestionMarkIcon />
        </UiTooltipHover>
      </div>

      <div class="flex">
        <UiTooltipHover
          :text="$t('whtielistOrInfo')"
          class="mr-2 mt-1"
        >
          <UiQuestionMarkIcon />
        </UiTooltipHover>
        <UiButton
          class="min-w-24"
          @on-click="addGroup"
        >
          {{ $t('addOr') }}
        </UiButton>
      </div>
    </div>

    <div
      v-for="(_, groupIndex) in keywords"
      :key="groupIndex"
      class="mb-2 w-full"
    >
      <div
        v-if="groupIndex > 0"
        class="flex items-center w-full justify-center mb-2 space-x-2 text-gray-200"
      >
        <div class="w-14 h-0.5 bg-gray-400 rounded-full mr-2" />
        {{ $t('or') }}
        <div class="w-14 h-0.5 bg-gray-400 rounded-full" />
      </div>

      <UiDefaultInputBox class="p-2">
        <div
          v-for="(keyword, index) in keywords![groupIndex]"
          :key="index"
          class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-900 text-indigo-200"
        >
          {{ keyword }}
          <UiTextButton
            label-aria="Remove Keyword"
            class="ml-2"
            @on-click="removeKeyword(groupIndex, index)"
          >
            <Icon
              name="tabler:trash"
              class="size-4 text-black"
            />
          </UiTextButton>
        </div>

        <div class="relative flex-grow">
          <input
            :id="`${groupIndex}`"
            v-model="newKeywords[groupIndex]"
            aria-label="Keyword Input"
            type="text"
            :placeholder="$t('addWhitelistPressEnter')"
            class="w-full px-3 py-1 border-0 bg-transparent text-white focus:outline-none focus:ring-0"
            @keydown.enter.prevent="addKeyword(groupIndex)"
            @blur="addKeyword(groupIndex)"
          >
        </div>
        <UiButton
          :primary="true"
          @on-click="addKeyword(groupIndex)"
        >
          {{ $t('add') }}
        </UiButton>
      </UiDefaultInputBox>
    </div>

    <UiFooterLabel
      :label="$t('addWhitelistKeywords')"
      :xs="true"
    />
  </div>
</template>

<script setup lang='ts'>
const { t } = useI18n()
const keywords = defineModel<string[][]>()

const newKeywords = ref<string[]>([''])

function addKeyword(groupIndex: number) {
  const keywordToAdd = newKeywords.value[groupIndex]?.trim()
  if (keywordToAdd) {
    keywords.value![groupIndex]!.push(keywordToAdd)
    newKeywords.value[groupIndex] = ''
  }
}

function removeKeyword(groupIndex: number, index: number) {
  keywords.value![groupIndex]!.splice(index, 1)
}

function addGroup() {
  if (keywords!.value?.length === 3) {
    push.error(t('maxGroupsReached'))
    return
  }
  keywords.value!.push([])
  newKeywords.value.push('')
}
</script>
