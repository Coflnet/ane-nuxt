<template>
  <div class="container mx-auto px-4 py-6 sm:py-8">
    <!-- Hero Section -->
    <div
      class="text-center"
      :class="isSearchMode ? 'mb-6 pt-2 sm:mb-8 sm:pt-4' : 'mb-10 pt-6 sm:mb-14 sm:pt-10'"
    >
      <h1
        class="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-normal break-words"
        :class="isSearchMode ? 'text-2xl md:text-3xl mb-4' : 'text-3xl md:text-4xl lg:text-5xl mb-6'"
      >
        {{ $t('findBestDeals', 'Find the Best Second-Hand Deals') }}
      </h1>
      <p
        v-if="!isSearchMode"
        class="text-base md:text-lg text-slate-400 mb-8 max-w-2xl mx-auto"
      >
        {{ $t('homeSubtitle', 'Compare prices across multiple marketplaces. Save money and the planet.') }}
      </p>

      <ProductSearch
        :initial-query="searchQuery"
        @search="onSearch"
        @select-category="onSearchCategorySelect"
      />
    </div>

    <!-- Results Section (if searching) -->
    <div
      v-if="loading || products.length > 0 || hasSearched"
      class="max-w-7xl mx-auto"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2
          class="text-2xl font-semibold text-slate-200 min-w-0 break-words"
          aria-live="polite"
        >
          <span v-if="loading && products.length === 0">{{ $t('searching', 'Searching...') }}</span>
          <span v-else-if="searchError && products.length === 0">{{ $t('searchFailed', 'Search failed') }}</span>
          <span v-else-if="products.length > 0">
            {{ $t('searchResults', 'Search Results') }}
            <span
              v-if="totalResults"
              class="text-slate-400 text-lg ml-2"
            >({{ formattedTotalResults }} {{ $t('found', 'found') }})</span>
          </span>
          <span v-else-if="searchQuery">{{ $t('noResultsFor', { query: searchQuery }) }}</span>
          <span v-else>{{ $t('noResultsFound', 'No results found') }}</span>
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-200 bg-slate-800 border border-slate-600/50 hover:bg-slate-700 transition-colors"
            type="button"
            :aria-expanded="isFilterPanelOpen"
            @click="isFilterPanelOpen = !isFilterPanelOpen"
          >
            <Icon
              :name="isFilterPanelOpen ? 'tabler:x' : 'tabler:adjustments-horizontal'"
              class="w-4 h-4"
            />
            <span>{{ $t('filters', 'Filters') }}</span>
            <span
              v-if="hasActiveFilters"
              class="h-2 w-2 rounded-full bg-blue-400"
            />
          </button>
          <!-- Sort switch -->
          <div
            role="radiogroup"
            :aria-label="$t('sortBy', 'Sort by')"
            class="inline-flex max-w-full overflow-x-auto rounded-lg border border-slate-600/50 bg-slate-800 p-0.5 text-sm"
            data-testid="sort-switch"
          >
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              role="radio"
              :aria-checked="activeSort === option.value"
              class="whitespace-nowrap rounded-md px-3 py-1 transition-colors"
              :class="activeSort === option.value ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'"
              @click="onSortSelect(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      <!-- How the query was understood (e.g. "cheap" → sorted by price) -->
      <div
        v-if="queryHints.length > 0"
        class="flex flex-wrap items-center gap-2 mb-4 text-sm text-slate-400"
        data-testid="search-interpretation"
      >
        <Icon
          name="tabler:info-circle"
          class="w-4 h-4 text-blue-400 shrink-0"
        />
        <span
          v-for="hint in queryHints"
          :key="hint.key"
          class="inline-flex items-center gap-2"
        >
          <span>{{ hint.text }}</span>
          <button
            v-if="hint.action"
            type="button"
            class="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            @click="hint.action.run"
          >{{ hint.action.label }}</button>
        </span>
      </div>
      <!-- Active filters badges -->
      <div class="flex flex-wrap gap-2 mb-4">
        <!-- Distance filter badge -->
        <span
          v-if="selectedMaxDistance"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/30"
        >
          ≤ {{ selectedMaxDistance }} km
          <button
            class="ml-1 hover:text-white"
            @click="clearDistanceFilter"
          >&times;</button>
        </span>
        <span
          v-if="selectedCategory"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30"
        >
          {{ localizeCategory(selectedCategory) }}
          <button
            class="ml-1 hover:text-white"
            @click="clearFilter('category')"
          >&times;</button>
        </span>
        <span
          v-if="selectedCondition"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30"
        >
          {{ localizeCondition(selectedCondition) }}
          <button
            class="ml-1 hover:text-white"
            @click="clearFilter('condition')"
          >&times;</button>
        </span>
        <span
          v-if="selectedMinPrice || selectedMaxPrice"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30"
        >
          {{ $t('price', 'Price') }}: {{ selectedMinPrice ? formatPrice(selectedMinPrice) : '€0' }} – {{ selectedMaxPrice ? formatPrice(selectedMaxPrice) : '∞' }}
          <button
            class="ml-1 hover:text-white"
            @click="clearPriceFilter"
          >&times;</button>
        </span>
        <span
          v-for="(value, key) in activeAttributeFilters"
          :key="key"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
        >
          {{ localizeAttrKey(String(key)) }}: {{ localizeAttrValue(String(key), value) }}
          <button
            class="ml-1 hover:text-white"
            @click="removeAttributeFilter(String(key))"
          >&times;</button>
        </span>
        <span
          v-if="selectedOsVersionMin || selectedOsVersionSupports"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
        >
          {{ localizeAttrKey('os_version') }}: {{ selectedOsVersionMin ? `${selectedOsVersionMin}+` : $t('osVersionRuns', { version: selectedOsVersionSupports }) }}
          <button
            class="ml-1 hover:text-white"
            @click="clearOsVersion"
          >&times;</button>
        </span>
        <span
          v-if="selectedReleaseYearMin !== undefined || selectedReleaseYearMax !== undefined"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
        >
          {{ localizeAttrKey('release_year') }}: {{ selectedReleaseYearMin ?? '…' }} – {{ selectedReleaseYearMax ?? '…' }}
          <button
            class="ml-1 hover:text-white"
            @click="clearRange('release_year')"
          >&times;</button>
        </span>
        <span
          v-if="selectedScreenSizeMin !== undefined || selectedScreenSizeMax !== undefined"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
        >
          {{ localizeAttrKey('screen_size') }}: {{ selectedScreenSizeMin ?? '…' }}&quot; – {{ selectedScreenSizeMax ?? '…' }}&quot;
          <button
            class="ml-1 hover:text-white"
            @click="clearRange('screen_size')"
          >&times;</button>
        </span>
        <!-- Battery range badge -->
        <span
          v-if="selectedBatteryMin || selectedBatteryMax"
          class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30"
        >
          {{ localizeAttrKey('battery') }}: {{ selectedBatteryMin ?? batteryRangeMin }}% – {{ selectedBatteryMax ?? batteryRangeMax }}%
          <button
            class="ml-1 hover:text-white"
            @click="() => { batteryFilterMin = batteryRangeMin; batteryFilterMax = batteryRangeMax; const q = { ...route.query } as Record<string, string>; delete q.attr_battery_min; delete q.attr_battery_max; router.push({ query: q }) }"
          >&times;</button>
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <!-- Sidebar Filters -->
        <div
          class="lg:col-span-1 space-y-4 min-w-0 overflow-hidden"
          :class="isFilterPanelOpen ? 'block' : 'hidden lg:block'"
        >
          <!-- Category Filter -->
          <div
            v-if="availableCategoryBuckets.length > 0"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ $t('category', 'Category') }}
            </h3>
            <div class="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
              <button
                v-for="(bucket, index) in availableCategoryBuckets"
                :key="bucket.value ?? `category-${index}`"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors min-w-0 max-w-full sm:max-w-[220px]"
                :class="isCategorySelected(bucket.value!) ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleFilter('category', toUrlSlug(bucket.value!) || bucket.value!)"
              >
                <span class="truncate">{{ localizeCategory(bucket.value!) }}</span>
                <span class="text-xs opacity-60 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
          </div>

          <!-- Condition Filter -->
          <div
            v-if="availableConditionBuckets.length > 0"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ $t('condition', 'Condition') }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(bucket, index) in availableConditionBuckets"
                :key="bucket.value ?? `condition-${index}`"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors min-w-0 max-w-full sm:max-w-[220px]"
                :class="selectedCondition === bucket.value ? 'bg-green-500/20 text-green-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleFilter('condition', bucket.value!)"
              >
                <span class="truncate">{{ localizeCondition(bucket.value!) }}</span>
                <span class="text-xs opacity-60 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
          </div>

          <!-- Price Range Filter -->
          <div
            v-if="hasSearched"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ $t('price', 'Price') }}
            </h3>
            <div
              v-if="priceRangeMax > 0"
              class="space-y-3"
            >
              <div class="flex items-center gap-2">
                <div class="relative flex-1 min-w-0">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                  <input
                    v-model.number="priceFilterMin"
                    type="number"
                    :min="0"
                    :max="priceFilterMax"
                    :placeholder="Math.floor(priceRangeMin).toString()"
                    class="w-full pl-6 pr-1 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    @change="applyPriceFilter"
                  >
                </div>
                <span class="text-slate-500 text-xs flex-shrink-0">–</span>
                <div class="relative flex-1 min-w-0">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">€</span>
                  <input
                    v-model.number="priceFilterMax"
                    type="number"
                    :min="priceFilterMin"
                    :max="priceRangeMax"
                    :placeholder="Math.ceil(priceRangeMax).toString()"
                    class="w-full pl-6 pr-1 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    @change="applyPriceFilter"
                  >
                </div>
              </div>
              <!-- Dual range slider -->
              <div class="relative h-6 flex items-center">
                <div class="absolute inset-x-0 h-1 bg-slate-700 rounded-full" />
                <div
                  class="absolute h-1 bg-blue-500 rounded-full"
                  :style="{
                    left: `${(priceFilterMin - priceRangeMin) / (priceRangeMax - priceRangeMin) * 100}%`,
                    right: `${100 - (priceFilterMax - priceRangeMin) / (priceRangeMax - priceRangeMin) * 100}%`,
                  }"
                />
                <input
                  :value="priceFilterMin"
                  type="range"
                  :min="Math.floor(priceRangeMin)"
                  :max="Math.ceil(priceRangeMax)"
                  :step="priceSliderStep"
                  class="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
                  @input="(e: Event) => { priceFilterMin = Math.min(Number((e.target as HTMLInputElement).value), priceFilterMax - priceSliderStep) }"
                  @change="applyPriceFilter"
                >
                <input
                  :value="priceFilterMax"
                  type="range"
                  :min="Math.floor(priceRangeMin)"
                  :max="Math.ceil(priceRangeMax)"
                  :step="priceSliderStep"
                  class="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
                  @input="(e: Event) => { priceFilterMax = Math.max(Number((e.target as HTMLInputElement).value), priceFilterMin + priceSliderStep) }"
                  @change="applyPriceFilter"
                >
              </div>
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ formatPrice(priceRangeMin) }}</span>
                <span>{{ formatPrice(priceRangeMax) }}</span>
              </div>
            </div>
            <div
              v-else
              class="space-y-3 animate-pulse"
            >
              <div class="flex items-center gap-2">
                <div class="flex-1 h-8 bg-slate-700/50 rounded-lg" />
                <span class="text-slate-500 text-xs">–</span>
                <div class="flex-1 h-8 bg-slate-700/50 rounded-lg" />
              </div>
              <div class="h-6 bg-slate-700/30 rounded-full" />
            </div>
          </div>

          <!-- Attribute Filters -->
          <div
            v-for="(buckets, attrKey) in availableAttributeBuckets"
            :key="attrKey"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ localizeAttrKey(attrKey) }}
            </h3>
            <div class="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
              <button
                v-for="(bucket, index) in buckets.slice(0, 15)"
                :key="bucket.value ?? `${attrKey}-${index}`"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors min-w-0 max-w-full sm:max-w-[220px]"
                :class="activeAttributeFilters[attrKey] === bucket.value ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleAttributeFilter(attrKey, bucket.value!)"
              >
                <span class="truncate">{{ localizeAttrValue(attrKey, bucket.value!) }}</span>
                <span class="text-xs opacity-60 ml-1 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
          </div>

          <!-- Operating system -->
          <div
            v-if="hasOsFilter"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
            data-testid="os-filter"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ localizeAttrKey('os') }}
            </h3>
            <div class="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
              <button
                v-for="bucket in osBuckets"
                :key="`os-${bucket.value}`"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors min-w-0 max-w-full sm:max-w-[220px]"
                :class="selectedOs === bucket.value ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                @click="toggleOs(bucket.value!)"
              >
                <span class="truncate">{{ bucket.value }}</span>
                <span class="text-xs opacity-60 ml-1 flex-shrink-0">({{ bucket.count }})</span>
              </button>
            </div>
            <template v-if="osVersionBuckets.length > 0 || selectedOsVersionValue">
              <div class="flex items-center justify-between mt-4 mb-2">
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {{ localizeAttrKey('os_version') }}
                </h4>
                <label class="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    class="accent-purple-500"
                    :checked="osVersionOrNewer"
                    data-testid="os-version-or-newer"
                    @change="toggleOsVersionOrNewer"
                  >
                  {{ $t('orNewer', 'or newer') }}
                </label>
              </div>
              <div class="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                <button
                  v-for="bucket in osVersionBuckets"
                  :key="`os-version-${bucket.value}`"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors min-w-0"
                  :class="selectedOsVersionValue === bucket.value ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'"
                  @click="toggleOsVersion(bucket.value!)"
                >
                  <span class="truncate">{{ bucket.value }}{{ osVersionOrNewer ? '+' : '' }}</span>
                  <span class="text-xs opacity-60 ml-1 flex-shrink-0">({{ bucket.count }})</span>
                </button>
              </div>
            </template>
          </div>

          <!-- Screen size range (inches) -->
          <FiltersNumberRangeFilter
            v-if="screenSizeBounds && screenSizeBounds.min < screenSizeBounds.max"
            :title="localizeAttrKey('screen_size')"
            :bounds="screenSizeBounds"
            :selected-min="selectedScreenSizeMin"
            :selected-max="selectedScreenSizeMax"
            :step="0.1"
            unit="&quot;"
            test-id="screen-size"
            @apply="range => applyRange('screen_size', range, screenSizeBounds)"
          />

          <!-- Release year range -->
          <FiltersNumberRangeFilter
            v-if="releaseYearBounds && releaseYearBounds.min < releaseYearBounds.max"
            :title="localizeAttrKey('release_year')"
            :bounds="releaseYearBounds"
            :selected-min="selectedReleaseYearMin"
            :selected-max="selectedReleaseYearMax"
            test-id="release-year"
            @apply="range => applyRange('release_year', range, releaseYearBounds)"
          />

          <!-- Battery Range Filter -->
          <div
            v-if="hasBatteryBuckets"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ localizeAttrKey('battery') }}
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="relative flex-1 min-w-0">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                  <input
                    v-model.number="batteryFilterMin"
                    type="number"
                    :min="0"
                    :max="batteryFilterMax"
                    placeholder="0"
                    class="w-full pl-6 pr-1 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    @change="applyBatteryFilter"
                  >
                </div>
                <span class="text-slate-500 text-xs flex-shrink-0">–</span>
                <div class="relative flex-1 min-w-0">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                  <input
                    v-model.number="batteryFilterMax"
                    type="number"
                    :min="batteryFilterMin"
                    :max="100"
                    placeholder="100"
                    class="w-full pl-6 pr-1 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    @change="applyBatteryFilter"
                  >
                </div>
              </div>
              <!-- Dual range slider -->
              <div class="relative h-6 flex items-center">
                <div class="absolute inset-x-0 h-1 bg-slate-700 rounded-full" />
                <div
                  class="absolute h-1 bg-purple-500 rounded-full"
                  :style="{
                    left: `${(batteryFilterMin - batteryRangeMin) / (batteryRangeMax - batteryRangeMin) * 100}%`,
                    right: `${100 - (batteryFilterMax - batteryRangeMin) / (batteryRangeMax - batteryRangeMin) * 100}%`,
                  }"
                />
                <input
                  :value="batteryFilterMin"
                  type="range"
                  :min="batteryRangeMin"
                  :max="batteryRangeMax"
                  step="1"
                  class="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
                  @input="(e: Event) => { batteryFilterMin = Math.min(Number((e.target as HTMLInputElement).value), batteryFilterMax - 1) }"
                  @change="applyBatteryFilter"
                >
                <input
                  :value="batteryFilterMax"
                  type="range"
                  :min="batteryRangeMin"
                  :max="batteryRangeMax"
                  step="1"
                  class="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
                  @input="(e: Event) => { batteryFilterMax = Math.max(Number((e.target as HTMLInputElement).value), batteryFilterMin + 1) }"
                  @change="applyBatteryFilter"
                >
              </div>
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ batteryRangeMin }}%</span>
                <span>{{ batteryRangeMax }}%</span>
              </div>
            </div>
          </div>

          <!-- Distance Filter -->
          <div
            v-if="hasSearched"
            class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
          >
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              {{ $t('distance', 'Distance') }}
            </h3>
            <div class="space-y-3">
              <!-- Country shortcut -->
              <div>
                <label class="text-xs text-slate-400 mb-1 block">{{ $t('country', 'Country') }}</label>
                <select
                  :value="selectedCountryCode"
                  class="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none"
                  @change="onCountrySelect($event)"
                >
                  <option value="">
                    {{ $t('anyCountry', 'Any country') }}
                  </option>
                  <option value="DE">
                    {{ $t('countryDE', 'Germany') }}
                  </option>
                  <option value="AT">
                    {{ $t('countryAT', 'Austria') }}
                  </option>
                  <option value="CH">
                    {{ $t('countryCH', 'Switzerland') }}
                  </option>
                  <option value="NL">
                    {{ $t('countryNL', 'Netherlands') }}
                  </option>
                  <option value="BE">
                    {{ $t('countryBE', 'Belgium') }}
                  </option>
                  <option value="FR">
                    {{ $t('countryFR', 'France') }}
                  </option>
                </select>
              </div>
              <!-- ZIP code input: min-w-0 lets the input shrink so the button stays inside the card -->
              <div class="flex items-center gap-2 min-w-0">
                <input
                  v-model="zipCodeInput"
                  type="text"
                  inputmode="numeric"
                  :placeholder="$t('enterZip', 'PLZ / ZIP code')"
                  :aria-label="$t('enterZip', 'PLZ / ZIP code')"
                  class="flex-1 min-w-0 w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none placeholder-slate-500"
                  @keydown.enter="lookupZipCode"
                >
                <button
                  type="button"
                  class="px-3 py-2 rounded-lg text-sm bg-cyan-600/30 text-cyan-400 hover:bg-cyan-600/50 border border-cyan-500/30 transition-colors flex-shrink-0"
                  :aria-label="$t('apply', 'Apply')"
                  :disabled="!zipCodeInput || zipLoading"
                  @click="lookupZipCode"
                >
                  <Icon
                    v-if="zipLoading"
                    name="tabler:loader-2"
                    class="w-4 h-4 animate-spin"
                  />
                  <Icon
                    v-else
                    name="tabler:map-pin"
                    class="w-4 h-4"
                  />
                </button>
              </div>
              <!-- Location status -->
              <div
                v-if="locationName"
                class="text-xs text-green-400 flex items-center gap-1"
              >
                <Icon
                  name="tabler:map-pin"
                  class="w-3.5 h-3.5"
                />
                <span>{{ locationName }}</span>
              </div>
              <div
                v-else-if="zipError"
                class="text-xs text-red-400"
              >
                {{ zipError }}
              </div>
              <!-- Or use browser geolocation -->
              <button
                class="w-full px-3 py-2 rounded-lg text-sm transition-colors"
                :class="userLocation && !locationName ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-600/50'"
                @click="requestLocation"
              >
                <span class="inline-flex items-center justify-center gap-2">
                  <Icon
                    name="tabler:current-location"
                    class="w-4 h-4"
                  />
                  <span v-if="userLocation && !locationName">{{ $t('locationSet', 'Location set') }}</span>
                  <span v-else>{{ $t('useMyLocation', 'Use my location') }}</span>
                </span>
              </button>
              <div
                v-if="userLocation"
                class="space-y-2"
              >
                <label class="text-xs text-slate-400">{{ $t('maxDistance', 'Max distance (km)') }}</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="distanceFilterKm"
                    type="number"
                    :min="1"
                    :max="500"
                    placeholder="50"
                    class="w-full min-w-0 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    @change="applyDistanceFilter"
                  >
                  <span class="text-xs text-slate-500 flex-shrink-0">km</span>
                </div>
                <input
                  :value="distanceFilterKm"
                  type="range"
                  :min="5"
                  :max="500"
                  :step="5"
                  class="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-slate-700 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:-mt-1.5 [&::-moz-range-track]:bg-slate-700 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-1 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
                  @input="(e: Event) => { distanceFilterKm = Number((e.target as HTMLInputElement).value) }"
                  @change="applyDistanceFilter"
                >
              </div>
            </div>
          </div>

          <!-- Clear all filters -->
          <button
            v-if="hasActiveFilters"
            class="w-full px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
            @click="clearAllFilters"
          >
            {{ $t('clearAllFilters', 'Clear All Filters') }}
          </button>
        </div>

        <!-- Product Grid -->
        <div
          class="lg:col-span-3"
          :aria-busy="loading"
        >
          <!-- Skeleton mirrors the card layout so results do not jump in -->
          <div
            v-if="loading && products.length === 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="search-skeleton"
          >
            <div
              v-for="i in 6"
              :key="i"
              class="bg-slate-800 rounded-xl overflow-hidden animate-pulse"
            >
              <div class="aspect-video bg-slate-700/40" />
              <div class="p-5 space-y-3">
                <div class="h-5 bg-slate-700/50 rounded w-5/6" />
                <div class="h-5 bg-slate-700/50 rounded w-3/5" />
                <div class="flex gap-1.5 pt-1">
                  <div class="h-4 w-16 bg-slate-700/40 rounded" />
                  <div class="h-4 w-12 bg-slate-700/40 rounded" />
                </div>
                <div class="flex items-center justify-between pt-3">
                  <div class="h-7 w-24 bg-slate-700/50 rounded" />
                  <div class="h-6 w-16 bg-slate-700/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <!-- Error state -->
          <div
            v-else-if="searchError && products.length === 0"
            class="bg-slate-800/50 border border-red-500/30 rounded-xl p-8 text-center"
            role="alert"
            data-testid="search-error"
          >
            <Icon
              name="tabler:alert-triangle"
              class="w-10 h-10 text-red-400 mx-auto mb-3"
            />
            <p class="text-slate-200 font-medium mb-1">
              {{ $t('searchFailed', 'Search failed') }}
            </p>
            <p class="text-sm text-slate-400 mb-5">
              {{ $t('searchFailedHint', 'The search service did not respond. Please try again in a moment.') }}
            </p>
            <button
              type="button"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
              @click="performSearch()"
            >
              {{ $t('retry', 'Try again') }}
            </button>
          </div>

          <div
            v-else-if="products.length > 0"
            class="transition-opacity duration-150"
            :class="{ 'opacity-50 pointer-events-none': manualLoading }"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NuxtLink
                v-for="product in products"
                :key="product.seoId ?? 'unknown'"
                :to="localePath(`/product/${product.seoId}${buildProductLink()}`)"
                class="block bg-slate-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all hover:scale-[1.02] group"
              >
                <div class="aspect-video bg-slate-900 relative">
                  <ProductImage
                    :src="product.imageUrl"
                    :alt="productDisplayName(product)"
                    image-class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                    <span
                      v-if="getDisplayCategory(product)"
                      class="text-xs font-medium text-blue-400 uppercase tracking-wider"
                    >
                      {{ localizeCategory(getDisplayCategory(product)!) }}
                    </span>
                  </div>
                </div>
                <div class="p-5">
                  <span
                    v-if="isGameCaseProduct(product)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    data-testid="empty-case-badge"
                  >{{ $t('product.relations.emptyCaseBadge') }}</span>
                  <h3 class="text-lg font-semibold text-slate-100 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {{ productDisplayName(product) }}
                  </h3>

                  <!-- Top Attributes -->
                  <div
                    v-if="getTopAttributes(product).length > 0"
                    class="flex flex-wrap gap-1.5 mt-2 mb-2 min-h-[24px]"
                  >
                    <span
                      v-for="(attr, index) in getTopAttributes(product)"
                      :key="attr.key ?? `attr-${index}`"
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 truncate max-w-full"
                    >
                      <span class="opacity-70 mr-1 shrink-0">{{ localizeAttrKey(attr.key ?? '') }}:</span>
                      <span class="truncate">{{ localizeAttrValue(attr.key ?? '', attr.value ?? '') }}</span>
                    </span>
                  </div>

                  <div class="flex items-center justify-between mt-4">
                    <div class="text-sm text-slate-400">
                      <span class="block text-xs">{{ $t('startingFrom', 'Starting from') }}</span>
                      <span class="text-lg font-bold text-green-400">
                        {{ product.minPrice ? formatPrice(product.minPrice) : $t('checkPrice', 'Check Price') }}
                      </span>
                    </div>
                    <div class="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                      {{ $t('details', 'Details') }} &rarr;
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <!-- Load More / Pagination -->
            <div
              v-if="canLoadMore && allProducts.length >= AUTO_LOAD_MAX"
              class="flex justify-center mt-8"
            >
              <button
                class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loadingMore"
                @click="loadMore"
              >
                <span v-if="loadingMore">{{ $t('loading', 'Loading...') }}</span>
                <span v-else>{{ $t('loadMore', 'Load More') }} ({{ allProducts.length }} / {{ formattedTotalResults }})</span>
              </button>
            </div>
            <!-- Infinite scroll sentinel (auto-loads until AUTO_LOAD_MAX) -->
            <div
              v-if="canLoadMore && allProducts.length < AUTO_LOAD_MAX"
              ref="scrollSentinel"
              class="flex justify-center mt-8 py-4"
            >
              <div
                v-if="loadingMore"
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
              />
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="hasSearched"
            class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center"
            data-testid="search-empty"
          >
            <Icon
              name="tabler:search-off"
              class="w-10 h-10 text-slate-500 mx-auto mb-3"
            />
            <p class="text-slate-200 font-medium mb-1">
              <template v-if="searchQuery">
                {{ $t('noResultsFor', { query: searchQuery }) }}
              </template>
              <template v-else>
                {{ $t('noResultsFound', 'No results found') }}
              </template>
            </p>
            <p class="text-sm text-slate-400 mb-5">
              {{ $t('noResultsHint', 'Check the spelling, use fewer words or remove filters.') }}
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <button
                v-if="hasActiveFilters"
                type="button"
                class="px-3 py-1.5 rounded-full text-sm bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                @click="clearAllFilters"
              >
                {{ $t('clearAllFilters', 'Clear All Filters') }}
              </button>
              <NuxtLink
                v-for="alternative in alternativeQueries"
                :key="alternative"
                :to="localePath({ path: '/search', query: { q: alternative } })"
                class="px-3 py-1.5 rounded-full text-sm bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
              >
                {{ $t('tryQuery', { query: alternative }) }}
              </NuxtLink>
              <NuxtLink
                :to="localePath('/search')"
                class="px-3 py-1.5 rounded-full text-sm bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 transition-colors"
              >
                {{ $t('browseAllCategories', 'Show all categories') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Browser (Default View) -->
    <div
      v-else
      class="max-w-6xl mx-auto mt-20"
    >
      <!-- Breadcrumb for category navigation -->
      <div
        v-if="browsePath.length > 0"
        class="flex items-center gap-2 mb-6 text-sm text-slate-400"
      >
        <button
          class="hover:text-white transition-colors"
          @click="browsePath = []; browseSubCats = []"
        >
          {{ $t('allCategories', 'All Categories') }}
        </button>
        <template
          v-for="(seg, idx) in browsePath"
          :key="seg.slug"
        >
          <Icon
            name="tabler:chevron-right"
            class="w-4 h-4"
          />
          <button
            class="hover:text-white transition-colors"
            :class="{ 'text-blue-400 font-medium': idx === browsePath.length - 1 }"
            @click="navigateToBreadcrumb(idx)"
          >
            {{ seg.label }}
          </button>
        </template>
      </div>

      <h2 class="text-2xl font-bold text-center text-slate-300 mb-10">
        {{ currentBrowseLabel }}
      </h2>

      <!-- Category grid from unified categories API -->
      <div
        v-if="loadingCategories"
        class="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="h-24 bg-slate-800/50 rounded-xl animate-pulse"
        />
      </div>
      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <button
          v-for="cat in displayCategories"
          :key="cat.slug"
          class="p-6 bg-slate-800/30 hover:bg-slate-800 rounded-xl transition-colors text-center group relative"
          @click="onUnifiedCategoryClick(cat)"
        >
          <div class="mb-2 inline-flex p-3 rounded-full bg-slate-700/50 group-hover:scale-110 transition-transform text-blue-400">
            <Icon
              :name="getCategoryIcon(cat.slug, cat.label)"
              class="w-8 h-8"
            />
          </div>
          <div class="font-medium text-slate-200">
            {{ cat.label }}
          </div>
          <div
            v-if="getCategoryProductCount(cat) > 0"
            class="text-xs text-blue-400/70 mt-1"
          >
            {{ formatCount(getCategoryProductCount(cat)) }} {{ $t('products', 'products') }}
          </div>
          <div
            v-else-if="populatedSubCategoryCount(cat) > 0"
            class="text-xs text-slate-500 mt-1"
          >
            {{ populatedSubCategoryCount(cat) }} {{ $t('subcategories', 'subcategories') }}
          </div>
        </button>
        <!-- Reduced launch scope: explain why other categories are missing -->
        <button
          v-if="browsePath.length === 0"
          ref="moreCategoriesTile"
          type="button"
          class="p-6 bg-slate-800/30 hover:bg-slate-800 rounded-xl transition-colors text-center group relative border border-dashed border-slate-700"
          aria-haspopup="dialog"
          data-testid="more-categories-tile"
          @click="showMoreCategoriesDialog = true"
        >
          <div class="mb-2 inline-flex p-3 rounded-full bg-slate-700/50 group-hover:scale-110 transition-transform text-slate-400">
            <Icon
              name="tabler:category-plus"
              class="w-8 h-8"
            />
          </div>
          <div class="font-medium text-slate-200">
            {{ $t('moreCategories', 'Other / more categories') }}
          </div>
          <div class="text-xs text-slate-500 mt-1">
            {{ $t('moreCategoriesHint', 'Missing your category?') }}
          </div>
        </button>
      </div>

      <!-- Browse products in selected category -->
      <div
        v-if="browsePath.length > 0"
        class="mt-8 text-center"
      >
        <button
          class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
          @click="searchInCurrentCategory"
        >
          {{ $t('showProducts', 'Show Products') }} — {{ selectedBrowseLabel }}
        </button>
      </div>

      <!-- "Other / more categories" dialog -->
      <Teleport to="body">
        <div
          v-if="showMoreCategoriesDialog"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          @click.self="showMoreCategoriesDialog = false"
          @keydown.esc="showMoreCategoriesDialog = false"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-categories-title"
            aria-describedby="more-categories-text"
            class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700"
          >
            <h3
              id="more-categories-title"
              class="text-lg font-bold text-white mb-3"
            >
              {{ $t('moreCategoriesTitle', 'Why only these categories?') }}
            </h3>
            <p
              id="more-categories-text"
              class="text-sm text-slate-300 leading-relaxed"
            >
              {{ $t('moreCategoriesText') }}
            </p>
            <div class="flex gap-3 mt-5">
              <button
                ref="moreCategoriesCloseButton"
                type="button"
                class="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                @click="showMoreCategoriesDialog = false"
              >
                {{ $t('moreCategoriesClose', 'Close') }}
              </button>
              <a
                :href="supportDiscordUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Icon
                  name="tabler:brand-discord"
                  class="w-4 h-4"
                />
                {{ $t('moreCategoriesContact', 'Contact us on Discord') }}
              </a>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { searchProducts } from '~/src/api-client'
import type { ProductAttribute, ProductDocument, FilterBucket, SearchProductsResponse } from '~/src/api-client/types.gen'
import { useCategories } from '~/composable/useCategories'
import { useUserLocation } from '~/composable/useUserLocation'
import { useFormat } from '~/composable/useFormat'
import { countPopulatedSubCategories, formatCategoryCount, getCategoryProductCount as getCategoryProductCountFor, normalizeCategoryCounts, resolveCategoryCount } from '~/utils/categoryCounts'
import { resolveSearchCategoryParam } from '~/utils/searchCategoryParam'
import { isGameCaseProduct } from '~/utils/productRelations'
import {
  SPEC_ATTRIBUTE_KEYS,
  SPEC_RANGE_PARAMS,
  bucketNumberBounds,
  buildSpecApiFilters,
  impliedOsFilter,
  impliedOsLabel,
  removeImpliedPhrase,
  sortOsVersionBuckets,
  withRangeParams,
} from '~/utils/specFilters'

const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()

// Destructured before useRaceableAsyncData below: its fetcher runs buildSearchParams()
// eagerly (Nuxt's useAsyncData fetches immediately on setup), and buildSearchParams()
// needs toApiSlug/urlToNumeric/germanLabelBySlug when a category is in the URL. Declaring
// this after that call left those bindings in the temporal dead zone during that first,
// eager call whenever `?category=` was present, throwing a ReferenceError before any
// search request was even made.
const { topLevelCategories, loadingCategories, fetchTopLevelCategories, fetchSubCategories, toUrlSlug, toApiSlug, urlToNumeric, slugToLabel, germanLabelBySlug, ensureGermanLabels, countsBySlug, ensureCountsBySlug } = useCategories()

// URL-derived state
const searchQuery = computed(() => (route.query.q as string) || '')
const selectedCategory = computed(() => (route.query.category as string) || '')
const selectedCondition = computed(() => (route.query.condition as string) || '')
const selectedMinPrice = computed(() => route.query.price_min ? Number(route.query.price_min) : undefined)
const selectedMaxPrice = computed(() => route.query.price_max ? Number(route.query.price_max) : undefined)
const selectedSort = computed(() => (route.query.sort as string) || '')
const selectedMaxDistance = computed(() => route.query.max_distance ? Number(route.query.max_distance) : undefined)
const activeAttributeFilters = computed(() => {
  const filters: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (key.startsWith('attr_') && typeof value === 'string' && !(SPEC_RANGE_PARAMS as readonly string[]).includes(key)) {
      filters[key.slice(5)] = value
    }
  }
  return filters
})

const hasActiveFilters = computed(
  () =>
    !!selectedCategory.value
    || !!selectedCondition.value
    || selectedMinPrice.value !== undefined
    || selectedMaxPrice.value !== undefined
    || !!selectedMaxDistance.value
    || selectedBatteryMin.value !== undefined
    || selectedBatteryMax.value !== undefined
    || hasSpecRangeSelection.value
    || Object.keys(activeAttributeFilters.value).length > 0,
)

// Geolocation state
const { requestBrowserPosition } = useUserLocation()
const userLocation = ref<{ lat: number, lon: number } | null>(null)
const distanceFilterKm = ref<number>(50)
const zipCodeInput = ref<string>((route.query.zip as string) || '')
const locationName = ref<string>('')
const zipLoading = ref(false)
const zipError = ref<string>('')
// Flag: true while we're resolving a ZIP from URL on page load; initial results still load without distance.
const zipResolving = ref(!!route.query.zip)
const selectedCountryCode = ref<string>((route.query.country as string) || '')

// Data state
const allProducts = ref<ProductDocument[]>([])
const totalResults = ref<number>(0)
// The search API caps its hit count at 10000 (OpenSearch's default track_total_hits limit); at
// that exact value the real count is >= 10000 but unknown, so show "10,000+" instead of a number
// that would look like a precise (and possibly category-tile-contradicting) total.
const SEARCH_TOTAL_CAP = 10000
const { formatNumber } = useFormat()
const formattedTotalResults = computed(() => (
  totalResults.value >= SEARCH_TOTAL_CAP
    ? `${formatNumber(SEARCH_TOTAL_CAP, locale.value)}+`
    : totalResults.value.toString()
))
const categoryBuckets = ref<FilterBucket[]>([])
const conditionBuckets = ref<FilterBucket[]>([])
const attributeBuckets = ref<Record<string, FilterBucket[]>>({})

// Price range state
const priceRangeMin = ref<number>(0)
const priceRangeMax = ref<number>(1000)
const priceFilterMin = ref<number>(0)
const priceFilterMax = ref<number>(1000)
const priceSliderStep = computed(() => {
  const range = priceRangeMax.value - priceRangeMin.value
  if (range <= 100) return 1
  if (range <= 1000) return 5
  if (range <= 5000) return 10
  return 50
})

// Battery range filter state
const rangeFilterAttrs = new Set(['battery']) // attribute keys that should render as range filters
const batteryRangeMin = ref<number>(0)
const batteryRangeMax = ref<number>(100)
const batteryFilterMin = ref<number>(0)
const batteryFilterMax = ref<number>(100)
const selectedBatteryMin = computed(() => route.query.attr_battery_min ? Number(route.query.attr_battery_min) : undefined)
const selectedBatteryMax = computed(() => route.query.attr_battery_max ? Number(route.query.attr_battery_max) : undefined)

// Spec filters: operating system (+ "or newer"), release year range, screen size range
const selectedOsVersionMin = computed(() => (route.query.attr_os_version_min as string) || '')
const selectedOsVersionSupports = computed(() => (route.query.attr_os_version_supports as string) || '')
const selectedOsVersion = computed(() => (route.query.attr_os_version as string) || '')
const osVersionOrNewer = ref(!!route.query.attr_os_version_min)
const selectedNumber = (param: string) => computed(() => {
  const raw = Number(String(route.query[param] ?? '').replace(',', '.'))
  return route.query[param] && Number.isFinite(raw) && raw > 0 ? raw : undefined
})
const selectedReleaseYearMin = selectedNumber('attr_release_year_min')
const selectedReleaseYearMax = selectedNumber('attr_release_year_max')
const selectedScreenSizeMin = selectedNumber('attr_screen_size_min')
const selectedScreenSizeMax = selectedNumber('attr_screen_size_max')
const hasSpecRangeSelection = computed(() => !!selectedOsVersionMin.value || !!selectedOsVersionSupports.value
  || selectedReleaseYearMin.value !== undefined || selectedReleaseYearMax.value !== undefined
  || selectedScreenSizeMin.value !== undefined || selectedScreenSizeMax.value !== undefined)

const manualLoading = ref(false)
const loadingMore = ref(false)
const hasSearched = ref(false)
const isFilterPanelOpen = ref(false)
const searchError = ref(false)

/** How the backend understood the query (added to the search response; optional for older backends). */
interface SearchInterpretation {
  query?: string | null
  appliedSort?: string | null
  sortImplied?: boolean
  impliedMaxPrice?: number | null
  productTypes?: string[] | null
  /** Structured filters read from the query text, e.g. { os: 'Android', os_version: '15' } */
  impliedAttributes?: Record<string, string> | null
  /** The text typed for them ("android 15+"), removed from the query when the chip is dismissed */
  impliedAttributesPhrase?: string | null
}
const interpretation = ref<SearchInterpretation | null>(null)

const isSearchMode = computed(() => routeHasSearchQuery(route.query))

function routeHasSearchQuery(query: typeof route.query): boolean {
  return !!(query.q || query.category || query.condition
    || query.price_min || query.price_max || query.sort || query.max_distance
    || query.zip || query.country
    || Object.keys(query).some(k => k.startsWith('attr_')))
}

// Track previous query params to detect server-side filter changes that need a re-fetch
const prevQuery = reactive({ q: '' as string | undefined, category: '' as string | undefined, condition: '' as string | undefined, price_min: '' as string | undefined, price_max: '' as string | undefined, attrs: '' as string | undefined, sort: '' as string | undefined, max_distance: '' as string | undefined })

function syncPrevQuery() {
  prevQuery.q = route.query.q ? String(route.query.q) : ''
  prevQuery.category = route.query.category ? String(route.query.category) : ''
  prevQuery.condition = route.query.condition ? String(route.query.condition) : ''
  prevQuery.price_min = route.query.price_min ? String(route.query.price_min) : ''
  prevQuery.price_max = route.query.price_max ? String(route.query.price_max) : ''
  prevQuery.sort = route.query.sort ? String(route.query.sort) : ''
  prevQuery.max_distance = route.query.max_distance ? String(route.query.max_distance) : ''
  prevQuery.attrs = Object.entries(route.query)
    .filter(([k]) => k.startsWith('attr_'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
}

// First results page: rendered server-side when the backend is quick, otherwise
// a skeleton is sent and the client re-fetches after hydration. ZIP-based
// searches need client geolocation, so they always fall back to the client.
const { data: initialSearch, loading: initialLoading, error: initialError } = useRaceableAsyncData(
  `search-${route.fullPath}`,
  () => {
    if (!routeHasSearchQuery(route.query) || zipResolving.value) {
      return Promise.resolve(null)
    }
    // The category param needs both the URL-slug -> numeric-slug map (fetchTopLevelCategories,
    // in the current UI locale) and the numeric-slug -> German-label map (ensureGermanLabels,
    // always German) to resolve a URL like `?category=clothing` to the German label the search
    // API matches on (see resolveSearchCategoryParam). Load both before the first search when a
    // category is in the URL, so that request — SSR or the initial client fetch — already sends
    // the label instead of falling back to a slug the API returns 0 results for.
    const labelsReady = selectedCategory.value
      ? Promise.all([fetchTopLevelCategories(), ensureGermanLabels()])
      : Promise.resolve()
    const request = labelsReady.then(() => searchProducts({ query: buildSearchParams(0) }))
    if (import.meta.server) {
      // Watchers do not run during SSR, so apply the result right here; otherwise
      // the server renders the category browser and the client swaps in results
      // after hydration (flash + hydration mismatch).
      return request.then((resp) => {
        applySearchResponse(resp, false)
        hasSearched.value = true
        return resp
      }, (err) => {
        searchError.value = true
        hasSearched.value = true
        throw err
      })
    }
    return request
  },
)

// Combined loading: initial SSR fetch OR a client-side re-filter.
const loading = computed(() => (initialLoading.value && !initialError.value) || manualLoading.value)

// Apply the SSR result on both server render and client hydration, and prime
// the change-detection state so the route watcher doesn't re-fetch on load.
watch(initialSearch, (resp) => {
  if (resp) {
    applySearchResponse(resp, false)
    hasSearched.value = true
    syncPrevQuery()
  }
}, { immediate: true })

// A failing first page must show the error state, not the category browser.
watch(initialError, (err) => {
  if (err && routeHasSearchQuery(route.query)) {
    searchError.value = true
    hasSearched.value = true
    syncPrevQuery()
  }
}, { immediate: true })

// Compute available category buckets — use server-provided aggregation counts directly
const availableCategoryBuckets = computed(() => {
  const apiSlug = toApiSlug(selectedCategory.value).toLowerCase()
  if (selectedCategory.value) {
    // If a category is already selected, show only that one (compare with resolved API slug)
    return categoryBuckets.value.filter(b => b.value?.toLowerCase() === apiSlug || b.value?.toLowerCase() === selectedCategory.value.toLowerCase())
  }

  // Use server-side aggregation counts (already computed across ALL matching docs)
  return categoryBuckets.value
    .filter(b => b.value && b.value.toLowerCase() !== 'general' && (b.count ?? 0) > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
})

// Compute available condition buckets — use server-provided aggregation counts directly
const availableConditionBuckets = computed(() => {
  if (selectedCondition.value) {
    // If a condition is already selected, show only that one
    return conditionBuckets.value.filter(b => b.value?.toLowerCase() === selectedCondition.value.toLowerCase())
  }

  // Use server-side aggregation counts
  return conditionBuckets.value
    .filter(b => b.value && (b.count ?? 0) > 0)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
})

// Compute available attribute buckets accounting for other selected filters
const availableAttributeBuckets = computed(() => {
  const result: Record<string, FilterBucket[]> = {}

  const attrFilters = activeAttributeFilters.value

  for (const [key, buckets] of Object.entries(attributeBuckets.value)) {
    if (key.toLowerCase() === 'condition') continue // Skip condition, it has its own section
    if (rangeFilterAttrs.has(key.toLowerCase())) continue // Skip range attributes, they get their own UI
    if (SPEC_ATTRIBUTE_KEYS.has(key.toLowerCase())) continue // Spec attributes have dedicated controls

    if (attrFilters[key]) {
      // If this attribute is already selected, show only that value
      result[key] = buckets.filter(b => b.value === attrFilters[key])
    }
    else {
      // Use server-side aggregation counts directly (covers all matching docs, not just page)
      const available = buckets
        .filter(b => b.value && (b.count ?? 0) > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0))

      if (available.length > 0) {
        result[key] = available
      }
    }
  }

  return result
})

// Battery range: extract min/max from battery buckets
const hasBatteryBuckets = computed(() => {
  const buckets = attributeBuckets.value['battery']
  return buckets && buckets.length > 0
})

// Spec filter controls, fed by the (spec) facet buckets of the response
const osBuckets = computed(() => (attributeBuckets.value['os'] ?? []).filter(b => b.value && (b.count ?? 0) > 0))
const osVersionBuckets = computed(() => sortOsVersionBuckets(attributeBuckets.value['os_version']))
const selectedOs = computed(() => (route.query.attr_os as string) || '')
const selectedOsVersionValue = computed(() => selectedOsVersionMin.value || selectedOsVersionSupports.value || selectedOsVersion.value)
const hasOsFilter = computed(() => osBuckets.value.length > 0 || osVersionBuckets.value.length > 0 || !!selectedOs.value || !!selectedOsVersionValue.value)
const releaseYearBounds = computed(() => bucketNumberBounds(attributeBuckets.value['release_year']))
const screenSizeBounds = computed(() => bucketNumberBounds(attributeBuckets.value['screen_size']))

watch(() => [route.query.attr_os_version_supports, route.query.attr_os_version, route.query.attr_os_version_min], ([supports, exact, min]) => {
  if (min) osVersionOrNewer.value = true
  else if (supports || exact) osVersionOrNewer.value = false
})

const OS_VERSION_PARAMS = ['attr_os_version', 'attr_os_version_min', 'attr_os_version_supports'] as const

function toggleOs(value: string) {
  const query = queryWithoutKeys('attr_os')
  if (selectedOs.value !== value) query.attr_os = value
  router.push({ query })
}

function toggleOsVersion(value: string) {
  const query = queryWithoutKeys(...OS_VERSION_PARAMS)
  if (selectedOsVersionValue.value !== value) {
    query[osVersionOrNewer.value ? 'attr_os_version_min' : 'attr_os_version_supports'] = value
  }
  router.push({ query })
}

function toggleOsVersionOrNewer() {
  osVersionOrNewer.value = !osVersionOrNewer.value
  const version = selectedOsVersionValue.value
  if (!version) return
  const query = queryWithoutKeys(...OS_VERSION_PARAMS)
  query[osVersionOrNewer.value ? 'attr_os_version_min' : 'attr_os_version_supports'] = version
  router.push({ query })
}

function applyRange(name: 'release_year' | 'screen_size', range: { min: number | null, max: number | null }, bounds: { min: number, max: number } | null) {
  router.push({ query: withRangeParams(queryWithoutKeys(), name, range, bounds) })
}

function clearRange(name: 'release_year' | 'screen_size') {
  router.push({ query: queryWithoutKeys(`attr_${name}_min`, `attr_${name}_max`) })
}

function clearOsVersion() {
  router.push({ query: queryWithoutKeys(...OS_VERSION_PARAMS) })
}

// Products are now server-side filtered (category, condition, attributes all sent to API)
const products = computed(() => allProducts.value)

const canLoadMore = computed(() => totalResults.value > allProducts.value.length)

// --- Sorting ---
const naturalSort = computed(() => (searchQuery.value ? 'relevance' : 'newest'))
const activeSort = computed(() => {
  if (selectedSort.value) return selectedSort.value
  if (interpretation.value?.sortImplied && interpretation.value.appliedSort) return interpretation.value.appliedSort
  return naturalSort.value
})
const sortOptions = computed(() => {
  const options: { value: string, label: string }[] = []
  if (searchQuery.value) options.push({ value: 'relevance', label: t('sortRelevance', 'Relevance') })
  options.push(
    { value: 'price_asc', label: t('sortPriceAscShort', 'Price ↑') },
    { value: 'price_desc', label: t('sortPriceDescShort', 'Price ↓') },
    { value: 'newest', label: t('sortNewestShort', 'Newest') },
  )
  if (userLocation.value) options.push({ value: 'distance', label: t('sortDistance', 'Nearest') })
  return options
})

function onSortSelect(value: string) {
  const query = queryWithoutKeys('sort')
  // Keep URLs clean for the default order, unless it must override an implied sort ("cheap …")
  if (value !== naturalSort.value || interpretation.value?.sortImplied) {
    query.sort = value
  }
  router.push({ query })
}

// --- Query interpretation hints ---
const queryHints = computed(() => {
  const hints: { key: string, text: string, action?: { label: string, run: () => void } }[] = []
  const info = interpretation.value
  if (!info || !searchQuery.value) return hints
  if (info.sortImplied && info.appliedSort === 'price_asc' && !selectedSort.value) {
    hints.push({
      key: 'cheap',
      text: t('hintSortedByPrice', 'Sorted by lowest price because you asked for cheap items.'),
      action: { label: t('hintSortByRelevance', 'Sort by relevance'), run: () => onSortSelect('relevance') },
    })
  }
  const impliedOs = impliedOsFilter(info.impliedAttributes)
  if (impliedOs) {
    hints.push({
      key: 'implied-os',
      text: t(impliedOs.mode === 'min' || !impliedOs.version ? 'hintImpliedOs' : 'hintImpliedOsRuns', { filter: impliedOsLabel(impliedOs) }),
      action: { label: t('hintRemoveFilter', 'Remove'), run: removeImpliedOsFilter },
    })
  }
  if (info.impliedMaxPrice != null && selectedMaxPrice.value === undefined) {
    hints.push({
      key: 'max-price',
      text: t('hintMaxPrice', { price: formatPrice(info.impliedMaxPrice) }),
    })
  }
  return hints
})

function removeImpliedOsFilter() {
  const phrase = interpretation.value?.impliedAttributesPhrase
  const query = queryWithoutKeys('q')
  const remaining = removeImpliedPhrase(searchQuery.value, phrase)
  if (remaining) query.q = remaining
  router.push({ query })
}

// --- Empty state: broader queries to try (drop one word at a time) ---
const alternativeQueries = computed(() => {
  const words = searchQuery.value.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (let i = words.length - 1; i >= 0 && result.length < 3; i--) {
    const candidate = words.filter((_, idx) => idx !== i).join(' ')
    const key = candidate.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(candidate)
    }
  }
  return result
})

const PAGE_SIZE = 20
const AUTO_LOAD_MAX = 100

// Infinite scroll
const scrollSentinel = ref<HTMLElement | null>(null)
let scrollObserver: IntersectionObserver | null = null

function setupScrollObserver() {
  if (scrollObserver) scrollObserver.disconnect()
  scrollObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && canLoadMore.value && !loadingMore.value && allProducts.value.length < AUTO_LOAD_MAX) {
      loadMore()
    }
  }, { rootMargin: '200px' })
}

