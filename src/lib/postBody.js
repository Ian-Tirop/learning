// A tiny markdown-ish format that maps directly onto the post content-block
// schema ({ type: 'p' | 'h3' | 'code' | 'quote' | 'image', text }) used by
// BlogPost.
//
//   ### A heading           -> { type: 'h3' }
//   > A pulled quote        -> { type: 'quote' }
//   ```                     -> { type: 'code' } (fenced, can span lines)
//   code
//   ```
//   ![alt](url)             -> { type: 'image', src, text: alt } — standard
//                              markdown image syntax, its own line
//   Anything else           -> { type: 'p' } (blank-line separated)

const IMAGE_LINE = /^!\[([^\]]*)\]\((\S+)\)$/

export function parsePostBody(markdown) {
  const blocks = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paragraphBuffer = []
  let i = 0

  const flushParagraph = () => {
    const text = paragraphBuffer.join(' ').trim()
    if (text) blocks.push({ type: 'p', text })
    paragraphBuffer = []
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      i++
      continue
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph()
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() })
      i++
      continue
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph()
      blocks.push({ type: 'quote', text: trimmed.slice(2).trim() })
      i++
      continue
    }

    const imageMatch = trimmed.match(IMAGE_LINE)
    if (imageMatch) {
      flushParagraph()
      blocks.push({ type: 'image', src: imageMatch[2], text: imageMatch[1] })
      i++
      continue
    }

    if (trimmed === '') {
      flushParagraph()
      i++
      continue
    }

    paragraphBuffer.push(trimmed)
    i++
  }

  flushParagraph()
  return blocks
}

export function serializePostBody(content) {
  return content
    .map((block) => {
      if (block.type === 'h3') return `### ${block.text}`
      if (block.type === 'quote') return `> ${block.text}`
      if (block.type === 'code') return `\`\`\`\n${block.text}\n\`\`\``
      if (block.type === 'image') return `![${block.text || ''}](${block.src})`
      return block.text
    })
    .join('\n\n')
}
