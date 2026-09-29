<template>
  <div
    class="relative px-6 py-4 border-b border-slate-800 space-y-3"
    role="group"
    :aria-label="$t('product.filters.groupLabel')"
    @keydown.esc="closePanels"
  >
    <div class="flex flex-wrap items-center gap-2">
      <!-- My country + country picker -->
      <div class="inline-flex items-stretch rounded-full overflow-hidden border" :class="active === 'country' ? 'border-blue-500/60' : 'border-slate-600/50'">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2"
          :class="active === 'country' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
          :aria-pressed="active === 'country'"
          data-testid="offer-filter-country"
          @click="emit('change', toggleQuickAction(state, 'country', country))"
        >
          <span aria-hidden="true">{{ countryFlag(country) }}</span>
          <span>{{ $t('product.filters.myCountry') }}: {{ countryName(country, locale) }}</span>
        </button>
        <select
          :value="country"
          :aria-label="$t('product.filters.changeCountry')"
          class="bg-slate-800 text-slate-300 text-sm border-l border-slate-600/50 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 max-w-[7rem]"
          @change="onCountrySelect"
        >
          <option
            v-for="code in countryChoices"
            :key="code"
            :value="code"
          >
            {{ countryFlag(code) }} {{ countryName(code, locale) }}
          </option>
        </select>
      </div>

      <!-- EU shipping -->
      <button
        type="button"
        class="px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2"
        :class="active === 'eu' ? 'bg-blue-600 text-white border-blue-500/60' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600/50'"
        :aria-pressed="active === 'eu'"
        data-testid="offer-filter-eu"
        @click="emit('change', toggleQuickAction(state, 'eu', country))"
      >
        <Icon
          name="tabler:truck-delivery"
          class="w-4 h-4"
        />
        {{ $t('product.filters.euShipping') }}
      </button>

      <!-- Nearby + popover -->
      <div class="sm:relative">
        <button
          ref="nearbyButton"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2"
          :class="active === 'nearby' ? 'bg-blue-600 text-white border-blue-500/60' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600/50'"
          :aria-pressed="active === 'nearby'"
          aria-haspopup="dialog"
          :aria-expanded="nearbyOpen"
          data-testid="offer-filter-nearby"
          @click="onNearbyClick"
        >
          <Icon
            name="tabler:map-pin"
            class="w-4 h-4"
          />
          {{ $t('product.filters.nearby') }}
        </button>
        <div
          v-if="nearbyOpen"
          class="absolute inset-x-6 sm:inset-x-auto sm:left-0 z-30 mt-2 sm:w-72 rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl p-4 space-y-3"
          role="dialog"
          :aria-label="$t('product.filters.nearbyTitle', { km: NEARBY_DISTANCE_KM })"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-medium text-slate-200">
              {{ $t('product.filters.nearbyTitle', { km: NEARBY_DISTANCE_KM }) }}
            </p>
            <button
              type="button"
              class="text-slate-400 hover:text-white"
              :aria-label="$t('product.filters.close')"
              @click="closePanels(true)"
            >
              <Icon
                name="tabler:x"
                class="w-4 h-4"
              />
            </button>
          </div>
          <form
            class="space-y-2"
            @submit.prevent="submitZip"
          >
            <label
              class="text-xs text-slate-400 block"
              for="offer-zip-country"
            >{{ $t('product.filters.zipCountryLabel') }}</label>
            <select
              id="offer-zip-country"
              v-model="zipCountry"
              class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none"
            >
              <option
                v-for="code in countryChoices"
                :key="code"
                :value="code"
              >
                {{ countryFlag(code) }} {{ countryName(code, locale) }}
              </option>
            </select>
            <label
              class="text-xs text-slate-400 block"
              for="offer-zip"
            >{{ $t('product.filters.zipLabel') }}</label>
            <div class="flex gap-2">
              <input
                id="offer-zip"
                ref="zipInput"
                v-model="zip"
                type="text"
                inputmode="numeric"
                autocomplete="postal-code"
                :placeholder="$t('product.filters.zipPlaceholder')"
                class="w-full min-w-0 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                :aria-invalid="!!shownZipError"
                aria-describedby="offer-zip-error"
              >
              <button
                type="submit"
                class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                :disabled="!zip.trim() || loading"
                :aria-label="$t('product.filters.zipSubmit')"
              >
                <Icon
                  name="tabler:search"
                  class="w-4 h-4"
                />
              </button>
            </div>
            <p
              id="offer-zip-error"
              class="text-xs text-red-400"
              role="alert"
            >
              {{ shownZipError }}
            </p>
          </form>
          <p class="text-center text-xs text-slate-500">
            {{ $t('product.filters.or') }}
          </p>
          <button
            type="button"
            class="w-full px-3 py-2 rounded-lg text-sm bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/50 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            :disabled="locating"
            @click="useMyLocation"
          >
            <Icon
              :name="locating ? 'tabler:loader-2' : 'tabler:current-location'"
              class="w-4 h-4"
              :class="{ 'animate-spin': locating }"
            />
            {{ $t('product.filters.useLocation') }}
          </button>
          <p
            v-if="locationError"
            class="text-xs text-red-400"
            role="alert"
          >
            {{ locationError }}
          </p>
        </div>
      </div>

      <!-- More filters -->
      <div class="sm:relative">
        <button
          ref="moreButton"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2"
          :class="moreCount ? 'bg-slate-700 text-white border-blue-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600/50'"
          aria-haspopup="dialog"
          :aria-expanded="moreOpen"
          data-testid="offer-filter-more"
          @click="toggleMore"
        >
          <Icon
            name="tabler:adjustments-horizontal"
            class="w-4 h-4"
          />
          {{ moreCount ? $t('product.filters.moreFiltersActive', { count: moreCount }) : $t('product.filters.moreFilters') }}
        </button>
        <div
          v-if="moreOpen"
          class="absolute inset-x-6 sm:inset-x-auto sm:left-0 z-30 mt-2 sm:w-72 max-h-96 overflow-y-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl p-4 space-y-4"
          role="dialog"
          :aria-label="$t('product.filters.moreFilters')"
        >
          <fieldset v-if="platformOptions.length">
            <legend class="text-xs text-slate-400 mb-2">
              {{ $t('product.filters.marketplaces') }}
            </legend>
            <label
              v-for="option in platformOptions"
              :key="option.name"
              class="flex items-center gap-2 py-1 text-sm text-slate-200 cursor-pointer"
            >
              <input
                type="checkbox"
                class="rounded text-blue-500 focus:ring-blue-500"
                :checked="state.platforms.includes(option.name)"
                @change="emit('change', { ...state, platforms: toggleListValue(state.platforms, option.name) })"
              >
              <span class="flex-1">{{ option.name }}</span>
              <span
                v-if="option.count !== null"
                class="text-xs text-slate-500"
              >{{ option.count }}</span>
            </label>
          </fieldset>
          <fieldset v-if="countryOptions.length">
            <legend class="text-xs text-slate-400 mb-2">
              {{ $t('product.filters.countries') }}
            </legend>
            <label
              v-for="option in countryOptions"
              :key="option.code"
              class="flex items-center gap-2 py-1 text-sm text-slate-200 cursor-pointer"
            >
              <input
                type="checkbox"
                class="rounded text-blue-500 focus:ring-blue-500"
                :checked="state.countries.includes(option.code)"
                @change="emit('change', { ...state, countries: toggleListValue(state.countries, option.code) })"
              >
              <span class="flex-1">{{ countryFlag(option.code) }} {{ countryName(option.code, locale) }}</span>
              <span
                v-if="option.count !== null"
                class="text-xs text-slate-500"
              >{{ option.count }}</span>
            </label>
          </fieldset>
        </div>
      </div>

      <button
        v-if="anyActive"
        type="button"
        class="px-3 py-2 text-sm text-slate-400 hover:text-white underline-offset-2 hover:underline"
        @click="emit('change', emptyOfferFilter())"
      >
        {{ $t('product.filters.reset') }}
      </button>
    </div>
    <p
      v-if="loading"
      class="text-xs text-slate-500"
      role="status"
    >
      {{ $t('product.filters.loading') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUserLocation } from '~/composable/useUserLocation'
import { countryFlag, countryName } from '~/utils/countryDetection'
import {
  NEARBY_DISTANCE_KM,
  activeQuickAction,
  applyNearby,
  changeMyCountry,
  emptyOfferFilter,
  hasActiveOfferFilter,
  moreFilterCount,
  toggleListValue,
  toggleQuickAction,
  type OfferFacets,
  type OfferFilterState,
} from '~/utils/offerFilters'

const props = defineProps<{
  state: OfferFilterState
  country: string
  /** null when the facets endpoint is unavailable: counts are hidden. */
  facets: OfferFacets | null
  loading?: boolean
  /** Message of a rejected zip code (400 from the API). */
  zipError?: string
}>()

const emit = defineEmits<{
  (e: 'change', state: OfferFilterState): void
  (e: 'country', code: string): void
}>()

const { locale, t } = useI18n()
const { readLastPosition, requestBrowserPosition } = useUserLocation()

const FALLBACK_PLATFORMS = ['Vinted', 'Kleinanzeigen', 'Ebay', 'Willhaben', 'Marktplaats']
const COMMON_COUNTRIES = ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'IT', 'ES', 'PL']