watch(scrollSentinel, (el) => {
  if (scrollObserver) scrollObserver.disconnect()
  if (el) {
    if (!scrollObserver) setupScrollObserver()
    scrollObserver!.observe(el)
  }
})

onBeforeUnmount(() => {
  scrollObserver?.disconnect()
})

// --- Category browsing ---

interface BrowseSegment { slug: string, label: string }
interface CategoryNode {
  slug: string
  label: string
  subCategories?: CategoryNode[] | null
}

const browsePath = ref<BrowseSegment[]>([])

// "Other / more categories" tile: we launched with a reduced category scope
const supportDiscordUrl = 'https://discord.gg/vdjgMWDDzW'
const showMoreCategoriesDialog = ref(false)
const moreCategoriesCloseButton = ref<HTMLButtonElement | null>(null)
const moreCategoriesTile = ref<HTMLButtonElement | null>(null)
// Escape closes the dialog even when focus is not inside it (e.g. after clicking its text)
function onMoreCategoriesKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') showMoreCategoriesDialog.value = false
}
watch(showMoreCategoriesDialog, async (open) => {
  if (!import.meta.client) return
  if (open) {
    document.addEventListener('keydown', onMoreCategoriesKeydown)
    await nextTick()
    moreCategoriesCloseButton.value?.focus()
    return
  }
  document.removeEventListener('keydown', onMoreCategoriesKeydown)
  // return focus to the tile that opened the dialog
  await nextTick()
  moreCategoriesTile.value?.focus()
})
onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('keydown', onMoreCategoriesKeydown)
})
const browseSubCats = ref<CategoryNode[]>([])
const currentBrowseLabel = computed(() => browsePath.value[browsePath.value.length - 1]?.label ?? t('browseCategories', 'Browse Categories'))
const selectedBrowseLabel = computed(() => browsePath.value[browsePath.value.length - 1]?.label ?? '')

