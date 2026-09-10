import './PostCover.css'

export function PostCover({ cover, size = 'banner' }) {
  if (!cover) return null

  if (cover.type === 'image') {
    return (
      <div className={`post-cover post-cover-${size} post-cover-photo`}>
        <img src={cover.url} alt="" />
      </div>
    )
  }

  const { icon, from, to, angle = 135, pattern = 'dots' } = cover

  return (
    <div
      className={`post-cover post-cover-${size} post-cover-pattern-${pattern}`}
      style={{
        background: `linear-gradient(${angle}deg, var(${from}), var(${to}))`,
      }}
      aria-hidden="true"
    >
      <svg className="post-cover-icon" role="presentation" aria-hidden="true">
        <use href={`/icons.svg#${icon}`}></use>
      </svg>
    </div>
  )
}
