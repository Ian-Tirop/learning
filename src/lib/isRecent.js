const DAY = 1000 * 60 * 60 * 24

export function isRecent(dateStr, days = 14) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff >= 0 && diff < days * DAY
}
