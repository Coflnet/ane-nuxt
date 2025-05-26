export function useFormat() {
  const formatCurrency = (value: number, currency: string, locale: string): string => {
    const isInteger = value % 1 === 0

    const defaultCurrencyOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency || 'EUR', // Use currency directly, default to EUR if empty
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }

    if (isInteger) {
      defaultCurrencyOptions.minimumFractionDigits = 0
      defaultCurrencyOptions.maximumFractionDigits = 0
    }

    const finalOptions = { ...defaultCurrencyOptions }

    return new Intl.NumberFormat(locale == 'en' ? 'en' : 'de', finalOptions).format(value)
  }

  return {
    formatCurrency,
  }
}
