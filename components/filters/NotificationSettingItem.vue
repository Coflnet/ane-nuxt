<template>
  <DefaultInputBox class="flex items-center p-4" :accent="true">
    <div class="flex items-center flex-col h-full justify-center">
      <input :id="config.notificationType" v-model="filter.notificationType"
        :data-testid="`notification-type-${config.name}`" type="radio" :value="config.notificationType"
        @click="itemSelected()" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
    </div>
    <label :for="config.notificationType" class="ml-3 flex">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-md bg-indigo-900 flex items-center justify-center mr-3">
          <Icon :name="config.icon" class="size-6 text-indigo-400" />
        </div>
        <div>
          <p class="font-medium text-white">{{ config.name }}</p>
          <p class="text-xs text-slate-400">{{ messages.footer }}</p>
        </div>
      </div>
      <div v-if="filter.notificationType === config.notificationType && config.textInput" class="ml-11 mt-2">
        <UiInput :test-id="`notification-input-${config.name}`" type="string" :placeholder="config.placeholder"
          v-model="model" :error="validation!.error" />
        <p v-if="validation!.error" class="mt-1 text-sm text-red-500">
          {{ messages.error }}
        </p>
      </div>
    </label>
  </DefaultInputBox>
</template>



<script setup lang="ts">
import type { Filter } from '~/types/FilterType';
import DefaultInputBox from '../ui/DefaultInputBox.vue';
const emit = defineEmits(['itemSelected'])
const model = defineModel();

const props = defineProps<{
  filter: Filter,
  config: {
    predefinedValue: string,
    notificationType: string,
    name: string,
    placeholder?: string,
    icon: string,
    // setting default is annoying
    textInput?: boolean
  },
  messages: {
    footer: string,
    error?: string
  },
  validation?: {
    error: boolean
  }
}>();

function itemSelected() {
  if (props.config.textInput) {
    props.filter.notificationTarget = props.config.predefinedValue
    return
  }
  emit('itemSelected');
}

</script>
