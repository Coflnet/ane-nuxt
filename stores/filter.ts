import { defineStore } from "pinia"
import { getFilters, addFilter, getOptions, testFilter } from "~/src/api-client"
import type { ListingListener, FilterOptions } from "~/src/api-client"


type NamedOption = {
  name: string;
  value: FilterOptions;
}

export const useFilterStore = defineStore("filter", () => {
  const userStore = useUserStore();

  const filters = ref<ListingListener[]>([]);
  const filterOptions = ref<NamedOption[]>([]);

  const getSimplifiedFilters = computed(() => {
    let simplifiedFilters: { [id: string]: string } = {};
    filters.value.map((i) => simplifiedFilters[i.id ?? ""] = i.name ?? "");
    return simplifiedFilters;
  })

  const getUserFilters = computed(() => filters.value);
  const getUserFilterById = computed(() => {
    return (id: number) => filters.value.find((filter) => filter.id === id); // assuming your ListingListener type has an 'id' property.
  });

  const getFilterOptions = computed(() => filterOptions.value);

  async function loadFilters() {
    const user = userStore.getUser;

    if (!user) {
      console.error("No user found, can not load filters");
      return;
    }

    if (!userStore.token) {
      console.error("No token found, can not load filters");
      return;
    }

    const apiToken = `Bearer ${userStore.token}`;

    const loadedFilters = await getFilters({
      composable: '$fetch',
      headers: { Authorization: apiToken },
    })


    if (!loadedFilters) {
      console.error("No filters found");
      return;
    }

    filters.value = loadedFilters;
  }

  async function saveFilter(filterToCreate: ListingListener) {
    try {
      const user = userStore.getUser;

      if (!user) {
        console.error("No user found, can not add filter");
        return;
      }

      if (!userStore.token) {
        console.error("No token found, can not add filter");
        return;
      }

      const apiToken = `Bearer ${userStore.token}`;

      await addFilter({
        composable: '$fetch',
        headers: { Authorization: apiToken },
        body: filterToCreate as any
      })

    } catch (e) {
      console.error("Error adding filter", e);
      throw e;
    }
  }

  async function loadFilterOptions() {
    try {
      const options = await getOptions({
        composable: '$fetch',
      })
      if (!options) {
        console.error("No filter options found");
        return;
      }
      const namedOptions: NamedOption[] = [];
      for (const [key, value] of Object.entries(options)) {
        namedOptions.push({ name: key, value });
      }
      filterOptions.value = namedOptions;
    } catch (e) {
      console.error("Error loading filter options", e);
      throw e;
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
    loadFilterOptions,
  }
});
