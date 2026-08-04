import { useState } from 'react'
import './PostEngagement.css'

export function PostEngagement({
  post,
  reaction,
  likes,
  dislikes,
  toggleLike,
  toggleDislike,
  average,
  ratingCount,
  userRating,
  rate,
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const [copied, setCopied] = useState(false)

  const displayedStars = hoverRating || userRating || Math.round(average)
  const shareUrl = `${window.location.origin}/blog/${post.slug}`
  const shareText = encodeURIComponent(`"${post.title}" — worth a read.`)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied or unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <div className="engagement">
      <div className="engagement-row">
        <div className="reactions">
          <button
            type="button"
            className={`reaction-btn${reaction === 'like' ? ' active' : ''}`}
            onClick={toggleLike}
            aria-pressed={reaction === 'like'}
            aria-label="Like this post"
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#thumb-up-icon"></use>
            </svg>
            {likes}
          </button>
          <button
            type="button"
            className={`reaction-btn dislike${reaction === 'dislike' ? ' active' : ''}`}
            onClick={toggleDislike}
            aria-pressed={reaction === 'dislike'}
            aria-label="Dislike this post"
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#thumb-down-icon"></use>
            </svg>
            {dislikes}
          </button>
        </div>

        <div className="share-actions">
          <button type="button" className="btn btn-ghost" onClick={handleCopyLink}>
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#link-icon"></use>
            </svg>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a
            className="btn btn-ghost"
            target="_blank"
            rel="noreferrer"
            href={`https://x.com/intent/post?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#x-icon"></use>
            </svg>
            Share
          </a>
        </div>
      </div>

      <div className="rating-block">
        <div
          className="stars"
          role="radiogroup"
          aria-label="Rate this post"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={userRating === n}
              aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              className={`star${n <= displayedStars ? ' filled' : ''}`}
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => rate(n)}
            >
              <svg className="icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#star-icon"></use>
              </svg>
            </button>
          ))}
        </div>
        <p className="rating-summary">
          {average.toFixed(1)} average · {ratingCount} ratings
          {userRating ? ` · you rated it ${userRating}` : ''}
        </p>
      </div>
    </div>
  )
}
