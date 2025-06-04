<template>
  <UiButton @on-click="handleWindowState">
    hello world
  </UiButton>
  <Teleport to="body">
    <div
      v-if="openMapWindow"
      class="fixed inset-0 z-50 overflow-y-auto flex"
    >
      <div
        class="fixed inset-0 bg-black bg-opacity-50 h-full flex flex-col items-center justify-center transition-opacity"
      >
        <div class="w-[80%] h-[70%] mb-10">
          <ClientOnly>
            <LMap
              ref="map"
              :zoom="mapZoom"
              :center="userLocation as any"
              class="w-full h-full"
              :use-global-leaflet="false"
            >
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
              />
              <LCircle
                :lat-lng="userLocation as any"
                :radius="(model?.searchRadius ?? 0) * 1000"
              />
              <LMarker :lat-lng="userLocation as any" />
            </LMap>
          </ClientOnly>
          <div class="p-4 bg-slate-800 border-slate-600 shadow-lg">
            <UiHeaderLabel
              :label="t('notificationSettingsRadius', { amount: model!.searchRadius })"
              :accent="true"
            />
            <div class="flex items-center">
              <input
                id="radius-slider"
                v-model="model!.searchRadius"
                type="range"
                min="1"
                max="250"
                step="1"
                class="w-full h-2 rounded-lg appearance-none cursor-pointer range-sm bg-gray-700"
              >
              <UiButton
                class="ml-6"
                :primary="true"
              >
                {{ t('confirm') }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Filter } from '~/types/FilterType'

const { t } = useI18n()
const openMapWindow = ref(false)

const model = defineModel<Filter>()
const mapZoom = ref(9.8)

const userLocation = ref([0.0, 0.0])

// update the zoom on the map as the radius changes
watch(() => model!.value!.searchRadius, (newRadius) => {
  if (!newRadius) return
  const zoomFactor = 0.03
  const zoomOffset = 11
  const calculatedZoom = zoomOffset - newRadius * zoomFactor

  mapZoom.value = Math.max(calculatedZoom, 6)
})

function handleWindowState() {
  openMapWindow.value = !openMapWindow.value
  if (openMapWindow.value)
    loadSearchRadius()
}

async function loadSearchRadius() {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${model!.value!.zipcode}&country=${data.country_name}&format=json`
    const response2 = await fetch(url)
    const data2 = await response2.json()
    if (data2.length == 0) {
      push.error(t('enteringZipCodeError'))
    }
    userLocation.value = [data2[0].lat, data2[0].lon]
    model!.value!.searchRadius = 40
  }
  catch (error) {
    console.error('Error fetching country:', error)
    push.error(`${t('weRanIssue')}\n ${error}`)
  }
}
</script>
