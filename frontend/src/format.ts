/** Prices travel as integer cents; this turns them into "€19.99". */
export const formatPrice = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return 'Out of stock'
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}
