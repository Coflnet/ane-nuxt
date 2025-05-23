export function useFormat() {
  const formatCurrency = (value: number, currency: string = 'USD', options?: Intl.NumberFormatOptions): string => {
    const isInteger = value % 1 === 0

    const defaultCurrencyOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }

    if (isInteger) {
      defaultCurrencyOptions.minimumFractionDigits = 0
      defaultCurrencyOptions.maximumFractionDigits = 0
    }

    const finalOptions = { ...defaultCurrencyOptions, ...options }

    return new Intl.NumberFormat('en-US', finalOptions).format(value)
  }

  return {
    formatCurrency,
  }
}
