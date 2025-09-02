<template>
  <div class="border border-slate-700 rounded-lg  hover:shadow-md transition-shadow w-96 h-full flex flex-col">
    <div class="relative ">
      <img
        v-if="item.listing!.imageUrls?.length != 0"
        :src="item.listing!.imageUrls![0] ?? ''"
        :alt="item.listing?.title ?? ''"
        class="w-full h-48 object-cover rounded-t-lg"
      >
      <div
        v-else
        class="h-48 items-center flex flex-col justify-center"
      >
        <Icon
          name="tabler:search"
          class="w-16 h-16 text-slate-400 mx-auto mb-4 mt-3"
        />
        <UiHeaderLabel :label="$t('noImageForAuction')" />
      </div>

      <div class="absolute top-3 left-3">
        <span
          class="px-2 py-1 rounded-full text-xs font-medium"
          :class="getAuctionTypeBadgeClass(item.listing?.priceKind ?? '')"
        >
          {{ getAuctionTypeText(item.listing?.priceKind ?? '') }}
        </span>
      </div>

      <div class="absolute top-3 right-3">
        <span
          class="px-2 py-1 rounded-full text-xs font-bold"
          :class="getProfitBadgeClass(item.potentialProfit ?? 0)"
        >
          +${{ (item.potentialProfit ?? 0).toFixed(2) }}
        </span>
      </div>

      <div class="absolute bottom-3 left-3">
        <span class="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs" />
      </div>
    </div>

    <div class="p-4 flex flex-col flex-1">
      <h3>
        <UiHeaderLabel
          :label="item.listing?.title ?? ''"
          class="truncate whitespace-nowrap"
        />
      </h3>

      <div class="flex items-center justify-between mb-3">
        <div class="text-center">
          <UiFooterLabel
            :label="$t('listedPrice')"
            :xs="true"
          />
          <UiHeaderLabel
            :label="`$${item.listing?.price}`"
            :white="true"
          />
        </div>
        <div class="items-center flex flex-col">
          <UiFooterLabel
            :label="$t('marketValue')"
            :xs="true"
          />
          <p class="text-green-400 font-bold text-xl">
            ${{ item.medianPrice }}
          </p>
        </div>
      </div>

      <div class="flex gap-2 mb-4 text-sm justify-around">
        <div class="flex space-x-1">
          <UiFooterLabel
            :label="$t('category')"
            :xs="true"
          />
          <UiFooterLabel
            :label="item.category ?? ''"
            :xs="true"
            :white="true"
          />
        </div>

        <div class="flex space-x-1">
          <UiFooterLabel
            :label="$t('location:')"
            :xs="true"
          />
          <UiFooterLabel
            :label="item.listing?.country ?? ''"
            :xs="true"
            :white="true"
          />
        </div>
      </div>

      <div class="flex flex-col item-end mt-auto">
        <UiButton
          :primary="true"
          class="flex-1"
          @on-click="viewItem(item)"
        >
          {{ $t('viewItem') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ item: Flip }>()

const { locale } = useI18n()

const getAuctionTypeBadgeClass = (auctionType: string) => {
  const classes = {
    BuyItNow: 'bg-blue-500 text-white',
    Auction: 'bg-red-500 text-white',
    Negotiatable: 'bg-gray-500 text-white',
  }
  return classes[auctionType as keyof typeof classes] || 'bg-gray-600 text-white'
}

const getAuctionTypeText = (auctionType: string) => {
  const classes = {
    BuyItNow: 'BIN',
    Auction: 'Auction',
    Negotiatable: 'Negotiatable',
  }
  return classes[auctionType as keyof typeof classes] || 'Unknown'
}

const getProfitBadgeClass = (profit: number) => {
  if (profit > 100) return 'bg-green-600 text-white'
  if (profit > 50) return 'bg-green-500 text-white'
  if (profit > 25) return 'bg-yellow-500 text-black'
  return 'bg-orange-500 text-white'
}

const viewItem = (item: Flip) => {
  const url = useListingStore().getUrl(item.listing?.platform ?? 'Ebay', item.listing?.id ?? '', locale.value)

  navigateTo(url, { external: true })
}
</script>