// Global category counts (from aggregation) to hide empty categories and show product counts
const globalCategoryCounts = ref<Record<string, number>>({})

async function fetchGlobalCategoryCounts() {
  try {
    const counts = await $fetch<Record<string, number>>('https://ane.coflnet.com/api/Categories/with-counts')
    if (counts && Object.keys(counts).length > 0) {
      globalCategoryCounts.value = normalizeCategoryCounts(counts)
    }
  }
  catch { /* ignore — show all categories as fallback */ }
}

// Prefers the exact per-slug counts (countsBySlug, see useCategories' ensureCountsBySlug) when
// available; otherwise falls back to the counts map keyed by German label regardless of UI
// language, resolved via each category's German label — see utils/categoryCounts.ts.
function countForCategory(cat: { slug: string, label?: string }): number {
  return resolveCategoryCount(cat, globalCategoryCounts.value, germanLabelBySlug.value, countsBySlug.value)
}

// Categories to display in the browser (filtered to those with listings)
const displayCategories = computed(() => {
  // Top level is the curated category scope from the API — always show all of it
  if (browseSubCats.value.length === 0) return topLevelCategories.value
  const cats = browseSubCats.value
  if (Object.keys(globalCategoryCounts.value).length === 0) return cats
  return cats.filter((cat) => {
    // Show a category if it or any of its subcategories has listings (match by slug or label)
    if (countForCategory(cat) > 0) return true
    if (cat.subCategories?.some(sub => countForCategory(sub) > 0)) return true
    return false
  })
})