const nearbyOpen = ref(false)
const moreOpen = ref(false)
const zip = ref(props.state.zip)
// an explicit pick for the zip code wins, otherwise the zip code follows "My country"
const zipCountryPick = ref(props.state.zipCountry)
const zipCountry = computed({
  get: () => zipCountryPick.value || props.country,
  set: (value: string) => { zipCountryPick.value = value },
})
const locating = ref(false)
const locationError = ref('')
const nearbyButton = ref<HTMLButtonElement | null>(null)
const moreButton = ref<HTMLButtonElement | null>(null)
const zipInput = ref<HTMLInputElement | null>(null)

const active = computed(() => activeQuickAction(props.state, props.country))
const anyActive = computed(() => hasActiveOfferFilter(props.state))
const shownZipError = computed(() => props.zipError || '')

const countryChoices = computed(() => {
  // stable order: moving options around when the country changes confuses the selects
  const codes = new Set<string>([...COMMON_COUNTRIES, props.country])
  for (const entry of props.facets?.countries ?? []) codes.add(entry.code)
  return [...codes].filter(code => code !== 'EU')
})

const platformOptions = computed(() => {
  const selected = props.state.platforms
  const base = props.facets
    ? props.facets.platforms.map(p => ({ name: p.name, count: p.count as number | null }))
    : FALLBACK_PLATFORMS.map(name => ({ name, count: null as number | null }))
  // keep a selected option visible even when the facets do not list it (zero offers)
  for (const name of selected) {
    if (!base.some(o => o.name === name)) base.push({ name, count: null })
  }
  return base
})

