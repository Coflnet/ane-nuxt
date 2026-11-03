# Ane growth research — 28 October 2026

## Product, audience and evidence

- **Missed deals / repeated refreshing:** collectors, budget buyers and small resellers. Ane has marketplace selection, keyword/price/exclusion filters and email, web-push and Discord delivery ([filters](../constants/CreateFilterConstants.ts), [channels](../components/filters/NotificationSettingsFilter.vue)). Start with German Kleinanzeigen demand; verify marketplace coverage and delivery timing before advertising them. Do not copy the homepage's SMS or “instant” promises without verification.
- **“Is this actually cheap?”:** retro-game/LEGO/Pokémon collectors and sellers clearing collections. [Product pages](../pages/product/[id].vue) expose offers, price history, medians and sample counts; [flipper cards](../components/flipper/flipItem.vue) expose potential profit. These are not proof of completed-sale value or guaranteed margin.
- **Unknown replacement part:** repair cafés, hobby repairers and small workshops. [Parts finder](../pages/parts.vue) accepts photos, dimensions, part numbers and machine names, including broken-gear estimates requiring review. This audience may never search for a deal notifier.
- **Reuse before expanding:** [four existing articles](../utils/articles.ts) cover Pokémon displays, Kleinanzeigen negotiation, retro gaming and LEGO EOL. Refresh their evidence and connect them to matching tools; validate fee, shipping and return claims before promoting them.
- **Method/limits:** parallel alert and repair research plus resale research; public Bing results and linked pages inspected. Google exposed only an access fallback. YouTube/TikTok observations below are search snippets, not watched videos or recommendation-feed audits. Reddit and PriceCharting direct reads returned 403; thread titles/snippets only. No private Discord, backlink dataset, keyword volumes or Search Console data. “Why” below means plausible intent/format advantages, not proven ranking causation. No inference from result counts.

## What currently surfaces, and the opening

