import { defineStore } from 'pinia'
import { getFilters, addFilter, getOptions, testFilter as callTestFilter } from '~/src/api-client'
import type { ListingListener, FilterOptions } from '~/src/api-client'

type NamedOption = {
  name: string
  value: FilterOptions
}

export const useFilterStore = defineStore('filter', () => {
  const userStore = useUserStore()

  const filters = ref<ListingListener[]>([])
  const filterOptions = ref<NamedOption[]>([])

  const getSimplifiedFilters = computed(() => {
    const simplifiedFilters: { [id: string]: [string, number] } = {}
    filters.value.map(i => simplifiedFilters[i.id ?? ''] = [i.name ?? '', i.id ?? 0])
    return simplifiedFilters
  })

  const getUserFilters = computed(() => filters.value)
  const getUserFilterById = computed(() => {
    return (id: number) => filters.value.find(filter => filter.id === id) // assuming your ListingListener type has an 'id' property.
  })

  const getFilterOptions = computed(() => filterOptions.value)

  async function loadFilters() {
    if (!userStore.token) {
      console.error('No token found, can not load filters')
      return
    }

    const apiToken = `Bearer ${userStore.token}`

    const loadedFilters = await getFilters({
      composable: '$fetch',
      headers: { Authorization: apiToken },
    })

    if (!loadedFilters) {
      console.error('No filters found')
      return
    }

    filters.value = loadedFilters
  }

  async function saveFilter(filterToCreate: ListingListener) {
    try {
      if (!userStore.token) {
        console.error('No token found, can not add filter')
        return
      }

      const apiToken = `Bearer ${userStore.token}`

      await addFilter({
        composable: '$fetch',
        headers: { Authorization: apiToken },
        body: filterToCreate as any,
      })
    }
    catch (e) {
      console.error('Error adding filter', e)
      throw e
    }
  }

  async function testFilter(filter: ListingListener): Promise<Listing[] | null> {
    try {
      if (!userStore.token) {
        console.error('No token found, can not test filter')
        return null
      }

      const apiToken = `Bearer ${userStore.token}`
      const listings = await callTestFilter({
        composable: '$fetch',
        headers: { Authorization: apiToken },
        body: filter as any,
      })

      return listings
    }
    catch (e) {
      console.error('Error testing filter', e)
      throw e
    }
  }

  async function loadFilterOptions() {
    try {
      const options = await getOptions({
        composable: '$fetch',
      })
      if (!options) {
        console.error('No filter options found')
        return
      }
      const namedOptions: NamedOption[] = []
      for (const [key, value] of Object.entries(options)) {
        namedOptions.push({ name: key, value })
      }
      filterOptions.value = namedOptions
    }
    catch (e) {
      console.error('Error loading filter options', e)
      throw e
    }
  }

  return {
    filters,

    getUserFilters,
    getUserFilterById,
    getFilterOptions,
    getSimplifiedFilters,

    loadFilters,
    saveFilter,
    testFilter,
    loadFilterOptions,
  }
})
