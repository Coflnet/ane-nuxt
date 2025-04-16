<<template>
  <div class="p-4">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-medium text-lg text-slate-900 dark:text-white">{{ filter.name }}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ filter.marketplace }}</p>
      </div>
      <div class="flex flex-row gap-x-1">
        <div class="flex items-center space-x-1">
          <button class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit filter"
            @click="navigateTo(`/filters/create?id=${filter.id}`)">
            <EditIcon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div class="flex items-center space-x-1">
          <FilterCardDelete :itemId="filter.id"></FilterCardDelete>
        </div>

      </div>

    </div>


    <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
      <div class="flex items-center space-x-2">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          :class="filter.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
          {{ filter.active ? 'Active' : 'Paused' }}
        </span>
        <span class="text-sm text-slate-500 dark:text-slate-400">{{ filter.matchCount }} matches</span>
      </div>
      <NuxtLink :to="`/auctions?filter=${filter.id}`"
        class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline hidden">
        View matches
      </NuxtLink>
    </div>
  </div>

</template>