| Cluster / observed evidence | Why it serves the search; gap to test |
|---|---|
| [“Kleinanzeigen Suchagent”](https://www.bing.com/search?q=%22Kleinanzeigen%22+%22Suchagent%22): Kleinanzeigen Agent, DealRadar, Apify and official help appeared. [Agent](https://kleinanzeigen-agent.de/suchagenten) explains a two-minute polling claim, three setup steps, preview, deduplication and channel choice. [DealRadar](https://meindealradar.de/kleinanzeigen-suchagent) dates its guide September 2026 and advertises price scoring. | Strong exact-intent, concrete setup and freshness signals. Generic “faster alerts” is crowded; offer reproducible exclusion recipes and an honestly measured comparison. Cross-marketplace/AI alone is not unique. |
| [“gebrauchte videospiele wert ermitteln”](https://www.bing.com/search?q=gebrauchte+videospiele+wert+ermitteln): PriceCharting, RetroWorth, rebuy and verkaufen.de appeared; Bing's visible AI summary recommended an Ankauf comparison. [RetroWorth](https://retroworth.app/de) demonstrates camera identification, condition/region selection and estimate ranges. [Reddit thread](https://www.reddit.com/r/gamecollecting/comments/sad6kq/how_accurate_is_pricechartingcom/) title asks about accuracy. | Tools and immediate valuations satisfy intent better than generic prose. Opening: distinguish German asking prices, dealer buyback and completed sales, with dates, sample sizes and uncertainty; attach an alert to the reader's target price. No claim that competitor estimates are wrong. |
| [“kleinanzeigen reselling pokemon preisvergleich youtube”](https://www.bing.com/search?q=kleinanzeigen+reselling+pokemon+preisvergleich+youtube): Reselling Freddy beginner video, “UNGLAUBLICHE Pokémon-Deals auf Kleinanzeigen,” and TikTok @z.errin selling/trading video surfaced. [reselling.de](https://reselling.de/preise) sells Discord access and a five-search Kleinanzeigen monitor. | Demonstrated purchases, price comparisons and recurring community utility match the task. Opening: transparent purchase-to-resale case study including unsold inventory and costs; avoid another unsupported profit claim. |
| [“Zahnrad Ersatzteil finden Foto”](https://www.bing.com/search?q=Zahnrad+Ersatzteil+finden+Foto) surfaces catalogs; [FixPart](https://www.fixpart.de/ersatzteile/zahnrad) starts with device/type-number selection. [“Zahnrad Zähne Modul bestimmen”](https://www.bing.com/search?q=Zahnrad+Z%C3%A4hne+Modul+bestimmen) surfaces calculators and Z24 Industrietechnik videos; [machdeinteil](https://www.machdeinteil.de/tools/zahnrad-modul-rechner) provides a dedicated calculator. | Catalog depth and practical calculation serve separate steps. Opportunity: guide someone without a part number from photo and reviewed measurements to available offers. Validate any module formula's applicability; Ane's photo estimate is not a compatibility guarantee. |
| [“Kugellager 6203 2RS Maße”](https://www.bing.com/search?q=Kugellager+6203+2RS+Ma%C3%9Fe) surfaces supplier/product cards with 17×40×12 dimensions. | Exact-standard purchase intent; a rewritten dimensions paragraph adds little. Only pursue with useful current availability/comparison data. |

## Search backlog: exact briefs

Difficulty/opportunity are qualitative hypotheses from the above competition. Effort estimates include research and production, exclude API work. Prioritize activated users per person-day, not raw visits.

| Priority; keyword; intent; difficulty/opportunity | Exact title and minimum outline | Effort |
|---|---|---|
| 1; `Kleinanzeigen Suchagent`; commercial; medium/high | **Kleinanzeigen Suchagent: Filter, Push und Discord praktisch einrichten** — native saved-search checklist; Ane PS5/Hamburg/€400 walkthrough; exclude broken devices/accessories; channel setup; dated comparison; measured timing caveat. CTA: create that search. | 2–3 days |
| 2; `Kleinanzeigen Discord Benachrichtigung`; setup; medium/high | **Kleinanzeigen-Alerts in Discord: Einrichtung in 3 Schritten** — private channel/webhook; Ane configuration; test notification/troubleshooting; protect webhook URL. Pair with one screen-recorded Short. | 1–2 days |
| 3; `gebrauchte Nintendo Switch Spiele Wert`; valuation; high/medium | **Was sind gebrauchte Switch-Spiele wert? Angebotspreis, Ankauf und Verkauf unterscheiden** — same edition/condition; timestamped price table; sample count/currency; fees and uncertainty; target-price alert. Start with five titles with adequate data. | 3–4 days |
| 4; `Zahnrad Ersatzteil finden Foto`; repair/purchase; medium/high | **Zahnrad ohne Teilenummer finden: Foto, Zähne und Maße prüfen** — whole/broken gear; caliper checklist; review estimate; compare offers; fitment checks before purchase. Link the existing parts tool. | 2–3 days |
| 5; `6203 2RS Maße`; purchase; high/conditional | **6203-2RS: Maße 17×40×12 mm und verfügbare Angebote** — verify manufacturer specification; seal variants; dimensions; dated offers/counts; fitment limits. Pilot one page only if inventory supports it. | 2–4 days |

## Distribution and experiments

- **YouTube + Instagram:** approach [Reselling Freddy / @trainingsjacken_freddy](https://www.bing.com/search?q=%22Reselling+Freddy%22+Pokemon) for “€50 Flohmarkt-Fund: echter Gewinn nach allen Kosten?” Supply a reproducible Ane search and track creator-specific activation; disclose sponsorship. His surfaced purchase videos support testing this format, not a conversion forecast.
- **Shorts/TikTok:** record “PS5-Alerts ohne Controller-Spam” and “Kaputtes Zahnrad: diese drei Maße fehlen.” Reuse footage with channel-native captions and one tool CTA. Search-visible resale TikToks support the first test; repair TikTok reach remains unvalidated.
- **Reddit/Discord:** answer a current r/gamecollecting valuation question with a condition/region comparison, affiliation disclosed and moderator rules checked. Test one consenting German collector-server administrator with a private Discord alert demo. The thread title and reselling.de demonstrate the problems/formats; do not enter competitors' paid groups to advertise.
- **Partnership/widget:** pitch Z24 Industrietechnik a measurement checklist linked to `/parts`; pilot with one local Repair Café. Later test an embeddable measurement form if partners request it and integration feasibility is verified. The observed measurement videos justify creator fit; no backlink gains are established.
- **Programmatic/AI discovery:** pilot five data-rich product pages, using existing history/sample counts, dated methodology and readable tables. Index only distinct, sufficiently populated pages; consolidate variants and link from relevant guides. Bing's observed valuation summary suggests testing concise sourced answers; do not promise AI citations. Defer Product Hunt and mass directories: research supplied no matching buyer demand there.

## Top 10 actions — descending expected activated users per effort

1. Week 1: ship the Suchagent guide; measure visitor → saved search → first match.
2. Week 1: publish the Discord walkthrough and paired Short, using channel-specific links.
3. Week 1: refresh the existing retro/Pokémon articles with sourced numbers and relevant tool CTAs.
4. Week 2: run one Reselling Freddy outreach/test with a clearly attributed search recipe.
5. Week 2: publish the unknown-gear tutorial and 30-second measurement demonstration.
6. Week 2: publish the five-title Switch valuation comparison, separating price types.
7. Week 3: test one permission-based collector Discord integration and one helpful Reddit answer.
8. Week 3: pitch Z24 and one Repair Café; build no widget until interest is confirmed.
9. Weeks 3–4: pilot five populated product pages; add the bearing page only with verified coverage.
10. Day 30: compare activated users/person-day by source; for repair, track search → offer click. Check search impressions/indexing at days 30/60/90 before judging SEO. Expand winning topics, stop poorly converting distribution tests.
