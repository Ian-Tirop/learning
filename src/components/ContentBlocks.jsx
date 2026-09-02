import { getHeadings } from '../lib/headings'

function ContentBlock({ block, id }) {
  switch (block.type) {
    case 'h3':
      return <h3 id={id}>{block.text}</h3>
    case 'code':
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      )
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
