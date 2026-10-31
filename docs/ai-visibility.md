# AI visibility research baseline

Both reports below are preserved verbatim. They are separate runs with different question sets; their findings and historical claims must not be treated as current product documentation. Implementation notes follow both runs.

## Run 173

# Ane AI visibility — 29 October 2026

## Method and results

Two sequential `ai-recommendations` requests: five questions each, `--repeat 2 --brand Ane --brand ane.deals`; five German/five English, 20 completed web-search answers. R1/R2 show recommended tools’ first-appearance order, excluding search subjects/incidental integrations. Citation links preserve URL order.

**Ane: 0/20 (0%), no rank/citation.** Q2/R2’s automated Ane rank-1 match is “planen”, not Ane: raw presence 1/20 (5%), Q2 1/2 (50%). SkyCofl is Coflnet-owned, not a competitor.

| Question (verbatim) | Answer summary; recommended products/sites in order | Cited URLs, by run | Ane; rank; presence |
|---|---|---|---|
| Q1: Wie erfahre ich als Erster von neuen Kleinanzeigen-Angeboten für eine gebrauchte Nintendo Switch unter 150 Euro in meiner Nähe? | Native saved searches win.<br>R1: Kleinanzeigen<br>R2: Kleinanzeigen | R1 [1](https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein) [2](https://hilfe.kleinanzeigen.de/hc/de/articles/17128455544092-Wie-kann-ich-Benachrichtigungen-abbestellen)<br>R2 [1](https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein) [2](https://hilfe.kleinanzeigen.de/hc/de/articles/17105421380764-Wie-funktioniert-die-Umkreissuche) [3](https://hilfe.kleinanzeigen.de/hc/de/articles/22774175164572-Sicher-handeln-auf-Kleinanzeigen-so-erkennst-du-Betrug) [4](https://themen.kleinanzeigen.de/nutzungsbedingungen/) | No; —; 0/2 (0%) |
| Q2: Welche Tools helfen mir als Reseller, neue Angebote auf mehreren Online-Marktplätzen automatisch zu überwachen? | Arbitrage/repricing versus scraping tools.<br>R1: Tactical Arbitrage → SellerAmp → Keepa → SellerActive → Prisync → Dealavo<br>R2: Apify → Browse AI → Distill → Prisync → Tactical Arbitrage → SellerActive | R1 [1](https://tacticalarbitrage.threecolts.support/en/articles/10271768-product-search) [2](https://selleramp.com/features/) [3](https://www.selleractive.com/support/competitor-review) [4](https://www.selleractive.com/capabilities-multichannel-automated-repricing) [5](https://shopify.prisync.com/) [6](https://portalexporte.de/themen/preisanalyse/anbietervergleich/)<br>R2 [1](https://apify.com/cliqtomedia/vinted-scraper) [2](https://www.browse.ai/monitor) [3](https://distill.io/docs/web-monitor/what-is-distill/) [4](https://helpcenter.prisync.com/hc/en-us/articles/213513145-Tracking-Different-Marketplace-Sellers) [5](https://help.tacticalarbitrage.com/knowledge-base/article/other-filters) [6](https://www.selleractive.com/pricing) | No; —; 0/2 (0%) |
| Q3: Wie bekomme ich neue Kleinanzeigen-Treffer mit Suchbegriffen und ausgeschlossenen Wörtern direkt als Push oder in Discord? | Native push; third-party Discord/exclusions.<br>R1: Kleinanzeigen → Kleinanzeigen Agent → n8n → Make<br>R2: Kleinanzeigen → Kleinanzeigen-Enhanced → Kleinanzeigen Agent | R1 [1](https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein) [2](https://kleinanzeigen-agent.de/dokumentation) [3](https://n8n.io/) [4](https://www.make.com/)<br>R2 [1](https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein) [2](https://hilfe.kleinanzeigen.de/hc/de/articles/17105129124764-Wie-suche-und-filtere-ich-am-besten) [3](https://hilfe.kleinanzeigen-enhanced.de/suchauftraege/) [4](https://kleinanzeigen-agent.de/dokumentation) [5](https://kleinanzeigen-agent.de/datenschutz) | No; —; 0/2 (0%) |
| Q4: How can I get alerts for new Craigslist listings matching a price range without refreshing the site all day? | Native email plus notification routing.<br>R1: Craigslist → Gmail/Outlook → IFTTT → OpenRSS → Feedly → Inoreader → SearchTempest<br>R2: Craigslist → Gmail | R1 [1](https://www.craigslist.org/about/help/account/features/alerts) [2](https://www.craigslist.org/about/help/account/features/searches/) [3](https://www.craigslist.org/about/help/searching/filtering/) [4](https://ifttt.com/applets/Xm85hsNV-get-an-android-sms-when-a-new-craigslist-listing-matches-your-search) [5](https://openrss.org/feeds/craigslist)<br>R2 [1](https://www.craigslist.org/about/help/account/features/alerts) [2](https://support.google.com/mail/answer/6579?hl=en-EN) [3](https://support.google.com/mail/answer/1075549?co=GENIE.Platform%3DAndroid&hl=en) [4](https://www.craigslist.org/about/help/results) | No; —; 0/2 (0%) |
| Q5: What tools help a reseller compare used-item asking prices and spot potentially underpriced listings? | Sold-price research outranks asking-price feeds.<br>R1: eBay Product Research → eBay Completed Listings → WorthPoint → PriceCharting → Google Lens → PageCrawl<br>R2: eBay Product Research → eBay Saved Searches → WorthPoint → Reverb → Discogs → Google Lens | R1 [1](https://www.ebay.com/help/selling/selling-tools/research?id=4853) [2](https://www.ebay.com/help/selling/listings/pricing-items?id=4133) [3](https://www.worthpoint.com/) [4](https://www.pricecharting.com/page/methodology) [5](https://blog.google/products-and-platforms/products/shopping/visual-search-lens-shopping/) [6](https://track.pagecrawl.io/tools/facebook-marketplace-price-drop-alerts.html)<br>R2 [1](https://www.ebay.com/help/selling/selling-tools/terapeak?id=4853) [2](https://www.ebay.com/help/buying/finding-items-managing-purchases/save-search?id=4051) [3](https://www.worthpoint.com/) [4](https://reverb.com/price-guide) [5](https://support.discogs.com/hc/en-us/articles/360007425553-Where-Can-I-Access-Sales-History) [6](https://support.discogs.com/hc/en-us/articles/47366145329421-How-To-Search-Filter-Marketplace-Listings) [7](https://blog.google/products-and-platforms/products/shopping/visual-search-lens-shopping/) | No; —; 0/2 (0%) |
| Q6: Welche Alternative zum normalen Kleinanzeigen-Suchauftrag meldet neue Angebote schneller, und was kostet sie? | Paid faster polling recommended.<br>R1: SnipingTool<br>R2: Kleinanzeigen Agent | R1 [1](https://sniping-tool.de/) [2](https://sniping-tool.de/pricing) [3](https://sniping-tool.de/kleinanzeigen-alert) [4](https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein)<br>R2 [1](https://kleinanzeigen-agent.de/suchagenten) [2](https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein) | No; —; 0/2 (0%) |
| Q7: Wie kann ich neue Gebrauchtwagen-Angebote auf AutoScout24 nach Preis und Suchkriterien automatisch überwachen? | Native saved searches win.<br>R1: AutoScout24<br>R2: AutoScout24 → Distill | R1 [1](https://www.autoscout24.de/promo-lp/bei-autoscout24-registrieren/) [2](https://www.autoscout24.de/app/) [3](https://www.autoscout24.de/promo-lp/fahrzeuge-merken/)<br>R2 [1](https://www.autoscout24.de/promo-lp/bei-autoscout24-registrieren/) [2](https://www.autoscout24.de/app/) [3](https://distill.io/docs/web-monitor/what-is-distill/) [4](https://www.autoscout24.de/lst/auto) | No; —; 0/2 (0%) |
| Q8: How can I monitor several second-hand marketplaces and receive email or phone alerts when matching items appear? | Native alerts plus aggregators.<br>R1: eBay → Craigslist → OfferUp → Facebook Marketplace → Distill → Flippah<br>R2: eBay → OfferUp → Poshmark → Classifindr → Flipinator → Distill | R1 [1](https://www.ebay.com/help/buying/search-tips/saved-searches?id=4051) [2](https://www.craigslist.org/about/help/account/features/alerts) [3](https://help.offerup.com/hc/en-us/articles/360031995332-Get-notified-about-items-you-want) [4](https://distill.io/docs/web-monitor/what-is-distill/) [5](https://distill.io/docs/web-monitor/get-sms-alert-on-webpage-change/) [6](https://flippah.net/)<br>R2 [1](https://www.ebay.com/help/buying/search-tips/saved-searches?id=4051) [2](https://www.ebay.com/help/account/changing-account-settings/notifications?id=4203) [3](https://help.offerup.com/hc/en-us/articles/360031995332-Get-notified-about-items-you-want) [4](https://classifindr.com/) [5](https://flipinator.com/) [6](https://distill.io/docs/web-monitor/what-is-distill/) [7](https://distill.io/docs/web-monitor/get-sms-alert-on-webpage-change/) | No; —; 0/2 (0%) |
| Q9: What is a good way to track newly listed LEGO sets and retro games for resale without checking marketplaces manually? | Category feeds plus targeted searches.<br>R1: Brickset → PriceCharting → eBay Saved Searches → eBay Product Research<br>R2: eBay → Brickset → Feedly → Inoreader → BrickTrack → BrickEconomy → Distill | R1 [1](https://brickset.com/sitemap) [2](https://brickset.com/sets) [3](https://www.pricecharting.com/pricecharting-pro?f=menu) [4](https://www.pricecharting.com/page/collection-tracker) [5](https://www.ebay.com/help/buying/search-tips/saved-searches?id=4051) [6](https://www.ebay.com/help/selling/selling-tools/terapeak?id=4853)<br>R2 [1](https://www.ebay.com/help/buying/search-tips/saved-searches?id=4051) [2](https://brickset.com/feed/category-new-sets) [3](https://brickset.com/article/52663) [4](https://bricktrack.com/) [5](https://www.brickeconomy.com/articles/retirement-watch) [6](https://distill.io/docs/web-monitor/what-is-distill/) | No; —; 0/2 (0%) |
| Q10: Which marketplace alert services offer a free plan, and how do their notification delays compare with paid plans? | Game/restock alerts versus general page monitors.<br>R1: SkyCofl (own, off-topic) → PikaNotify → BuyMap<br>R2: Visualping → Distill → OR:ON/Hexowatch | R1 [1](https://sky.coflnet.com/wiki/premium) [2](https://sky.coflnet.com/subscriptions) [3](https://pikanotify.com/faq) [4](https://buymap.app/faq)<br>R2 [1](https://visualping.io/pricing?plan=free) [2](https://distill.io/pricing/) [3](https://orion.hexowatch.com/) | No; —; 0/2 (0%) |

## Why the cited sources are usable

Counts represent answers citing exact URLs. Sources opened with `fetch`; claims remain publisher claims.

- **Kleinanzeigen saved-search help (6/20)**: authoritative Q&A title and web/app steps. **eBay saved searches (4/20)** explains filters and emails. **Craigslist alerts (3/20)** states adaptive frequency and a 20-result limit.
- **Distill’s introduction (5/20)** separates local/cloud monitoring, detection and delivery, with channel lists and linked setup documentation. **AutoScout24 registration (2/20)** directly answers saved-filter and email/push questions. Ane needs demonstrable added value.
- **Kleinanzeigen Agent documentation (2/20)** exposes Discord setup, billing and polling. Live text says €14.90 net/month and two-minute checks; answers claim €5.90 and ten minutes. **Kleinanzeigen-Enhanced (1/20)** documents exclusions and browser-running requirements; fetched text did not substantiate the answer’s Discord claim.
- **WorthPoint (2/20)** explains historical sales coverage and claims approximately one billion records. **eBay Product Research (2/20)** specifies three years of sales data. **Google Lens (2/20)** has an October 2024 official announcement; freshness alone does not explain citations.
- **[portalexporte comparison](https://portalexporte.de/themen/preisanalyse/anbietervergleich/) (1/20)** has an author, October 22, 2026 update, direct-answer introduction and price/source/frequency/audience table. Vendor-authored, not independent. **Browse AI (1/20)** demonstrates monitoring; **SnipingTool pricing (1/20)** tabulates plan limits and scan intervals.

No Reddit/forum, YouTube or directory citations appeared.

## Gaps and prioritised actions

Audited public pages, blog, both locales, metadata/schema and sitemap. Article/Product/Breadcrumb/ItemList markup and canonical/hreflang exist; marketplace/blog sitemap entries respect article publication dates. No tracked `llms.txt`; prioritise answerable content first.

Effort: S copy; M guide; L measurement/outreach. Effects are estimates.

| Priority / questions | Exact page or placement | Concrete change | Effort / expected effect |
|---|---|---|---|
| 1 · Q1,3,6 | `/de/marketplaces/kleinanzeigen` | Add Switch-under-€150/radius setup, exclusion examples and Discord steps; compare native alerts, Agent and Enhanced using dated sources. Qualify “within a minute” by plan and distinguish polling from delivery. | M / high |
| 1 · Q10,6 | `/subscriptions`, `/`, `/de`, `locales/en.json`, `locales/de.json` | Publish one consistent price/search-limit/channel/delay table; validate current billing first. Resolve English SMS versus German Discord and the English speed-FAQ heading mismatch. | S–M / high |
| 1 · Q2,8 | Proposed `/marketplaces` and `/de/marketplaces` | List verified supported sites/countries and one cross-marketplace workflow; distinguish new listings from repricing inventory. Link from homepage; use descriptive marketplace-alert titles instead of generic ANE defaults. | M / high |
| 2 · Q4 | `/marketplaces/craigslist` | Explain price-range setup and email/push options; compare native adaptive emails with verified Ane delays and limits. | M / medium |
| 2 · Q7 | `/de/marketplaces/autoscout24` | Worked car-search example; explain when native saved searches suffice and what Ane demonstrably adds. | M / medium |
| 2 · Q5 | `/flipper` | Show dated, reproducible asking-price comparisons and costs; distinguish completed sales/profit. | M–L / medium |
| 2 · Q9 | `/blog/lego-wertanlage-eol-sets`, `/blog/retro-gaming-flohmarkt-schaetze` | Add notifier recipes, setup links, sourced numbers and English versions; reconcile “weekly” with four April–May articles. | M / medium |
| 3 · Q2,8,10 | Proposed AlternativeTo listing alongside Distill; portalexporte comparison | Request factual, affiliation-disclosed inclusion; portalexporte only if covering second-hand sourcing. | L / uncertain |
| 3 · Q1,3,9 | Reddit r/Flipping weekly newbie thread; relevant r/kleinanzeigen discussions | Check rules; contribute disclosed, useful setup answers. Untested prospects, not endorsements. | L / uncertain |

## Could not verify

OfferUp’s cited help page (`help.offerup.com`) returned HTTP 403 again on retry; its instructions remain unverified. No delivery-speed/coverage/billing tests, causal ranking proof or index audit. Not all citations opened. No external submissions. This single assistant workflow and two repetitions cannot represent every ChatGPT model; repeat after publishing validated changes.

## Run 172

# Ane AI visibility — 29 October 2026

## Method and results

Two sequential `ai-recommendations` batches; five German/five English questions, `--repeat 2 --brand Ane --brand ane.deals`. Completed: 20/20 answers. One web-search assistant, not ChatGPT specifically. Ane: **0/20 mentions (0%)**, no rank/recommendation. No other own brand appeared.

Exact questions below. R1/R2 show recommendation order, excluding incidental examples/channels. Links preserve all returned citations. Orders were manually checked against answers because automated product extraction was noisy. Presence combines both Ane spellings.

| # / Question | Answer summary; brands/options in order | Cited URLs R1 / R2 | Ane; rank; presence |
|---|---|---|---|
| 1. Ich kaufe gebrauchte Spielekonsolen zum Weiterverkaufen. Wie bekomme ich neue Kleinanzeigen-Angebote schneller mit als über den normalen Suchauftrag, mit Preislimit und Umkreis? | Fast paid alerts plus native backup. **R1:** SnipingTool → Kleinanzeigen-Enhanced → Kleinanzeigen. **R2:** Kleinanzeigen → DealFinder → Kleinanzeigen Agent. | R1: [1][s1] [2][s2] [3][s3] [4][s4]<br>R2: [3][s3] [5][s5] [6][s6] | No; —; 0/2 (0%) |
| 2. Welche Tools melden mir neue passende Angebote auf mehreren Gebraucht-Marktplätzen, ohne dass ich ständig jede Seite aktualisieren muss? | Aggregators or separate native searches. **R1:** Kleinanzeigen-Enhanced → Kleinanzeigen → eBay → Vinted → nebenan.de. **R2:** Flipscanner → Kleinanzeigen-Enhanced → Distill → Visualping → changedetection.io. | R1: [2][s2] [3][s3] [7][s7] [8][s8] [9][s9]<br>R2: [10][s10] [2][s2] [11][s11] [12][s12] [13][s13] | No; —; 0/2 (0%) |
| 3. Ich suche seltene Pokémon-Karten und LEGO-Sets. Wie richte ich Benachrichtigungen mit Suchbegriffen, Ausschlusswörtern und Maximalpreis ein? | Saved searches plus specialist wishlists. **R1:** eBay → Kleinanzeigen → Cardmarket → BrickLink. **R2:** eBay → Kleinanzeigen → Cardmarket → Brickmerge → BrickLink. | R1: [7][s7] [14][s14] [3][s3] [15][s15] [16][s16] [17][s17] [18][s18]<br>R2: [19][s19] [20][s20] [3][s3] [16][s16] [21][s21] [17][s17] | No; —; 0/2 (0%) |
| 4. Welche kostenlosen und kostenpflichtigen Suchagenten für Kleinanzeigen lohnen sich für Reseller, und wie unterscheiden sich Preise und Benachrichtigungsgeschwindigkeit? | Free/paid comparison by interval and channel. **R1:** Kleinanzeigen → Kleinanzeigen Agent → Kleinanzeigen-Enhanced → Agent Webhooks/API. **R2:** Kleinanzeigen → Agent Suchagent → Agent API → Agent Webhooks. | R1: [3][s3] [6][s6] [2][s2] [22][s22]<br>R2: [3][s3] [23][s23] [6][s6] [24][s24] | No; —; 0/2 (0%) |
| 5. Wie kann ich neue Gebrauchtwagen-Angebote auf AutoScout24 mit meinen Preis- und Standortkriterien automatisch überwachen? | Native saved search preferred. **R1:** AutoScout24. **R2:** AutoScout24 → Distill → Visualping. | R1: [25][s25] [26][s26]<br>R2: [25][s25] [27][s27] | No; —; 0/2 (0%) |
| 6. What tools can alert me to new second-hand marketplace listings across multiple sites so I can buy underpriced items for resale? | Cross-site shortlist; different first choices. **R1:** DealHunter → Flipify → Flipinator → SearchTempest; eBay/Terapeak research. **R2:** Flipify → Dibs → FlipVista → Swoopa → Visualping. | R1: [28][s28] [29][s29] [30][s30] [31][s31]<br>R2: [32][s32] [33][s33] [34][s34] [35][s35] [36][s36] [29][s29] | No; —; 0/2 (0%) |
| 7. How can I get alerts for new Craigslist listings matching a maximum price and local area without checking the site all day? | Native email first; push alternatives. **R1:** Craigslist → IFTTT/OpenRSS. **R2:** Craigslist → SearchTempest. | R1: [37][s37] [38][s38] [39][s39]<br>R2: [40][s40] [37][s37] [41][s41] | No; —; 0/2 (0%) |
| 8. I collect retro games and consoles. What services notify me about new listings while filtering out unwanted keywords and overpriced items? | Native filters versus specialist game alerts. **R1:** eBay → GameCollector → PrixRetro → Whatnot. **R2:** RetroSnag → Flipify → eBay. | R1: [42][s42] [19][s19] [43][s43] [44][s44] [45][s45]<br>R2: [46][s46] [29][s29] [19][s19] [47][s47] | No; —; 0/2 (0%) |
| 9. Which marketplace monitoring services can send new-item alerts to Discord or email, and what do they cost? | Channel-and-price comparisons. **R1:** Pouncify → Marketplace Monitor → Outpost Alerts → Pounce → eSnipe → Browse AI. **R2:** Choppy → eSnipe → Pounce → ResellTracker → Visualping. | R1: [48][s48] [49][s49] [50][s50] [51][s51] [52][s52] [53][s53] [54][s54]<br>R2: [55][s55] [52][s52] [51][s51] [56][s56] [57][s57] | No; —; 0/2 (0%) |
| 10. What is the best way to find underpriced used items for flipping in Germany and get notified before other buyers? | Niche sourcing, sold prices, targeted alerts. **R1:** Kleinanzeigen → eBay.de → Vinted → Facebook Marketplace. **R2:** eBay sold-price research → Kleinanzeigen → eBay.de → DealFinder. | R1: [3][s3] [7][s7] [58][s58] [8][s8]<br>R2: [59][s59] [7][s7] [60][s60] [5][s5] [61][s61] [62][s62] | No; —; 0/2 (0%) |

## Cited-source analysis

Counts measure runs citing each URL; citability explanations are hypotheses.

- Kleinanzeigen help [3][s3] (8/20), eBay DE [7][s7] (4/20), eBay EN [19][s19] (3/20), AutoScout24 [25][s25] and Craigslist [37][s37] (2/20 each): authoritative setup instructions. Craigslist explains variable frequency and its 20-result email cap.
- Kleinanzeigen-Enhanced [2][s2] (4/20): interval table, five-minute Kleinanzeigen minimum, browser requirement and experimental-platform caveats.
- Kleinanzeigen Agent [6][s6] and Flipify help [29][s29] (3/20 each): filters, setup, troubleshooting and Q&A. Flipify distinguishes one-/ten-minute watchlists.
- DealFinder’s Google Play listing [5][s5] (2/20): €4.99 Pro, ten searches, three-minute checks, update date 17 May 2026. Whop’s ResellTracker listing [56][s56] (1/20): €17.99, five monitors, Discord setup and FAQ.
- eSnipe [52][s52] and Pounce [51][s51] (2/20 each): channels, prices and workflows; eSnipe explains affiliate funding, Pounce distinguishes $69/$149 plans. SnipingTool [1][s1] (1/20) pairs a pricing comparison with plan-specific scan limits.
- Cardmarket [16][s16] (2/20) documents alert conditions and first-match limits. BrickLink [17][s17] (2/20) actually opens XML-import documentation: a citation is not proof of the surrounding recommendation.

## Prioritised actions

Effort: S = copy/documentation, M = researched page or placement. Expected effect is a hypothesis.

| Priority / questions | Effort / expected effect | Exact target and change |
|---|---|---|
| 1 / 1,4,9,10 | S / high | `/`, `/de`, `/subscriptions`: dated price/limit/delay/channel table. Repository tiers: €0/€9.99/€69.69, 3/20/500 searches, 60/10/1-minute delays. Qualify “instant”; verify SMS versus email/push/Discord wording. Fix English `faq.items.fifth.question`, which asks about marketplace count instead of speed. |
| 2 / 1,4,10 | M / high | `/de/marketplaces/kleinanzeigen`: console example with exclusions/price/radius; sourced native/Enhanced/Agent comparison with limitations and dated measurements. |
| 3 / 2,6 | M / high | Proposed `/marketplace-alerts` and `/de/marktplatz-suchagenten`: verified coverage/channel matrix, setup and browser requirements. Explain when native alerts suffice; never copy competitors’ coverage claims. |
| 4 / 3,8 | M / medium | Extend `/blog/pokemon-silberne-sturmwinde-display-flippen` and `/blog/retro-gaming-flohmarkt-schaetze` with notifier examples; add an English retro-alert guide linking to filter creation. |
| 5 / 5,7 | S / medium | `/de/marketplaces/autoscout24`, `/marketplaces/craigslist`: native-versus-Ane walkthrough, price/location examples, channel/latency limits and added value. |
| 6 / 9 | M / medium | Proposed `/discord-marketplace-alerts` plus German counterpart: webhook setup, sample alert, delivery test, email alternative and prices. |
| 7 / all | S–M / medium | Homepage inherits generic English metadata from `app.vue`: localize titles/descriptions. Marketplace metadata, BlogPosting/breadcrumbs and sitemap sources exist. Translate German-only articles served through both locale routes. Add guides to `server/api/__sitemap__/urls.ts` and accurate Q&A/schema. No tracked `llms.txt`; prioritize substantive pages. |
| 8 / 2,6,9,10 | M / uncertain | Evaluate Whop alongside ResellTracker; propose Ane for AlternativeTo’s Distill alternatives and permission-based demonstrations in r/Flipping tool discussions. Disclose affiliation. Placement fit/eligibility is unverified; these are prospects, not observed Ane listings. |

## Could not be verified

Latency, delivery, checkout prices, integrations and profits were not tested. Live Ane redirected to `/de`, showing matching tier claims. Not all 62 cited URLs were opened; all six cited ≥3 times were. No Reddit, YouTube or editorial listicle was cited. Placement impact is unknown. Two repeats cannot establish stable rankings; rerun identical prompts after changes. Inclusion is not established.

[s1]: https://sniping-tool.de/
[s2]: https://hilfe.kleinanzeigen-enhanced.de/suchauftraege/
[s3]: https://hilfe.kleinanzeigen.de/hc/de/articles/17102975598492-Ich-m%C3%B6chte-automatisch-neue-Suchergebnisse-zu-meiner-Suche-erhalten-Wie-richte-ich-das-ein
[s4]: https://themen.kleinanzeigen.de/nutzungsbedingungen/
[s5]: https://play.google.com/store/apps/details?hl=de&id=nl.dealfinder.app
[s6]: https://kleinanzeigen-agent.de/dokumentation
[s7]: https://www.ebay.de/help/default/default/gespeicherte-suchen?id=4051
[s8]: https://www.vinted.de/help/5/35-artikelen-vinden
[s9]: https://hilfe.nebenan.de/hc/de/articles/205664411-E-Mail-und-Push-Benachrichtigungen-f%C3%BCr-meine-Bed%C3%BCrfnisse-konfigurieren
[s10]: https://flipscanner.app/
[s11]: https://distill.io/
[s12]: https://help.visualping.io/en/articles/10154433
[s13]: https://changedetection.io/
[s14]: https://www.developer.ebay.com/support/knowledge-base/2190
[s15]: https://hilfe.kleinanzeigen.de/hc/de/articles/17105129124764-Wie-suche-und-filtere-ich-am-besten
[s16]: https://help.cardmarket.com/en/add-cards-to-wants
[s17]: https://www.bricklink.com/help.asp?helpID=2567&viewType=shop
[s18]: https://www.bricklink.com/help.asp?helpID=3&q=7454%5D
[s19]: https://www.ebay.com/help/buying/finding-items-managing-purchases/save-search?id=4051
[s20]: https://ocsnext.ebay.de/help/selling/selling-tools/produktrecherche?id=4853
[s21]: https://www.brickmerge.de/Neu-auf-brickmerge
[s22]: https://kleinanzeigen-enhanced.de/produkt/privat/
[s23]: https://kleinanzeigen-agent.de/suchagenten
[s24]: https://kleinanzeigen-agent.de/
[s25]: https://www.autoscout24.de/promo-lp/bei-autoscout24-registrieren/
[s26]: https://www.autoscout24.de/app/
[s27]: https://www.autoscout24.de/promo-lp/fahrzeuge-merken/
[s28]: https://dealhunter.io/
[s29]: https://www.flipifyapp.com/help
[s30]: https://flipinator.com/
[s31]: https://www.searchtempest.com/about
[s32]: https://www.flipifyapp.com/
[s33]: https://dibs.deals/
[s34]: https://www.flipvista.com/
[s35]: https://getswoopa.com/
[s36]: https://visualping.io/
[s37]: https://www.craigslist.org/about/help/account/features/alerts
[s38]: https://openrss.org/feeds/craigslist
[s39]: https://ifttt.com/connect/feed/if_notifications
[s40]: https://www.craigslist.org/about/help/account/features/searches/
[s41]: https://searchtempest.zendesk.com/hc/en-us
[s42]: https://www.ebay.com/help/Buying/Finding_Items_Managing_Purchases/Advanced_search?id=4049
[s43]: https://www.gamecollector.app/
[s44]: https://www.prixretro.com/en/alertes
[s45]: https://help.whatnot.com/hc/en-us/articles/9780885421069-Bookmark-a-show-listing-or-search
[s46]: https://retrosnag.com/
[s47]: https://www.ebay.com/sch/ebayadvsearch
[s48]: https://pouncify.com/facebook-marketplace-alerts
[s49]: https://marketplacemonitor.com/pricing/
[s50]: https://outpostalerts.com/
[s51]: https://pounce.gg/
[s52]: https://esnipe.app/
[s53]: https://www.browse.ai/pricing
[s54]: https://marketplacemonitor.com/faq/
[s55]: https://getchoppy.fr/en/pricing
[s56]: https://whop.com/reselltracker/vinted-plan/
[s57]: https://help.visualping.io/en/articles/14476033
[s58]: https://www.ebay.de/help/account/changing-account-settings/pushbenachrichtigungen?id=4203
[s59]: https://hilfe.kleinanzeigen.de/hc/de/articles/17128455544092-Wie-kann-ich-Benachrichtigungen-abbestellen
[s60]: https://www.ebay.de/help/buying/default/erweiterte-suche?id=4049
[s61]: https://hilfe.kleinanzeigen.de/hc/de/articles/21577178360476-FAQ-H%C3%A4ufige-Fragen-zu-Phishing-bei-Kleinanzeigen
[s62]: https://hilfe.kleinanzeigen.de/hc/de/articles/17211553583388-Was-ist-Sicher-bezahlen-wie-funktioniert-der-K%C3%A4uferschutz

## Implemented

Implementation date: 29 October 2026. Run numbers below identify the reports, not a combined measurement. No new recommendation survey or external submission was made.

| Research action | Public URLs (also available with `/de` prefix) | Implementation and remaining limits |
|---|---|---|
| 173 P1 Q1,3,6; 172 action 2 | `/marketplaces/kleinanzeigen` | Switch-under-€150 example with pickup radius, exclusions and notification setup. Dated native/Agent/Enhanced comparison links to documentation opened during implementation. Publisher polling claims are explicitly not delivery measurements. |
| 173 P1 Q6,10; 172 action 1 | `/`, `/de`, `/subscriptions` and marketplace guides | Shared table reads the existing subscription constants for price and active-search limits. The delay column is omitted because no numeric Flipper delay is configured. Corrected SMS and speed-question copy, and removed affected unconditional speed claims. |
| 173 P1 Q2,8; 172 action 3 | `/marketplaces`, `/de/marketplaces` | Bilingual hub with selectable marketplace and country lists, a repeatable cross-marketplace workflow, channel setup and limits. This consolidates the proposed marketplace-alerts URLs without removing any existing URL. Selector options do not establish live coverage for every marketplace/country pair. |
| 173 P2 Q4,7; 172 action 5 | `/marketplaces/craigslist`, `/marketplaces/autoscout24` | Price/location examples; native saved-search alternatives; sourced adaptive-email and vehicle-search facts. Ane’s value is shared filters and channel choices, not an unmeasured speed advantage. |
| 173 P2 Q5; 172 Q10 | `/flipper` | Dated, repeatable asking-price comparison checklist, cost categories and plan link. Clearly separates asking prices, reference values, completed sales and profit. A live worked valuation and measured returns remain open; no numbers were invented. |
| 173 P2 Q9; 172 action 4 | `/blog/lego-wertanlage-eol-sets`, `/blog/retro-gaming-flohmarkt-schaetze`, `/blog/pokemon-silberne-sturmwinde-display-flippen`, `/guides/collectible-alerts` | Added German notifier recipes and setup links; a dedicated English/German guide covers LEGO, Pokémon and retro games. Removed the weekly-publication promise. Legacy articles remain German; the new bilingual guide translates the actionable notifier material, not the legacy market-price claims. |
| 172 action 6 | `/marketplaces`, `/de/marketplaces` | Consolidated Discord webhook setup, first-match delivery verification and email alternative into the hub. No live test message or sample production alert was sent. |
| 172 action 7 | `/`, `/de`, `/marketplaces`, `/guides/collectible-alerts`, existing marketplace pages | Localized descriptive metadata, visible FAQs with matching FAQPage markup, breadcrumb markup and localized sitemap entries. Existing article schema and publication gating are reused. |
| 173 P3; 172 action 8 | External operator follow-ups | Evaluate AlternativeTo, Whop and portalexporte fit; check subreddit rules before any useful, affiliation-disclosed contribution to r/Flipping or r/kleinanzeigen. No posting, registration, outreach or submission was performed. |

### Evidence and open facts

- Product facts: `constants/SubscriptionConstants.ts`, `constants/CreateFilterConstants.ts`, the country selector, filter editor, notification controls and existing Flipper UI. Public examples are user-selected budgets, not market valuations.
- Competitor facts: the directly linked Kleinanzeigen, Kleinanzeigen Agent, Enhanced, Craigslist and AutoScout24 documentation was opened on the implementation date. Comparisons remain publisher claims, not independent benchmarks.
- Delivery latency, per-country live coverage, browser-off delivery and realized resale outcomes have not been tested. Do not infer guaranteed speed or profit from a configured notifier or a price difference.
- Repeat the original question sets only after publication and indexing; compare the two baselines separately. No causal search-ranking improvement is claimed.

- Billing follow-up: confirm current prices, VAT treatment and channels per plan. The shared table labels terms as repository-listed, omits channel entitlements and directs readers to checkout for the final charge. Subscription cards retain the configured push entitlement.

### Claim sources

- The notifier editor offers eBay, Kleinanzeigen, Marktplaats, Willhaben, Vinted, Blocket, ParuVendu, OLX, Gumtree, AutoScout24 and Craigslist: `constants/CreateFilterConstants.ts:7`, `constants/CreateFilterConstants.ts:19`; the editor consumes that list at `components/filters/SearchValueMarketplaceFilter.vue:32`.
- The country selector offers Europe, United States, Canada, United Kingdom, Germany, France, Italy, Japan, Netherlands and Australia: `components/ui/CountryDropDown.vue:32`.
- Shipping selection disables the postcode field: `components/filters/create/CreateCountrySection.vue:18`.
- Web push requests browser permission, while the app bridge sends a notification-permission request: `components/filters/NotificationSettingsWebPushFilter.vue:34`, `components/filters/NotificationSettingsWebPushFilter.vue:51`. This establishes the request, not successful device authorization or delivery.
- The editor offers email, web push and Discord: `components/filters/NotificationSettingsFilter.vue:5`.
- Push notifications are included in all three configured plans: `constants/SubscriptionConstants.ts:36`, `constants/SubscriptionConstants.ts:51`, `constants/SubscriptionConstants.ts:66`.
- Free and Collector have configured delays of 60 and 10 minutes: `constants/SubscriptionConstants.ts:37`, `constants/SubscriptionConstants.ts:52`.
- The Flipper card displays a listing price and reference median: `components/flipper/flipItem.vue:487`, `components/flipper/flipItem.vue:491`. Asking-price comparisons do not establish completed-sale prices or profit; the research's Q5 distinguishes asking-price feeds from completed-sales research.
- Guide FAQ structured data uses the same answers as visible content: `components/marketplaces/AlertGuide.vue:12`.

### Remaining fact questions

- No numeric Flipper delay is defined in the plan configuration. The research lists one minute, while the prior configuration used a nonnumeric “no extra delay” label. Resolve this discrepancy against the delivery implementation before publishing a Flipper delay; the shared comparison omits its delay column and Flipper's delay claims are removed.
- Email and Discord entitlements by plan are not established by the editor's channel choices. Public plan rows asking readers to verify those entitlements are omitted.
- No inventory-repricing implementation establishes the guide's previous negative claims about repricing stock. Those claims are omitted; the guide retains general asking-price guidance.
