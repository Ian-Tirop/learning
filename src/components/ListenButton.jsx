import { useEffect, useRef, useState } from 'react'
import './ListenButton.css'

function extractSpeakableText(post) {
  return [
    post.title,
    ...post.content.filter((block) => block.type !== 'code').map((block) => block.text),
  ].join('. ')
}

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function ListenButton({ post }) {
  const [state, setState] = useState('idle') // idle | playing | paused
  const utteranceRef = useRef(null)

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  if (!isSupported) return null

  const handlePlay = () => {
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(extractSpeakableText(post))
    utterance.onend = () => setState('idle')
    utterance.onerror = () => setState('idle')
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setState('playing')
  }

  const handlePause = () => {
    window.speechSynthesis.pause()
    setState('paused')
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setState('idle')
  }

  return (
    <div className="listen-button-wrap">
      {state === 'playing' ? (
        <button type="button" className="listen-btn" onClick={handlePause}>
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#pause-icon"></use>
          </svg>
          Pause
        </button>
      ) : (
        <button type="button" className="listen-btn" onClick={handlePlay}>
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#speaker-icon"></use>
          </svg>
          {state === 'paused' ? 'Resume' : 'Listen to this post'}
        </button>
      )}
      {state !== 'idle' && (
        <button type="button" className="listen-stop-btn" onClick={handleStop} aria-label="Stop listening">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#close-icon"></use>
          </svg>
        </button>
      )}
    </div>
  )
}
