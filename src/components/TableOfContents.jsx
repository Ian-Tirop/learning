import { useState } from 'react'

// Collapsed by default — irrelevant on desktop, where CSS forces the list
// open regardless of this state (see the >=900px rule in BlogPost.css);
// this `open` state only ever matters on the narrow, dropdown layout.
export function TableOfContents({ headings, activeHeadingId }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className={`toc${open ? ' is-open' : ''}`} aria-label="Table of contents">
      <button
        type="button"
        className="toc-toggle"
        aria-expanded={open}
        aria-controls="toc-list"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="toc-label">In this post</span>
        <svg className="icon toc-chevron" role="presentation" aria-hidden="true">
          <use href="/icons.svg#chevron-icon"></use>
        </svg>
      </button>
      <ul className="toc-list" id="toc-list">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`} className={heading.id === activeHeadingId ? 'active' : undefined}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
