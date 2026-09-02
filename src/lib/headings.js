import { slugify } from './slugify'

// Extracts h3 blocks as {text, id} for anchor links, deduping ids for
// posts that happen to repeat a heading.
export function getHeadings(content) {
  const seen = new Map()
  return content
    .filter((block) => block.type === 'h3')
    .map((block) => {
      const base = slugify(block.text)
      const count = seen.get(base) || 0
      seen.set(base, count + 1)
      return { text: block.text, id: count === 0 ? base : `${base}-${count}` }
    })
}
