import { useState } from 'react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import { getHeadings } from '../lib/headings'

// A curated set rather than highlight.js's full "common" bundle (~35
// languages) — this is a web-dev blog, so this set covers what's actually
// likely to show up, at a fraction of the bundle size.
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('markdown', markdown)

// Posts don't tag code blocks with a language (the ```fence``` syntax never
// captured one, and changing that would mean touching every existing post's
// stored content) — so this auto-detects instead of trusting an annotation.
function CodeBlock({ text }) {
  const [copied, setCopied] = useState(false)
  const highlighted = hljs.highlightAuto(text).value

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied or unavailable — fail silently.
    }
  }

  return (
    <div className="code-block">
      <button type="button" className="code-copy-btn" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  )
}

function ContentBlock({ block, id }) {
  switch (block.type) {
    case 'h3':
      return <h3 id={id}>{block.text}</h3>
    case 'code':
      return <CodeBlock text={block.text} />
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    default:
      return <p>{block.text}</p>
  }
}

export function ContentBlocks({ content }) {
  const headings = getHeadings(content)
  let headingIndex = 0

  return (
    <>
      {content.map((block, index) => {
        const id = block.type === 'h3' ? headings[headingIndex++].id : undefined
        return <ContentBlock key={index} block={block} id={id} />
      })}
    </>
  )
}
