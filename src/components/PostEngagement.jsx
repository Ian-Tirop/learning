import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../context/AccountContext'
import { useToast } from '../context/ToastContext'
import './PostEngagement.css'

export function PostEngagement({
  post,
  reaction,
  likes,
  dislikes,
  toggleLike,
  toggleDislike,
  saved,
  toggleSave,
  average,
  ratingCount,
  userRating,
  rate,
}) {
  const { account } = useAccount()
  const showToast = useToast()
  const [hoverRating, setHoverRating] = useState(0)
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const handleToggleSave = async () => {
    try {
      setSaveError(false)
      const data = await toggleSave()
      showToast(data.saved ? 'Saved to your profile' : 'Removed from saved articles')
    } catch {
      setSaveError(true)
    }
  }

  const displayedStars = hoverRating || userRating || Math.round(average)
  const shareUrl = `${window.location.origin}/blog/${post.slug}`
  const shareTitle = `"${post.title}" — worth a read.`
  const shareText = encodeURIComponent(shareTitle)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied or unavailable (e.g. insecure context) — fail silently.
    }
  }

  const handleNativeShare = async () => {
    setShareOpen(false)
    try {
      await navigator.share({ title: post.title, text: shareTitle, url: shareUrl })
    } catch {
      // The user cancelled the native share sheet, or it's unsupported here — no-op either way.
    }
  }

  const handleShareBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setShareOpen(false)
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
          <button
            type="button"
            className={`reaction-btn save${saved ? ' active' : ''}`}
            onClick={handleToggleSave}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved articles' : 'Save this article'}
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#bookmark-icon"></use>
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {saveError && !account && (
          <p className="save-signin-hint">
            <Link to="/account/login">Sign in</Link> to save articles to your profile.
          </p>
        )}

        <div className="share-actions">
          <button type="button" className="btn btn-ghost" onClick={handleCopyLink} aria-live="polite">
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#link-icon"></use>
            </svg>
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <div className="share-menu-wrap" onBlur={handleShareBlur}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShareOpen((open) => !open)}
              aria-expanded={shareOpen}
              aria-haspopup="menu"
            >
              <svg className="icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#share-icon"></use>
              </svg>
              Share
            </button>

            {shareOpen && (
              <div className="share-menu" role="menu">
                {canNativeShare && (
                  <button type="button" role="menuitem" onClick={handleNativeShare}>
                    Share…
                  </button>
                )}
                <a
                  role="menuitem"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://x.com/intent/post?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                >
                  <svg className="icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#x-icon"></use>
                  </svg>
                  X
                </a>
                <a
                  role="menuitem"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                >
                  <svg className="icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#linkedin-icon"></use>
                  </svg>
                  LinkedIn
                </a>
                <a
                  role="menuitem"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${shareText}`}
                >
                  Reddit
                </a>
                <a
                  role="menuitem"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                >
                  WhatsApp
                </a>
                <a role="menuitem" href={`mailto:?subject=${shareText}&body=${encodeURIComponent(shareUrl)}`}>
                  <svg className="icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#mail-icon"></use>
                  </svg>
                  Email
                </a>
              </div>
            )}
          </div>
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
