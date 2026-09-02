import { useLocalStorage } from '../hooks/useLocalStorage'
import './Poll.css'

function seededCount(seedKey, base) {
  let hash = 0
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) >>> 0
  }
  return base + (hash % 37)
}

export function Poll({ slug, poll }) {
  const [voted, setVoted] = useLocalStorage(`blog:poll:${slug}`, null)

  if (!poll) return null

  const counts = poll.options.map(
    (option, index) => seededCount(`${slug}-${index}-${option}`, 6) + (voted === index ? 1 : 0),
  )
  const total = counts.reduce((sum, n) => sum + n, 0)
  const answered = voted !== null

  return (
    <div className="poll">
      <p className="poll-kicker">Poll</p>
      <p className="poll-question">{poll.question}</p>
      <div
        className="poll-options"
        role={answered ? undefined : 'radiogroup'}
        aria-label={answered ? undefined : poll.question}
      >
        {poll.options.map((option, index) => {
          const percent = total > 0 ? Math.round((counts[index] / total) * 100) : 0
          const isChosen = voted === index
          return (
            <button
              key={option}
              type="button"
              role={answered ? undefined : 'radio'}
              aria-checked={answered ? undefined : isChosen}
              className={`poll-option${isChosen ? ' chosen' : ''}${answered ? ' answered' : ''}`}
              onClick={() => setVoted((prev) => (prev === index ? null : index))}
            >
              <span
                className="poll-option-fill"
                style={{ width: answered ? `${percent}%` : '0%' }}
                aria-hidden="true"
              />
              <span className="poll-option-label">{option}</span>
              {answered && <span className="poll-option-percent">{percent}%</span>}
            </button>
          )
        })}
      </div>
      <p className="poll-meta">
        {answered ? `${total} vote${total === 1 ? '' : 's'} · tap your choice again to undo` : 'Pick one to see results'}
      </p>
    </div>
  )
}
