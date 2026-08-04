import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    if (stored === null) return initialValue
    try {
      return JSON.parse(stored)
    } catch {
      return initialValue
    }
  })

  const update = (next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      localStorage.setItem(key, JSON.stringify(resolved))
      return resolved
    })
  }

  return [value, update]
}
