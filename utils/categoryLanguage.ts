/**
 * `lang` query value for the Categories API: English labels for the English UI,
 * German (the language of UnifiedCategories.json) for everything else.
 */
export function categoryLabelLanguage(locale: string | null | undefined): 'en' | 'de' {
  return locale?.toLowerCase().startsWith('en') ? 'en' : 'de'
}
