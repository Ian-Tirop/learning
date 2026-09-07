import { useEffect, useRef, useState } from 'react'
import './ChatWidget.css'

const GREETING = "Hi! I'm a small assistant that knows Ian's blog. Ask me what he's written about, or anything else on the site."

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ChatWidget() {
  const [available, setAvailable] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ id: 'greeting', role: 'assistant', content: GREETING }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/chat-status')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setAvailable(Boolean(data.available))
      })
      .catch(() => {
        // Not deployed yet, or the endpoint itself is unreachable — stay
        // hidden rather than show a chat button that can't do anything.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, sending])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const userMessage = { id: makeId(), role: 'user', content: text }
    const history = [...messages, userMessage]
    setMessages(history)
    setInput('')
    setError('')
    setSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history
            .filter((message) => message.id !== 'greeting')
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'The assistant is unavailable right now.')
      }

      setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: data.reply }])
    } catch {
      setError("Couldn't reach the assistant — it may not be set up yet, or something went wrong. Try again in a moment.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  const handlePanelKeyDown = (event) => {
    if (event.key === 'Escape') setOpen(false)
  }

  if (!available) return null

  return (
    <div className="chat-widget">
      {open && (
        <div
          className="chat-panel"
          role="dialog"
          aria-label="Chat with the blog assistant"
          onKeyDown={handlePanelKeyDown}
        >
          <div className="chat-panel-header">
            <div>
              <p className="chat-panel-title">Ask about the blog</p>
              <p className="chat-panel-subtitle">AI-powered · grounded in Ian&apos;s posts</p>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <svg className="icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#close-icon"></use>
              </svg>
            </button>
          </div>

          <div className="chat-messages" ref={listRef} role="log" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble ${message.role}`}>
                {message.content}
              </div>
            ))}
            {sending && (
              <div className="chat-bubble assistant chat-typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              aria-label="Message"
            />
            <button type="submit" className="chat-send" disabled={sending || !input.trim()} aria-label="Send">
              <svg className="icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#arrow-icon"></use>
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : 'Chat with the blog assistant'}
      >
        <svg className="icon" role="presentation" aria-hidden="true">
          <use href={`/icons.svg#${open ? 'close-icon' : 'comment-icon'}`}></use>
        </svg>
      </button>
    </div>
  )
}