const countryOptions = computed(() => {
  const base = props.facets
    ? props.facets.countries.map(c => ({ code: c.code, count: c.count as number | null }))
    : COMMON_COUNTRIES.map(code => ({ code, count: null as number | null }))
  for (const code of props.state.countries) {
    if (code !== 'EU' && !base.some(o => o.code === code)) base.push({ code, count: null })
  }
  return base
})

const moreCount = computed(() => moreFilterCount(props.state, props.country))

watch(() => props.state.zip, (value) => {
  if (value) zip.value = value
})

// a zip code was accepted: close the popover once the offers came back without an error
watch(() => props.loading, (loading) => {
  if (!loading && nearbyOpen.value && !props.zipError && active.value === 'nearby') closePanels(true)
})

function onCountrySelect(event: Event) {
  const next = (event.target as HTMLSelectElement).value
  const changed = changeMyCountry(props.state, props.country, next)
  emit('country', next)
  if (changed !== props.state) emit('change', changed)
}

function closePanels(focusTrigger = false) {
  const hadNearby = nearbyOpen.value
  const hadMore = moreOpen.value
  nearbyOpen.value = false
  moreOpen.value = false
  if (focusTrigger === true || hadNearby || hadMore) {
    nextTick(() => (hadNearby ? nearbyButton.value : moreButton.value)?.focus())
  }
}

function toggleMore() {
  nearbyOpen.value = false
  moreOpen.value = !moreOpen.value
}

function onNearbyClick() {
  if (active.value === 'nearby') {
    nearbyOpen.value = false
    emit('change', applyClear())
    return
  }
  moreOpen.value = false
  nearbyOpen.value = !nearbyOpen.value
  if (nearbyOpen.value) nextTick(() => zipInput.value?.focus())
}

function applyClear(): OfferFilterState {
  return { ...props.state, zip: '', zipCountry: '', lat: undefined, lon: undefined, maxDistance: undefined }
}

function submitZip() {
  const value = zip.value.trim()
  if (!value) return
  emit('change', applyNearby(props.state, { zip: value, zipCountry: zipCountry.value }))
}

async function useMyLocation() {
  locating.value = true
  locationError.value = ''
  try {
    const position = await requestBrowserPosition().catch(() => readLastPosition())
    if (!position) {
      locationError.value = t('product.filters.locatingFailed')
      return
    }
    nearbyOpen.value = false
    emit('change', applyNearby(props.state, position))
    nextTick(() => nearbyButton.value?.focus())
  }
  finally {
    locating.value = false
  }
}

// close the popovers when clicking elsewhere
function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null
  const root = nearbyButton.value?.closest('[role="group"]')
  if (root && target && !root.contains(target)) {
    nearbyOpen.value = false
    moreOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>
