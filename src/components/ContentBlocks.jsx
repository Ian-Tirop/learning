function ContentBlock({ block }) {
  switch (block.type) {
    case 'h3':
      return <h3>{block.text}</h3>
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
  return (
    <>
      {content.map((block, index) => (
        <ContentBlock key={index} block={block} />
      ))}
    </>
  )
}
