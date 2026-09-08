import { useEffect, useState } from 'react'
import './ReadingProgress.css'

const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress / 100)

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        className={`reading-progress-ring${progress > 3 && progress < 99 ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={`${Math.round(progress)}% through this post — back to top`}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle className="ring-track" cx="20" cy="20" r={RING_RADIUS} />
          <circle
            className="ring-fill"
            cx="20"
            cy="20"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className="reading-progress-percent">{Math.round(progress)}</span>
      </button>
    </>
  )
}
