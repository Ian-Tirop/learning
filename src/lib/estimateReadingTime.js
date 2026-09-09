const WORDS_PER_MINUTE = 200

export function countWords(content) {
  return content
    .map((block) => block.text || '')
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function estimateReadingTime(content) {
  return Math.max(1, Math.round(countWords(content) / WORDS_PER_MINUTE))
}
