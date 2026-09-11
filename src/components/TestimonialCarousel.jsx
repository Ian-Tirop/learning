import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { initials } from '../lib/initials'
import './TestimonialCarousel.css'

const AUTOPLAY_MS = 4000
// A little slack so "did we reach the end" doesn't miss by a sub-pixel.
const END_EPSILON_PX = 4

export function TestimonialCarousel({ testimonials }) {
  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = testimonials.length

  // One card's width-plus-gap, measured live rather than assumed, since
  // how many cards fit per view changes with the responsive breakpoints
  // in TestimonialCarousel.css.
  const getStep = useCallback(() => {
    const track = trackRef.current
    const card = track?.children[0]
    if (!track || !card) return 0
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0)
  }, [])

  const scrollToIndex = useCallback(
    (i) => {
      const track = trackRef.current
      if (!track) return
      const clamped = ((i % count) + count) % count
      track.scrollTo({ left: clamped * getStep(), behavior: 'smooth' })
    },
    [count, getStep],
  )

  const next = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - END_EPSILON_PX
    if (atEnd) track.scrollTo({ left: 0, behavior: 'smooth' })
    else track.scrollBy({ left: getStep(), behavior: 'smooth' })
  }, [getStep])

  const prev = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    if (track.scrollLeft <= END_EPSILON_PX) {
      track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: -getStep(), behavior: 'smooth' })
    }
  }, [getStep])

  // Auto-advances unless the visitor is actively engaging with the
  // carousel (hover/focus/mid-swipe) or asked the OS for reduced motion.
  useEffect(() => {
    if (paused || count <= 1) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused, count, next])

  // Keeps the active dot in sync with wherever the track actually is —
  // including a manual drag/swipe, not just button clicks.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    let frame = null
    const handleScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        const step = getStep()
        if (step > 0) setActiveIndex(Math.round(track.scrollLeft / step) % count)
      })
    }
    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', handleScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [count, getStep])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') prev()
    else if (event.key === 'ArrowRight') next()
  }

  if (count === 0) return null

  return (
    <div
      className="testimonial-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="testimonial-carousel-track" ref={trackRef}>
        {testimonials.map((comment) => (
          <Link
            to={`/blog/${comment.postSlug}`}
            key={comment.id}
            className="card testimonial-card"
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
        ))}
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
                className={`testimonial-carousel-dot${i === activeIndex ? ' active' : ''}`}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === activeIndex}
                onClick={() => scrollToIndex(i)}
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
