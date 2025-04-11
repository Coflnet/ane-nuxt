<template>
  <div>
    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{{ $t('blackke') }}</label>
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <input v-model="newBlacklist" @keydown.enter.prevent="confirmBlacklist" type="text"
          placeholder="Add blacklist keyword and press Enter"
          class="flex-grow px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
        <button type="button" @click="confirmBlacklist"
          class="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
          {{ $t('add') }}
        </button>
      </div>

      <!-- Confirmation Dialog -->
      <div v-if="blacklistConfirmation.show"
        class="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
        <p class="text-sm text-slate-700 dark:text-slate-300 mb-2">
          {{ $t('add') }} "<span class="font-medium">{{ blacklistConfirmation.value }}</span>" {{ $t('tobla') }} </p>
        <div class="flex gap-2">
          <button type="button" @click="addBlacklist"
            class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm">
            {{ $t('conf') }}
          </button>
          <button type="button" @click="cancelBlacklist"
            class="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-sm">
            {{ $t('canc') }}
          </button>
        </div>
      </div>

      <!-- Blacklist Items -->
      <div class="flex flex-row gap-2 mt-2 items-center">
        <div v-for="(keyword, index) in filter.blacklist" :key="index"
          class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
          {{ keyword }}
          <button type="button" @click="removeBlacklist(index)"
            class="ml-2 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 mt-1.5">
            <Icon name="tabler:trash" class="size-4 text-black"></Icon>
          </button>
        </div>
      </div>
    </div>
    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ $t('addblak') }}
    </p>
  </div>
</template>

<script setup lang='ts'>
const props = defineProps({
  filter: {
    type: Object,
    required: true
  }
})

const newBlacklist = ref('')

// Blacklist confirmation state
const blacklistConfirmation = ref({
  show: false,
  value: ''
})

function confirmBlacklist() {
  const value = newBlacklist.value.trim()
  if (value) {
    blacklistConfirmation.value = {
      show: true,
      value: value
    }
  }
}

function addBlacklist() {
  if (blacklistConfirmation.value.value) {
    props.filter.blacklist.push(blacklistConfirmation.value.value)
    newBlacklist.value = ''
    blacklistConfirmation.value.show = false
  }
}

function cancelBlacklist() {
  blacklistConfirmation.value.show = false
}

function removeBlacklist(index: number) {
  props.filter.blacklist.splice(index, 1)
}

</script>