// Icon map for common top-level categories
const categoryIconMap: Record<string, string> = {
  'Baby & Kleinkind': 'tabler:baby-carriage',
  'Sportartikel': 'tabler:run',
  'Elektronik': 'tabler:device-laptop',
  'Bekleidung & Accessoires': 'tabler:shirt',
  'Bekleidung': 'tabler:shirt',
  'Sammelkarten': 'tabler:cards',
  'Haus & Garten': 'tabler:home',
  'Fahrzeuge & Teile': 'tabler:car',
  'Gesundheit & Schönheit': 'tabler:heart',
  'Bürobedarf': 'tabler:briefcase',
  'Möbel': 'tabler:armchair',
  'Spielzeug & Spiele': 'tabler:puzzle',
  'Medien': 'tabler:book',
  'Lebensmittel': 'tabler:shopping-cart',
  'Tiere & Tierbedarf': 'tabler:paw',
  'Kunst & Unterhaltung': 'tabler:palette',
  'Kameras & Optik': 'tabler:camera',
  'Software': 'tabler:code',
  'Hardware': 'tabler:cpu',
  'Werkzeuge & Eisenwaren': 'tabler:tool',
  'Gepäck & Taschen': 'tabler:backpack',
  'Radsport': 'tabler:bike',
  'Fahrräder': 'tabler:bike',
}

