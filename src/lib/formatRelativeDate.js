const DAY = 1000 * 60 * 60 * 24

export function formatRelativeDate(dateStr) {
  const date = new Date(dateStr)
  const diffDays = Math.round((Date.now() - date.getTime()) / DAY)

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
