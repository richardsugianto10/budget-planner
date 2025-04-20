/**
 * Format a number as a currency string
 * @param value - The number to format
 * @returns Formatted string with 2 decimal places
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Format a date string into a readable format
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "Apr 5, 2024")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
  const currencyMap: { [key: string]: string } = {
    IDR: 'id-ID',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    AUD: 'en-AU',
    SGD: 'en-SG',
  }

  return new Intl.NumberFormat(currencyMap[currency] || 'id-ID', {
    style: 'currency',
    currency: currency
  }).format(amount)
} 