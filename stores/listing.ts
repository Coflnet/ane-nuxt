import { getMatches } from "~/src/api-client";

export const useListingStore = defineStore("listing", () => {
  const userStore = useUserStore();
  const recentMatches = ref<MatchItem[]>([])

  async function loadMatches() {
    if (!userStore.token) {
      console.error("No token found, can not load matches");
      return;
    }

    recentMatches.value = [];

    const apiToken = `Bearer ${userStore.token}`;

    const response = await getMatches({
      query: { limit: 10 },
      composable: "$fetch",
      headers: { Authorization: apiToken },
    })


    response.map((item) => {
      recentMatches.value.push({
        title: item.listingData?.title ?? null,
        marketplace: item.listingData?.platform,
        price: item.listingData?.price,
        matchedAt: item.matchedAt ?? "",
        filter: item.listenerId ?? undefined,
        url: getUrl(item.listingData?.platform ?? "", item.listingData?.id ?? ""),
        image: item?.listingData?.imageUrls?.[0] ?? ""
      });
    })

    recentMatches.value = recentMatches.value.sort((a, b) => {
      return new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime();
    });
  }

  async function loadMoreMatches(loadedItems: MatchItem[]): Promise<[boolean, MatchItem[]]> {
    const apiToken = `Bearer ${userStore.token}`;

    const response = await getMatches({
      query: { limit: 21, before: loadedItems.at(-1)?.matchedAt },
      composable: "$fetch",
      headers: { Authorization: apiToken },
    })

    response.map((item) => {
      loadedItems.push({
        title: item.listingData?.title ?? null,
        marketplace: item.listingData?.platform,
        price: item.listingData?.price,
        matchedAt: item.matchedAt ?? "",
        filter: item.listenerId ?? undefined,
        url: getUrl(item.listingData?.platform ?? "", item.listingData?.id ?? ""),
        image: item?.listingData?.imageUrls?.[0] ?? ""
      });
    })


    if (response.length == 0) {
      return [false, loadedItems]
    }

    return [true, loadedItems]

  }

  function getUrl(listing: string, id: string) {
    if (listing === 'Ebay') {
      if (navigator.language == "de") {
        return `https://www.ebay.de/itm/` + id;
      }
      return `https://www.ebay.com/itm/` + id;
    }
    if (listing === 'Kleinanzeigen') {
      return `https://www.kleinanzeigen.de/s-anzeige/copy/${id}-1-1`;
    }
    return "";
  }

  return {
    recentMatches,

    loadMatches,
    loadMoreMatches
  }
})
