export interface SeoArticleSection {
  heading: string
  body: string
}

export interface SeoArticle {
  slug: string
  title: string
  description: string
  category: string
  publishedAt: string
  readingMinutes: number
  heroImage: string
  /** Locale of the article body (used for hreflang and html lang attribute). */
  locale: 'de' | 'en'
  sections: SeoArticleSection[]
}

export const seoArticles: SeoArticle[] = [
  {
    slug: 'pokemon-silberne-sturmwinde-display-flippen',
    title: 'Pokémon Silberne Sturmwinde Display flippen: So erkennst du echte Schnäppchen',
    description: 'Praxisleitfaden für das Flippen von Pokémon Silberne Sturmwinde 18er- und 36er-Displays auf Kleinanzeigen, eBay und Cardmarket. Mit Preisanker, Versiegelungs-Check und typischen Fallstricken im deutschen Markt.',
    category: 'Sammelkarten',
    publishedAt: '2026-04-28T08:00:00.000Z',
    readingMinutes: 6,
    heroImage: '/DashboardPreview.webp',
    locale: 'de',
    sections: [
      {
        heading: 'Den richtigen Suchbegriff treffen',
        body: 'Verkäufer beschreiben dasselbe Produkt mal als „Silberne Sturmwinde Display", mal als „Silver Tempest Booster Box", „36er Display" oder „18 Booster". Eine gute Suche kombiniert Setname, Format und typische Synonyme – ohne sich auf einen exakten Phrasenmatch zu verlassen. In Kleinanzeigen taucht ein guter Treffer oft mit Tippfehlern wie „Silberner Sturmwind" oder „Sturmwinde Booster Box" auf, in eBay häufiger mit Großbuchstaben und Set-Code „SWSH12". Ein Alert sollte beide Schreibweisen abdecken und Sprach- bzw. Akzentvarianten ignorieren.',
      },
      {
        heading: 'Den realen Marktpreis ankern statt UVP nutzen',
        body: 'Die UVP von Pokémon-Displays ist für Flips irrelevant – entscheidend sind verkaufte Auktionen der letzten 30 Tage. Auf eBay liefert die Filterkombination „Verkauft", „Versiegelt" und „aus Deutschland" die belastbarste Datenbasis. Cardmarket zeigt den niedrigsten verfügbaren EU-Preis, was bei Versand aus Polen oder Tschechien gerne den deutschen Schnitt unterbietet. Wer beide Quellen kombiniert und den Median statt des Mittelwerts nimmt, fängt seltener einen Ausreißer ein.',
      },
      {
        heading: 'Versiegelung und Karton-Zustand prüfen',
        body: 'Ein winziges Loch in der Folie, eine angedrückte Ecke oder ein abgerissenes Siegel kosten beim Wiederverkauf schnell 15 bis 25 Prozent. Frag vor dem Kauf nach Detailfotos der Folie, der Eckkanten und der Unterseite – seriöse Verkäufer schicken die ohne Diskussion. „Verschweißt", „eingeschweißt" und „werksversiegelt" bedeuten bei Pokémon faktisch dasselbe; „neu" allein ohne Foto ist kein Versiegelungsbeweis.',
      },
      {
        heading: 'Versandrisiko realistisch einpreisen',
        body: 'Ein 36er Display ist ab 36 Euro Versandwert nur noch mit DHL-Paket inkl. Transportversicherung sinnvoll – Hermes verliert in dieser Wertklasse zu oft. Plane bei einem Display rund 6,99 € für DHL Paket + Höherversicherung ein und rechne 11,5 % eBay-Gebühren plus PayPal-Käuferschutz, wenn du anschließend dort verkaufst. Bleibt nach all dem ein zweistelliger Gewinn, ist es einer.',
      },
      {
        heading: 'Bot-resistente Alerts statt Live-Refresh',
        body: 'Sobald ein Kleinanzeigen-Inserat unter Median erscheint, sind Sniper-Tools innerhalb von Sekunden draußen. Statt manuell zu refreshen, lohnt sich ein Alert mit Push-Benachrichtigung pro Plattform und harter Preisobergrenze (z.B. „36er Display unter 130 €"). Eine zweite, weichere Alert-Stufe („zwischen 130 € und 160 €") fängt Verhandlungs-Kandidaten ab. So bleibt die Liste handhabbar, ohne den Tag mit Push-Lärm zu fluten.',
      },
    ],
  },
  {
    slug: 'kleinanzeigen-verhandeln-vb-sofortkauf',
    title: 'Kleinanzeigen verhandeln: VB, Sofort-Kauf und der Umgang mit Lowballern',
    description: 'Welche Preisangabe lockt Käufer, ohne Geld liegen zu lassen? Konkrete Verhandlungstaktiken für Kleinanzeigen, basierend auf gängigen Mustern aus r/Kleinanzeigen und deutschen Reseller-Communities.',
    category: 'Verhandlung',
    publishedAt: '2026-05-05T08:00:00.000Z',
    readingMinutes: 5,
    heroImage: '/DashboardPreview.webp',
    locale: 'de',
    sections: [
      {
        heading: 'VB ist nicht „kostet egal"',
        body: 'Ein „VB" hinter dem Preis signalisiert Verhandlungsbereitschaft – aber kein Buffet. Verkäufer, die ihren Wunschpreis exakt kennen, schreiben oft „VB" nur, um nicht bei jeder Anfrage „Festpreis" rechtfertigen zu müssen. Als Käufer rechnest du am besten mit 5 bis 10 Prozent Verhandlungsspielraum bei Sammlerstücken und 10 bis 20 Prozent bei Möbeln, Werkzeug und Großteilen. Wer mit -50 % einsteigt, wird auf Kleinanzeigen statistisch öfter ignoriert als kontaktiert.',
      },
      {
        heading: 'Sofort-Kauf-Preise ehrlich kalkulieren',
        body: 'Der Festpreis bringt schnellere Verkäufe und reduziert Anfragen, kostet aber typischerweise 5–15 % gegenüber einer guten Verhandlungs-Endposition. Wenn du 200 € realistisch erzielen willst, ist „220 € VB" auf Kleinanzeigen meist ehrlicher als „180 € Festpreis" – Lowballer drücken sonst sofort auf 130 €. Bei eBay Kleinanzeigen ist der „Festpreis"-Button vor allem für Versandartikel sinnvoll, bei denen Abholer ohnehin selten sind.',
      },
      {
        heading: 'Lowballer-Anfragen filtern statt diskutieren',
        body: '„Letztes Angebot 50?" auf einen 200-€-Artikel ist kein Verhandlungsstart, sondern ein Funnel-Test. Antworte einmal kurz mit deinem Mindestpreis und einer Begründung (Marktpreis, Originalverpackung, Vergleichslinks) – wenn nichts kommt, blocken oder ignorieren. Drei oder mehr „Letztes Angebot"-Nachrichten in einer Woche pro Inserat sind ein Zeichen, dass das Foto, der Titel oder der Preisanker missverständlich sind, nicht dass die Käufer schlecht verhandeln.',
      },
      {
        heading: 'Versand-Tricks gegen No-Shows',
        body: 'Versand vorab statt Abholung schreckt zwar manche Schnäppchenjäger ab, eliminiert aber die typischen No-Show-Termine an Bahnhöfen. DHL-Paket mit Sendungsverfolgung kostet bei normalen Artikeln 4,99–6,99 € und schützt dich beim Käuferschutz besser als „PayPal Freunde". Bei Artikeln unter 30 € lohnt sich oft Hermes XS für 4,50 €; alles darüber sollte versichert versendet werden, sonst fressen Verlustfälle den Gewinn von zehn anderen Verkäufen.',
      },
    ],
  },
  {
    slug: 'retro-gaming-flohmarkt-schaetze',
    title: 'Retro-Gaming auf dem Flohmarkt: Welche Konsolen und Spiele sich heute noch lohnen',
    description: 'Welche Retro-Gaming-Funde auf deutschen Flohmärkten und in Haushaltsauflösungen tatsächlich Gewinn bringen. Mit konkreten Preisankern für N64, GameCube, GameBoy und Nintendo DS Limited Editions.',
    category: 'Retro-Gaming',
    publishedAt: '2026-05-12T08:00:00.000Z',
    readingMinutes: 7,
    heroImage: '/DashboardPreview.webp',
    locale: 'de',
    sections: [
      {
        heading: 'OVP schlägt Lose-Modul, fast immer',
        body: 'Ein loses N64-Modul „Ocarina of Time" liegt 2026 bei rund 25 €, mit OVP und Anleitung in PAL-Version aber bei 90–140 € – je nach Karton-Zustand. Diese Spreizung gilt für fast jedes Nintendo-Spiel der 90er und frühen 2000er. Auf dem Flohmarkt lohnt es sich, gezielt nach „mit Karton", „mit Anleitung" und „komplett" zu fragen – auch wenn die Verkäufer den Karton im Keller suchen müssen, kommt in 30–40 % der Fälle wirklich noch einer.',
      },
      {
        heading: 'GameCube-Sammlerstücke erkennen',
        body: 'Die GameCube-Konsole selbst ist eher uninteressant, aber Spiele wie „Fire Emblem: Path of Radiance", „Skies of Arcadia Legends" und „Tales of Symphonia" PAL gehen einzeln für 80–250 € weg. „Metroid Prime" und „Mario Sunshine" sind dagegen Standardware – die siehst du auf jedem zweiten Stand. Faustregel: Spiele, die nie eine Wii- oder Switch-Neuauflage bekommen haben, halten ihren Wert deutlich besser.',
      },
      {
        heading: 'GameBoy-Module: nicht alles graue ist Gold',
        body: 'Pokémon Rot/Blau/Gelb in DE-Version laufen bei 30–60 € lose, mit Karton bei 200–500 €. Aber Vorsicht: gefälschte Module sind auf Flohmärkten extrem häufig. Echte Module haben einen mattgrauen Plastikrücken mit Nintendo-Wölbung, das Etikett ist gestanzt (nicht laminiert) und die kleine Schraube ist eine Nintendo-spezifische Drei-Punkt-Schraube (Y-Form). Wer das nicht prüfen kann, lässt Pokémon-Module ohne ausführliche Fotos lieber liegen.',
      },
      {
        heading: 'Nintendo DS und Limited Editions',
        body: 'Limited-Edition-Konsolen wie der „Pokémon Black Nintendo DSi XL" oder die „Zelda 25th Anniversary 3DS" werden in OVP gehandelt für 250–600 €, ohne OVP fallen sie auf 80–150 €. Auf Kleinanzeigen findet man sie regelmäßig bei Haushaltsauflösungen unter 50 € – wenn das Foto gut ist, sofort schreiben statt verhandeln. Die Konsole ohne Stift, ohne Ladegerät und mit vergilbten Tasten halbiert den Preis nahezu, also vor dem Kauf nach Komplettheit fragen.',
      },
      {
        heading: 'Realistische Margen und typische Stolperfallen',
        body: 'Nach eBay-Verkaufsgebühren (11 % bei Privatverkäufen mittlerweile inklusive Bezahlsystem), Versand und Verpackung bleiben bei Retro-Games typisch 40–60 % vom Verkaufspreis. Heißt: ein 100-€-Spiel muss unter 50 € eingekauft werden, damit es sich lohnt. Defekte Module (Speicherbatterie tot bei Pokémon) und nachgedruckte Anleitungen drücken den Wert deutlich – und sind ohne Sichtprüfung nicht erkennbar. Lieber ein „komplett, aber nicht getestet" mit Bild ablehnen als blind zuschlagen.',
      },
    ],
  },
  {
    slug: 'lego-wertanlage-eol-sets',
    title: 'LEGO als Wertanlage: Welche EOL-Sets 2026 wirklich Rendite bringen',
    description: 'Welche LEGO-Sets nach dem End-of-Life zuverlässig im Wert steigen, welche Themes (Modular, UCS, Ideas) am stabilsten laufen und wie du Fakes und nachgedruckte Boxen erkennst.',
    category: 'LEGO-Investment',
    publishedAt: '2026-05-19T08:00:00.000Z',
    readingMinutes: 6,
    heroImage: '/DashboardPreview.webp',
    locale: 'de',
    sections: [
      {
        heading: 'Modular Buildings sind die Blue-Chip-Klasse',
        body: 'Die Modular-Buildings-Reihe (z.B. 10182 „Café Corner", 10185 „Green Grocer") legt seit Jahren zwischen 8 und 14 % pro Jahr zu, wenn sie versiegelt bleibt. Das Café Corner ist mittlerweile bei 3.500–4.500 € MISB angekommen, vom UVP von 139,99 € im Jahr 2007. Wichtig: Die Modular-Reihe ist die einzige, bei der quasi jedes ältere EOL-Set langfristig gewinnt – bei anderen Themes ist die Trefferquote deutlich niedriger.',
      },
      {
        heading: 'UCS Star Wars: Hit oder Miss',
        body: 'Ultimate Collector Series schwankt stark. 10179 „Millennium Falcon" (UCS Original 2007) liegt MISB bei 6.000–9.000 €, der Nachfolger 75192 (2017) immer noch knapp unter UVP. 10221 „Super Star Destroyer" hat sich verdoppelt, 10240 „Red Five X-wing" stagniert. Faustregel: Je ikonischer das Schiff (Falcon, AT-AT, Death Star) und je geringer die Nachfolge-Wahrscheinlichkeit, desto stabiler die Rendite. Ein zweiter Falcon-Nachdruck würde den 75192-Preis sofort drücken.',
      },
      {
        heading: 'LEGO Ideas und Lizenz-Themes mit Ablaufdatum',
        body: 'Lizenz-Sets (Disney, Marvel, Friends-Sitcom 21319, Seinfeld 21328) verschwinden oft schon zwei bis drei Jahre nach Release – die Lizenz wird nicht verlängert. Wer dort EOL-Termine im Auge behält und kurz vor Auslauf einkauft, hat oft +30–50 % innerhalb von 24 Monaten. Sets, die parallel auch als POP! oder Funko existieren, performen aber schlechter, weil die Sammler-Zielgruppe sich aufteilt.',
      },
      {
        heading: 'Boxen-Zustand entscheidet 30 % des Preises',
        body: 'Ein MISB-Set mit Knicken im Karton verliert gegenüber „mint" rund ein Drittel des erzielbaren Preises. Auf Kleinanzeigen lohnt es sich, gezielt nach „kartonbruchfrei", „lagerfrisch" oder „direkt aus dem LEGO Store" zu filtern. Außenboxen aus Versand-LEGOs (LEGO.com mit doppelter Kartonage) sind in der Regel besser erhalten als Saturn-/Müller-Ware. Ungeöffnete Sets aus Raucherhaushalt wirken zwar unbeschädigt, riechen aber nach dem Öffnen massiv – einige Sammler zahlen dafür gar nichts mehr.',
      },
      {
        heading: 'Renditen ehrlich rechnen',
        body: 'Nach 11 % eBay-Gebühren, Versand (DHL Paket bis 31,5 kg ca. 16,99 €) und ggf. Steuern (Privatverkäufe ab 730 € Gewinn pro Jahr ggf. einkommensteuerpflichtig nach §23 EStG, sobald ein Jahr Haltefrist unterschritten wird) bleiben aus 100 € Verkauf netto eher 75–80 €. Eine angenommene Rendite von 10 % p.a. brutto landet damit netto eher bei 6–7 %. LEGO ist solide, aber nicht der Geheimtipp, als der er gerne verkauft wird – ETFs liegen in vielen Fünfjahres-Fenstern höher.',
      },
    ],
  },
]

export const getPublishedArticles = (now = new Date()) => {
  return seoArticles
    .filter(article => new Date(article.publishedAt).getTime() <= now.getTime())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export const getArticleBySlug = (slug: string, now = new Date()) => {
  return getPublishedArticles(now).find(article => article.slug === slug)
}
