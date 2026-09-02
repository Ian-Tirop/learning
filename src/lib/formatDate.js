// `style` controls the month format: 'short' (Jan) for compact listings,
// 'long' (January) for the full post header.
export function formatDate(dateStr, style = 'short') {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: style,
    day: 'numeric',
    year: 'numeric',
  })
}
