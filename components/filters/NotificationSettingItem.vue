<template>
  <DefaultInputBox
    class="flex items-center p-4 flex-nowrap"
    :accent="true"
  >
    <div class="flex items-center flex-col h-full justify-center">
      <input
        :id="config.notificationType"
        :checked="filter.notificationType === config.notificationType"
        type="radio"
        :value="config.notificationType"
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
        @change="selectNotificationType"
      >
    </div>
    <label
      :for="config.notificationType"
      class="ml-3 flex flex-col md:flex-row"
    >
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-md bg-indigo-900 flex items-center justify-center mr-3">
          <Icon
            :name="config.icon"
            class="size-6 text-indigo-400"
          />
        </div>
        <div>
          <p class="font-medium text-white">{{ config.name }}</p>
          <p class="text-xs text-slate-400">{{ messages.footer }}</p>
        </div>
      </div>
      <div
        v-if="filter.notificationType === config.notificationType && config.textInput"
        class="md:ml-11 mt-2"
      >
        <UiInput
          v-model="model"
          type="string"
          :placeholder="config.placeholder"
          :error="validation!.error"
        />
        <p
          v-if="validation!.error"
          class="mt-1 text-sm text-red-500"
        >
          {{ messages.error }}
        </p>
      </div>
    </label>
  </DefaultInputBox>
</template>

<script setup lang="ts">
import DefaultInputBox from '../ui/DefaultInputBox.vue'
import type { Filter } from '~/types/FilterType'

const emit = defineEmits(['itemSelected'])
const model = defineModel<string>()

const props = defineProps<{
  filter: Filter
  config: {
    predefinedValue: string
    notificationType: string
    name: string
    placeholder?: string
    icon: string
    textInput?: boolean
  }
  messages: {
    footer: string
    error?: string
  }
  validation?: {
    error: boolean
  }
}>()

function selectNotificationType() {
  // Note: This still mutates the prop, but it's intentional for this form pattern
  // eslint-disable-next-line vue/no-mutating-props
  props.filter.notificationType = props.config.notificationType

  if (props.config.textInput) {
    model.value = props.config.predefinedValue
    return
  }
  emit('itemSelected')
}
</script>
