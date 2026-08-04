const WORDS_PER_MINUTE = 200

export function estimateReadingTime(content) {
  const wordCount = content
    .map((block) => block.text || '')
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}