function getCategoryIcon(slug: string, label: string): string {
  return categoryIconMap[label] || 'tabler:category'
}

function getCategoryProductCount(cat: CategoryNode): number {
  return getCategoryProductCountFor(cat, globalCategoryCounts.value, germanLabelBySlug.value, countsBySlug.value)
}

// Direct subcategories that actually have products — what the "N subcategories" badge shows,
// and what decides whether clicking a category browses deeper or jumps straight to results.
function populatedSubCategoryCount(cat: CategoryNode): number {
  return countPopulatedSubCategories(cat, globalCategoryCounts.value, germanLabelBySlug.value, countsBySlug.value)
}

function formatCount(n: number): string {
  return formatCategoryCount(n)
}

async function onUnifiedCategoryClick(cat: CategoryNode) {
  let subs: CategoryNode[] | null | undefined = cat.subCategories
  if (!subs || subs.length === 0) {
    // Try to fetch subcategories from API
    subs = await fetchSubCategories(cat.slug)
  }

  if (subs && subs.length > 0) {
    // Counts may not have loaded yet (fetchGlobalCategoryCounts runs in parallel on mount) —
    // fall back to browsing when we can't yet tell which children are populated, rather than
    // skipping straight to a leaf search that might be wrong.
    const countsLoaded = Object.keys(globalCategoryCounts.value).length > 0
    const hasPopulatedSubs = !countsLoaded || subs.some(sub => getCategoryProductCount(sub) > 0)
    if (hasPopulatedSubs) {
      // Navigate deeper into the tree
      browsePath.value = [...browsePath.value, { slug: cat.slug, label: cat.label }]
      browseSubCats.value = subs
      return
    }
  }
  // Leaf category, or none of its subcategories have products — search directly instead of
  // landing on an empty browse page (same navigation as the "Show Products" button).
  router.push({ query: { category: toUrlSlug(cat.slug) } })
}

