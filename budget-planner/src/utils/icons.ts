/**
 * Get the appropriate FontAwesome icon for a transaction category
 * @param category - The transaction category
 * @returns FontAwesome icon name
 */
export const getTransactionIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    'Salary': 'money-bill-wave',
    'Freelance': 'laptop',
    'Investments': 'chart-line',
    'Shopping': 'shopping-bag',
    'Food & Dining': 'utensils',
    'Transportation': 'car',
    'Entertainment': 'film',
    'Utilities': 'bolt',
    'Healthcare': 'hospital',
    'Education': 'graduation-cap'
  }

  return icons[category] || 'circle' // fallback to circle if category not found
} 