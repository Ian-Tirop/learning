import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { initials } from '../lib/initials'
import './TestimonialCarousel.css'

const AUTOPLAY_MS = 6000
// A swipe shorter than this reads as a tap/scroll, not an intentional slide change.
const SWIPE_THRESHOLD_PX = 40

export function TestimonialCarousel({ testimonials }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)
  const count = testimonials.length

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // Auto-advances unless the visitor is actively engaging with the
  // carousel (hover/focus/mid-swipe) or asked the OS for reduced motion.
  useEffect(() => {
    if (paused || count <= 1) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused, count])

  if (count === 0) return null

  const comment = testimonials[index]

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
  }
  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (delta > SWIPE_THRESHOLD_PX) prev()
    else if (delta < -SWIPE_THRESHOLD_PX) next()
    touchStartX.current = null
  }
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') prev()
    else if (event.key === 'ArrowRight') next()
  }

  return (
    <div
      className="testimonial-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
    >
      <div className="testimonial-carousel-viewport" aria-live="polite">
        <Link
          to={`/blog/${comment.postSlug}`}
          key={comment.id}
          className="card testimonial-card fade-in-up"
        >
          <p className="testimonial-text">&ldquo;{comment.text}&rdquo;</p>
          <div className="testimonial-attribution">
            {comment.avatarUrl ? (
              <img src={comment.avatarUrl} alt="" className="testimonial-avatar testimonial-avatar-photo" />
            ) : (
              <div className="testimonial-avatar" aria-hidden="true">
                {initials(comment.name)}
              </div>
            )}
            <div>
              <span className="testimonial-name">{comment.name}</span>
              <span className="testimonial-source">on {comment.postTitle}</span>
            </div>
          </div>
        </Link>
      </div>

      {count > 1 && (
        <div className="testimonial-carousel-controls">
          <button
            type="button"
            className="testimonial-carousel-arrow"
            onClick={prev}
            aria-label="Previous testimonial"
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#chevron-icon"></use>
            </svg>
          </button>

          <div className="testimonial-carousel-dots">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`testimonial-carousel-dot${i === index ? ' active' : ''}`}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <button
            type="button"
            className="testimonial-carousel-arrow next"
            onClick={next}
            aria-label="Next testimonial"
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#chevron-icon"></use>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