function navigateToBreadcrumb(idx: number) {
  if (idx === 0 && browsePath.value.length === 1) {
    // Going back to top level
    browsePath.value = []
    browseSubCats.value = []
    return
  }
  // Navigate to this breadcrumb level
  const targetCat = browsePath.value[idx]
  browsePath.value = browsePath.value.slice(0, idx + 1)
  // Re-fetch subcategories for this level
  if (targetCat) {
    fetchSubCategories(targetCat.slug).then((subs) => {
      browseSubCats.value = (subs || []) as CategoryNode[]
    })
  }
}

function searchInCurrentCategory() {
  const leaf = browsePath.value.at(-1)
  if (leaf) {
    router.push({ query: { category: toUrlSlug(leaf.slug) } })
  }
}

// Load top-level categories on mount
onMounted(async () => {
  fetchTopLevelCategories()
  fetchGlobalCategoryCounts()
  ensureGermanLabels()
  ensureCountsBySlug()
  setupScrollObserver()
  // Restore country from URL
  const urlCountry = route.query.country as string
  if (urlCountry) {
    selectedCountryCode.value = urlCountry
  }
  // Restore a position handed over by lat/lon in the URL (product page "Search similar offers nearby")
  const urlLat = Number(route.query.lat)
  const urlLon = Number(route.query.lon)
  if (route.query.lat && route.query.lon && Number.isFinite(urlLat) && Number.isFinite(urlLon) && !route.query.zip) {
    userLocation.value = { lat: urlLat, lon: urlLon }
    if (selectedMaxDistance.value) performSearch()
  }
  // Auto-resolve ZIP code from URL on page load
  const urlZip = route.query.zip as string
  if (urlZip) {
    zipCodeInput.value = urlZip
    await lookupZipCode()
  }
})

// --- Localization helpers ---

const conditionMap: Record<string, string> = {
  'new': 'newCondition',
  'neu': 'newCondition',
  'nieuw': 'newCondition',
  'like_new': 'usedCondition',
  'like new': 'usedCondition',
  'used': 'usedCondition',
  'gebraucht': 'usedCondition',
  'refurbished': 'refurbishedCondition',
  'for_parts': 'forPartsCondition',
  'for parts': 'forPartsCondition',
  'broken': 'forPartsCondition',
  'good': 'usedCondition',
  'very_good': 'usedCondition',
  'very good': 'usedCondition',
  'acceptable': 'usedCondition',
}

// Common category translations
const categoryTranslationMap: Record<string, string> = {
  'elektronik': 'cat_electronics',
  'handys': 'cat_smartphones',
  'tablets': 'cat_tablets',
  'notebooks': 'cat_laptops',
  'pcs': 'cat_computers',
  'konsolen': 'cat_gaming',
  'videospiele': 'cat_gaming',
  'foto-kameras': 'cat_photography',
  'kameras': 'cat_photography',
  'audio': 'cat_audio',
  'tv-video': 'cat_tv_video',
  'mode': 'cat_clothing',
  'schuhe': 'cat_shoes',
  'uhren': 'cat_watches',
  'schmuck': 'cat_jewelry',
  'haus-garten': 'cat_home_garden',
  'sport': 'cat_sports',
  'spielzeug': 'cat_toys',
  'buecher': 'cat_books',
  'musik': 'cat_music',
  'filme': 'cat_movies',
  'fahrzeuge': 'cat_automotive',
  'autos': 'cat_automotive',
  'baby': 'cat_baby',
  'gesundheit-beauty': 'cat_health_beauty',
  'haustiere': 'cat_pet_supplies',
  'buero': 'cat_office',
  'werkzeug': 'cat_tools',
  'moebel': 'cat_furniture',
  'kueche': 'cat_kitchen',
  'garten': 'cat_garden',
  'zubehoer': 'cat_accessories',
  'pc-zubehoer': 'cat_accessories',
  'taschen': 'cat_bags',
  'sammlungen': 'cat_collectibles',

  // Keep English ones for fallback
  'Electronics': 'cat_electronics',
  'Smartphones': 'cat_smartphones',
  'Tablets': 'cat_tablets',
  'Laptops': 'cat_laptops',
  'Computers': 'cat_computers',
  'Gaming': 'cat_gaming',
  'Photography': 'cat_photography',
  'Audio': 'cat_audio',
  'TV & Video': 'cat_tv_video',
  'Clothing': 'cat_clothing',
  'Shoes': 'cat_shoes',
  'Watches': 'cat_watches',
  'Jewelry': 'cat_jewelry',
  'Home & Garden': 'cat_home_garden',
  'Sports': 'cat_sports',
  'Toys': 'cat_toys',
  'Books': 'cat_books',
  'Music': 'cat_music',
  'Movies': 'cat_movies',
  'Automotive': 'cat_automotive',
  'Baby': 'cat_baby',
  'Health & Beauty': 'cat_health_beauty',
  'Pet Supplies': 'cat_pet_supplies',
  'Office': 'cat_office',
  'Tools': 'cat_tools',
  'Furniture': 'cat_furniture',
  'Kitchen': 'cat_kitchen',
  'Garden': 'cat_garden',
  'Accessories': 'cat_accessories',
  'Bags': 'cat_bags',
  'Collectibles': 'cat_collectibles',
}

// Common attribute key translations
const attrKeyTranslationMap: Record<string, string> = {
  'brand': 'attr_brand',
  'color': 'attr_color',
  'size': 'attr_size',
  'storage': 'attr_storage',
  'storage_size': 'attr_storage',
  'memory': 'attr_memory',
  'ram_size': 'attr_ram',
  'ram': 'attr_ram',
  'screen_size': 'attr_screen_size',
  'os': 'attr_os',
  'os_version': 'attr_os_version',
  'release_year': 'attr_release_year',
  'material': 'attr_material',
  'style': 'attr_style',
  'type': 'attr_type',
  'model': 'attr_model',
  'connectivity': 'attr_connectivity',
  'operating_system': 'attr_operating_system',
  'processor': 'attr_processor',
  'resolution': 'attr_resolution',
  'weight': 'attr_weight',
  'gender': 'attr_gender',
  'capacity': 'attr_capacity',
  'battery health': 'attr_battery_health',
  'battery_health': 'attr_battery_health',
  'delivery': 'attr_delivery',
  'service': 'attr_service',
  'product type': 'attr_product_type',
  'product_type': 'attr_product_type',
  'console name': 'attr_console_name',
  'console_name': 'attr_console_name',
  'game name': 'attr_game_name',
  'game_name': 'attr_game_name',
  'publisher': 'attr_publisher',
  'controllers': 'attr_controllers',
  'manufactureaddress': 'attr_manufacturer',
  'manufacturertradename': 'attr_manufacturer',
  'bike_type': 'attr_bike_type',
  'sub_type': 'attr_sub_type',
}

// Common attribute value translations (for colors, sizes, etc.)
const attrValueTranslationMap: Record<string, Record<string, string>> = {
  color: {
    Black: 'color_black',
    White: 'color_white',
    Red: 'color_red',
    Blue: 'color_blue',
    Green: 'color_green',
    Yellow: 'color_yellow',
    Pink: 'color_pink',
    Purple: 'color_purple',
    Orange: 'color_orange',
    Gray: 'color_gray',
    Grey: 'color_gray',
    Silver: 'color_silver',
    Gold: 'color_gold',
    Brown: 'color_brown',
    Beige: 'color_beige',
  },
  gender: {
    Male: 'gender_male',
    Female: 'gender_female',
    Unisex: 'gender_unisex',
  },
}

