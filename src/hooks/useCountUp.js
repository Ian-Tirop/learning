import { useEffect, useRef, useState } from 'react'

// Animates from 0 to `target` over `duration` ms. Only animates numbers —
// non-numeric values (e.g. "4.6" is fine, "—" is not) pass through as-is.
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    const numericTarget = Number(target)
    if (!Number.isFinite(numericTarget)) {
      setValue(target)
      return
    }

    const start = performance.now()
    const from = 0

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3 // ease-out cubic
      const current = from + (numericTarget - from) * eased
      setValue(numericTarget < 10 && numericTarget % 1 !== 0 ? current : Math.round(current))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