function localizeCategory(cat: string): string {
  // If it's a numeric slug, try to show the label directly; if it's a URL slug (e.g. "clothing"
  // from ?category=clothing), resolve it to the numeric slug first — slugToLabel is keyed by
  // numeric slug, so looking it up by the raw URL slug always missed and fell through to
  // showing the raw URL value ("clothing") instead of the localized label.
  const label = slugToLabel.value[cat] || slugToLabel.value[toApiSlug(cat)]
  if (label) return label

  const key = categoryTranslationMap[cat]
  if (key) {
    const translated = t(key, cat)
    return translated !== key ? translated : cat
  }
  return cat
}

function isCategorySelected(bucketValue: string): boolean {
  if (!selectedCategory.value) return false
  const urlLower = selectedCategory.value.toLowerCase()
  const apiSlug = toApiSlug(selectedCategory.value)
  return bucketValue.toLowerCase() === urlLower || bucketValue.toLowerCase() === apiSlug.toLowerCase()
}

function localizeCondition(cond: string): string {
  const key = conditionMap[cond]
  if (key) {
    const translated = t(key, cond)
    return translated !== key ? translated : formatConditionFallback(cond)
  }
  return formatConditionFallback(cond)
}

function formatConditionFallback(cond: string): string {
  return cond.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function localizeAttrKey(key: string): string {
  const tKey = attrKeyTranslationMap[key.toLowerCase()]
  if (tKey) {
    const translated = t(tKey, key)
    return translated !== tKey ? translated : formatAttrKeyFallback(key)
  }
  return formatAttrKeyFallback(key)
}

function formatAttrKeyFallback(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function localizeAttrValue(attrKey: string, value: string): string {
  const valueMap = attrValueTranslationMap[attrKey.toLowerCase()]
  if (valueMap && valueMap[value]) {
    const translated = t(valueMap[value], value)
    return translated !== valueMap[value] ? translated : value
  }
  return value
}

// --- Search & filter logic ---

function buildSearchParams(offset = 0) {
  const params: Record<string, string | number | string[]> = { offset, limit: PAGE_SIZE }
  if (searchQuery.value) params.query = searchQuery.value
  // Category values: the API only matches the German taxonomy label, so send that
  // when it's known (see resolveSearchCategoryParam), falling back to the numeric/API
  // slug otherwise.
  if (selectedCategory.value) params.category = resolveSearchCategoryParam(selectedCategory.value, urlToNumeric.value, germanLabelBySlug.value)
  if (selectedCondition.value) params.condition = selectedCondition.value.toLowerCase()
  if (selectedMinPrice.value !== undefined) params.minPrice = selectedMinPrice.value
  if (selectedMaxPrice.value !== undefined) params.maxPrice = selectedMaxPrice.value
  if (selectedSort.value) params.sortBy = selectedSort.value
  // Distance params
  if (userLocation.value) {
    params.lat = userLocation.value.lat
    params.lon = userLocation.value.lon
    if (selectedMaxDistance.value) params.maxDistanceKm = selectedMaxDistance.value
  }
  // Country filter
  if (selectedCountryCode.value) params.country = selectedCountryCode.value
  // Send attribute filters to the API as key:value pairs
  const attrFilters = activeAttributeFilters.value
  const attrArray: string[] = []
  for (const [k, v] of Object.entries(attrFilters)) {
    attrArray.push(`${k}:${v}`)
  }
  // Battery range filter
  if (selectedBatteryMin.value !== undefined) attrArray.push(`battery_min:${selectedBatteryMin.value}`)
  if (selectedBatteryMax.value !== undefined) attrArray.push(`battery_max:${selectedBatteryMax.value}`)
  attrArray.push(...buildSpecApiFilters(route.query))
  if (attrArray.length > 0) {
    params.attributes = attrArray
  }
  return params
}

// Client-only: SSR'd first page is handled by the raceable composable below.
// Every new search supersedes the previous one: a late response of an older
// request is ignored, so fast filter clicks never show stale results.
// (The generated client deep-clones its options, so an AbortSignal cannot be passed.)
let searchSeq = 0

async function performSearch(append = false) {
  if (import.meta.server) return
  if (append && (loadingMore.value || manualLoading.value)) return

  const seq = ++searchSeq

  if (!append) {
    manualLoading.value = true
  }
  else {
    loadingMore.value = true
  }
  hasSearched.value = true

  try {
    const offset = append ? allProducts.value.length : 0
    const params = buildSearchParams(offset)
    const response = await searchProducts({ query: params })
    if (seq !== searchSeq) return
    searchError.value = false
    applySearchResponse(response, append)
  }
  catch (e) {
    if (seq !== searchSeq) return
    console.warn('Search failed', e)
    if (!append) {
      searchError.value = true
      allProducts.value = []
      totalResults.value = 0
    }
  }
  finally {
    if (seq === searchSeq) {
      manualLoading.value = false
      loadingMore.value = false
    }
  }
}

function applySearchResponse(response: SearchProductsResponse, append: boolean) {
  {
    if (append) {
      allProducts.value = [...allProducts.value, ...(response?.products || [])]
    }
    else {
      allProducts.value = response?.products || []
      interpretation.value = (response as SearchProductsResponse & { interpretation?: SearchInterpretation | null })?.interpretation ?? null

      // Use aggregation buckets if available (new backend), otherwise derive from products
      if (response?.categoryBuckets && response.categoryBuckets.length > 0) {
        categoryBuckets.value = response.categoryBuckets.filter(b => b.value?.toLowerCase() !== 'general')
      }
      else if (response?.categories && response.categories.length > 0) {
        // Estimate counts from current page of products
        const catCounts: Record<string, number> = {}
        for (const p of allProducts.value) {
          for (const cat of p.categories || []) {
            catCounts[cat] = (catCounts[cat] || 0) + 1
          }
        }
        categoryBuckets.value = response.categories
          .filter(c => c.toLowerCase() !== 'general')
          .map(c => ({ value: c, count: catCounts[c] || 0 }))
          .sort((a, b) => (b.count || 0) - (a.count || 0))
      }
      else {
        // Last resort: derive categories directly from product hits
        const catCounts: Record<string, number> = {}
        for (const p of allProducts.value) {
          for (const cat of p.categories || []) {
            if (cat.toLowerCase() !== 'general') {
              catCounts[cat] = (catCounts[cat] || 0) + 1
            }
          }
        }
        categoryBuckets.value = Object.entries(catCounts)
          .map(([v, c]) => ({ value: v, count: c }))
          .sort((a, b) => (b.count || 0) - (a.count || 0))
      }

      if (response?.conditionBuckets && response.conditionBuckets.length > 0) {
        conditionBuckets.value = response.conditionBuckets
      }
      else {
        // Derive condition counts from products — normalize to lowercase to avoid duplicates
        const condCounts: Record<string, number> = {}
        for (const p of allProducts.value) {
          if (p.condition && p.condition.toLowerCase() !== 'unknown') {
            const normalized = p.condition.toLowerCase()
            condCounts[normalized] = (condCounts[normalized] || 0) + 1
          }
        }
        conditionBuckets.value = Object.entries(condCounts)
          .map(([v, c]) => ({ value: v, count: c }))
          .sort((a, b) => (b.count || 0) - (a.count || 0))
      }

      if (response?.attributeBuckets && Object.keys(response.attributeBuckets).length > 0) {
        attributeBuckets.value = response.attributeBuckets
      }
      else {
        // Derive attribute counts from products (either from attributesWithValues or directly)
        const attrCounts: Record<string, Record<string, number>> = {}
        for (const p of allProducts.value) {
          if (p.attributes) {
            for (const attr of p.attributes) {
              if (attr.key && attr.value) {
                const attrValues = attrCounts[attr.key] ?? (attrCounts[attr.key] = {})
                attrValues[attr.value] = (attrValues[attr.value] || 0) + 1
              }
            }
          }
        }
        if (response?.attributesWithValues) {
          const result: Record<string, FilterBucket[]> = {}
          for (const [key, values] of Object.entries(response.attributesWithValues)) {
            result[key] = values
              .map(v => ({ value: v, count: attrCounts[key]?.[v] || 0 }))
              .sort((a, b) => (b.count || 0) - (a.count || 0))
          }
          attributeBuckets.value = result
        }
        else {
          // Derive directly from product attributes
          const result: Record<string, FilterBucket[]> = {}
          for (const [key, valueCounts] of Object.entries(attrCounts)) {
            result[key] = Object.entries(valueCounts)
              .map(([v, c]) => ({ value: v, count: c }))
              .sort((a, b) => (b.count || 0) - (a.count || 0))
          }
          attributeBuckets.value = result
        }
      }
    }
    totalResults.value = response?.total || 0

    // Update battery range from attribute buckets
    const batteryBuckets = attributeBuckets.value['battery']
    if (batteryBuckets && batteryBuckets.length > 0) {
      const numericValues = batteryBuckets
        .map(b => Number.parseInt(String(b.value).replace('%', ''), 10))
        .filter(n => !Number.isNaN(n))
      if (numericValues.length > 0) {
        batteryRangeMin.value = Math.min(...numericValues)
        batteryRangeMax.value = Math.max(...numericValues)
        batteryFilterMin.value = selectedBatteryMin.value ?? batteryRangeMin.value
        batteryFilterMax.value = selectedBatteryMax.value ?? batteryRangeMax.value
      }
    }

    // Update price range from aggregation
    // Backend always returns the global price range (not narrowed by price filter)
    if (response?.priceMin != null && response?.priceMax != null) {
      priceRangeMin.value = Math.floor(response.priceMin)
      priceRangeMax.value = Math.ceil(response.priceMax)
      // Sync slider to URL values or full range
      priceFilterMin.value = selectedMinPrice.value ?? priceRangeMin.value
      priceFilterMax.value = selectedMaxPrice.value ?? priceRangeMax.value
    }
    else if (allProducts.value.length > 0) {
      // Derive price range from product hits when aggregation is unavailable
      const prices = allProducts.value
        .map(p => p.minPrice)
        .filter((p): p is number => p != null && p > 0)
      if (prices.length > 0) {
        priceRangeMin.value = Math.floor(Math.min(...prices))
        priceRangeMax.value = Math.ceil(Math.max(...prices))
        priceFilterMin.value = selectedMinPrice.value ?? priceRangeMin.value
        priceFilterMax.value = selectedMaxPrice.value ?? priceRangeMax.value
      }
    }
  }
}

function loadMore() {
  performSearch(true)
}

function queryWithoutKeys(...keys: string[]): Record<string, string> {
  const excluded = new Set(keys)
  const query: Record<string, string> = {}

  for (const [key, value] of Object.entries(route.query)) {
    if (!excluded.has(key) && typeof value === 'string') {
      query[key] = value
    }
  }

  return query
}

function toggleFilter(type: 'category' | 'condition', value: string) {
  if (route.query[type] === value) {
    router.push({ query: queryWithoutKeys(type) })
    return
  }

  const query = queryWithoutKeys()
  query[type] = value
  router.push({ query })
}

function clearFilter(type: string) {
  router.push({ query: queryWithoutKeys(type) })
}

function toggleAttributeFilter(key: string, value: string) {
  const paramKey = `attr_${key}`
  if (route.query[paramKey] === value) {
    router.push({ query: queryWithoutKeys(paramKey) })
    return
  }

  const query = queryWithoutKeys()
  query[paramKey] = value
  router.push({ query })
}

function removeAttributeFilter(key: string) {
  router.push({ query: queryWithoutKeys(`attr_${key}`) })
}

function clearAllFilters() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  router.push({ query })
}

function applyBatteryFilter() {
  const query = queryWithoutKeys('attr_battery_min', 'attr_battery_max')
  if (batteryFilterMin.value > batteryRangeMin.value) {
    query.attr_battery_min = String(Math.round(batteryFilterMin.value))
  }
  if (batteryFilterMax.value < batteryRangeMax.value) {
    query.attr_battery_max = String(Math.round(batteryFilterMax.value))
  }
  router.push({ query })
}

async function requestLocation() {
  selectedCountryCode.value = ''
  try {
    const position = await requestBrowserPosition()
    userLocation.value = { lat: position.lat, lon: position.lon }
    locationName.value = ''
    zipCodeInput.value = ''
    zipError.value = ''
    // Remove zip from URL since we're using browser location
    const query = { ...route.query } as Record<string, string>
    delete query.zip
    router.push({ query })
    // If distance filter already set, re-trigger search
    if (selectedMaxDistance.value) {
      performSearch()
    }
  }
  catch (err) {
    console.error('Geolocation error:', err)
    alert('Could not get your location. Please allow location access or enter a ZIP code.')
  }
}

async function lookupZipCode() {
  const zip = zipCodeInput.value?.trim()
  if (!zip) return

  zipLoading.value = true
  zipError.value = ''
  locationName.value = ''

  try {
    const locationData = await getLocation({
      path: { zip },
      composable: '$fetch',
    })

    if (!locationData || (locationData.lat === 0 && locationData.lon === 0)) {
      zipError.value = 'ZIP code not found'
      zipResolving.value = false
      performSearch() // Still search, just without distance filter
      return
    }

    userLocation.value = { lat: locationData.lat ?? 0, lon: locationData.lon ?? 0 }
    locationName.value = locationData.name ? `${locationData.name} (${zip})` : zip

    // Clear the zipResolving flag now that we have coordinates
    const wasResolving = zipResolving.value
    zipResolving.value = false

    // Persist zip in URL
    const query = { ...route.query } as Record<string, string>
    query.zip = zip
    if (!query.max_distance) {
      query.max_distance = String(distanceFilterKm.value)
    }
    router.push({ query })

    // If this was the initial ZIP resolution from URL, trigger search now that geo is available
    if (wasResolving) {
      await nextTick()
      performSearch()
    }
  }
  catch (err) {
    console.error('ZIP lookup error:', err)
    zipError.value = 'Could not resolve ZIP code'
    zipResolving.value = false
    performSearch() // Still search, just without distance filter
  }
  finally {
    zipLoading.value = false
  }
}

function applyDistanceFilter() {
  const query = { ...route.query } as Record<string, string>
  if (distanceFilterKm.value > 0 && userLocation.value) {
    query.max_distance = String(distanceFilterKm.value)
  }
  else {
    delete query.max_distance
  }
  router.push({ query })
}

function clearDistanceFilter() {
  const query = { ...route.query } as Record<string, string>
  delete query.max_distance
  delete query.zip
  delete query.country
  userLocation.value = null
  locationName.value = ''
  zipCodeInput.value = ''
  zipError.value = ''
  selectedCountryCode.value = ''
  router.push({ query })
}

function onCountrySelect(event: Event) {
  const code = (event.target as HTMLSelectElement).value
  selectedCountryCode.value = code
  const query = { ...route.query } as Record<string, string>
  if (!code) {
    delete query.country
  }
  else {
    query.country = code
  }
  router.push({ query })
}

function applyPriceFilter() {
  const query = queryWithoutKeys('price_min', 'price_max')
  if (priceFilterMin.value > priceRangeMin.value) {
    query.price_min = String(Math.round(priceFilterMin.value))
  }
  if (priceFilterMax.value < priceRangeMax.value) {
    query.price_max = String(Math.round(priceFilterMax.value))
  }
  router.push({ query })
}

function clearPriceFilter() {
  const query = queryWithoutKeys('price_min', 'price_max')
  priceFilterMin.value = priceRangeMin.value
  priceFilterMax.value = priceRangeMax.value
  router.push({ query })
}

function onSearch(query: string) {
  router.push({ query: { q: query } })
}

function onSearchCategorySelect(slug: string) {
  router.push({ query: { category: toUrlSlug(slug) || slug } })
}

// Watch route query changes and trigger search
watch(() => route.query, () => {
  const hasQuery = route.query.q || route.query.category || route.query.condition
    || route.query.price_min || route.query.price_max || route.query.sort || route.query.max_distance
    || route.query.zip || route.query.country
    || Object.keys(route.query).some(k => k.startsWith('attr_'))
  if (hasQuery) {
    // Detect if server-side filter params changed (search, category, condition, price, sort, distance, or attributes)
    const currentQ = route.query.q ? String(route.query.q) : ''
    const currentCategory = route.query.category ? String(route.query.category) : ''
    const currentCondition = route.query.condition ? String(route.query.condition) : ''

    const currentPriceMin = route.query.price_min ? String(route.query.price_min) : ''
    const currentPriceMax = route.query.price_max ? String(route.query.price_max) : ''
    const currentSort = route.query.sort ? String(route.query.sort) : ''
    const currentMaxDistance = route.query.max_distance ? String(route.query.max_distance) : ''

    // Serialize attribute filters for comparison
    const currentAttrs = Object.entries(route.query)
      .filter(([k]) => k.startsWith('attr_'))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const queryChanged = currentQ !== prevQuery.q || currentCategory !== prevQuery.category || currentCondition !== prevQuery.condition || currentPriceMin !== prevQuery.price_min || currentPriceMax !== prevQuery.price_max || currentAttrs !== prevQuery.attrs || currentSort !== prevQuery.sort || currentMaxDistance !== prevQuery.max_distance

    if (queryChanged || !hasSearched.value) {
      performSearch()
    }

    prevQuery.price_min = currentPriceMin
    prevQuery.price_max = currentPriceMax
    prevQuery.attrs = currentAttrs
    prevQuery.sort = currentSort
    prevQuery.max_distance = currentMaxDistance

    // Sync distance slider
    if (currentMaxDistance) {
      distanceFilterKm.value = Number(currentMaxDistance)
    }

    // Save previous query params for comparison
    prevQuery.q = currentQ
    prevQuery.category = currentCategory
    prevQuery.condition = currentCondition
  }
  else {
    searchSeq++
    manualLoading.value = false
    searchError.value = false
    interpretation.value = null
    allProducts.value = []
    hasSearched.value = false
    totalResults.value = 0
    categoryBuckets.value = []
    conditionBuckets.value = []
    attributeBuckets.value = {}
  }
// Initial load (incl. timeout refetch) is handled by useRaceableAsyncData above;
// this watcher only reacts to subsequent query changes.
})

function formatPrice(amount: number) {
  return new Intl.NumberFormat(locale.value === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency: 'EUR' }).format(amount)
}

/** Build a better display name when product.name is just the brand or too generic */
function productDisplayName(product: ProductDocument): string {
  const name = product.name?.trim()
  const brand = product.brand?.trim()
  const model = product.model?.trim()
  if (!name) return brand || model || 'Unknown'

  // Clean leading dash artifacts
  const cleanName = name.replace(/^[-\s]+/, '').trim()

  // If name is a single word and model exists, the name is likely just a brand/chip marker
  // e.g. name="NVIDIA", brand="Asus", model="GeForce RTX 3070 8GB" -> "Asus GeForce RTX 3070 8GB"
  if (model && cleanName.split(/\s+/).length <= 1) {
    return brand ? (model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`) : model
  }
  // If name equals brand and model exists, show brand + model
  if (brand && model && cleanName.toLowerCase() === brand.toLowerCase()) {
    return model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`
  }
  return cleanName || name
}

function getDisplayCategory(product: ProductDocument): string | null {
  if (!product.categories || !Array.isArray(product.categories)) return null
  return product.categories.find((c: string) =>
    c && c !== 'general' && !/^\d+(?:,\s*\d+)*$/.test(c),
  ) ?? null
}

function buildProductLink(): string {
  const params = new URLSearchParams()
  if (route.query.zip) params.append('zip', route.query.zip as string)
  if (route.query.lat) params.append('lat', route.query.lat as string)
  if (route.query.lon) params.append('lon', route.query.lon as string)
  if (route.query.max_distance) params.append('max_distance', route.query.max_distance as string)
  // Fallback to userLocation if query doesn't have it but we have it in state
  if (!route.query.lat && userLocation.value) {
    params.append('lat', userLocation.value.lat.toString())
    params.append('lon', userLocation.value.lon.toString())
    if (distanceFilterKm.value && !route.query.max_distance) {
      params.append('max_distance', distanceFilterKm.value.toString())
    }
  }
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function getTopAttributes(product: ProductDocument, limit = 4): ProductAttribute[] {
  if (!product.attributes || !Array.isArray(product.attributes)) return []
  const excludedKeys = new Set([
    'condition', 'title', 'price', 'description', 'name', 'image', 'url', 'id', 'seo_id',
    'ad_uuid', 'adid', 'adtype_id', 'all_image_urls', 'categorytreeattributeids',
    'categorytreeids', 'changed', 'changed_string', 'country', 'district',
    'enddate', 'enddate_string', 'heading', 'mmo', 'org_uuid', 'orgid',
    'p2penabled', 'postcode', 'price_for_display', 'price/amount', 'product_id',
    'published_string', 'segment', 'state', 'shipping', 'delivery', 'service', 'type',
    'manufactureaddress', 'manufacturertradename',
    'orgname', 'orgmainlogo', 'contact/name', 'address',
    'result_list_style2', 'price_reduction_set_date', 'price_reduction_set_date_string',
    'old_price', 'original_price', 'currency',
    'location_id', 'seller_id', 'shop_id', 'user_id', 'item_id',
    'does_not_come_from_search_engine__teaser_attribute', 'teaser_attribute',
    'product_kind', 'case_of',
  ])
  return product.attributes
    .filter((a: ProductAttribute) => a.key && a.value
      && !excludedKeys.has(a.key.toLowerCase())
      && a.value !== '0' && a.value !== 'null' && a.value !== 'unknown'
      && !a.value.startsWith('http') && a.value.length <= 80)
    .slice(0, limit)
}

const searchTitle = computed(() => {
  const base = t('searchPageTitle', 'Search - Compare Prices')
  return searchQuery.value ? `${searchQuery.value} – ${base}` : base
})

useSeoMeta({
  title: () => searchTitle.value,
  ogTitle: () => searchTitle.value,
  description: () => t('searchPageDescription', 'Compare prices across marketplaces and find the best deals.'),
  ogType: 'website',
})
</script>
