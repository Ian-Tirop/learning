import { useLocalStorage } from '../hooks/useLocalStorage'
import './Quiz.css'

export function Quiz({ slug, quiz }) {
  const [answer, setAnswer] = useLocalStorage(`blog:quiz:${slug}`, null)

  if (!quiz) return null

  const answered = answer !== null
  const isCorrect = answer === quiz.correctIndex

  return (
    <div className="quiz">
      <p className="quiz-kicker">Quick check</p>
      <p className="quiz-question">{quiz.question}</p>
      <div className="quiz-options">
        {quiz.options.map((option, index) => {
          const isChosen = answer === index
          const isRight = index === quiz.correctIndex
          const state = answered ? (isRight ? 'correct' : isChosen ? 'incorrect' : '') : ''
          return (
            <button
              key={option}
              type="button"
              className={`quiz-option${state ? ` ${state}` : ''}`}
              disabled={answered}
              onClick={() => setAnswer(index)}
            >
              <span className="quiz-option-marker" aria-hidden="true">
                {answered && isRight ? '✓' : answered && isChosen ? '✕' : ''}
              </span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`quiz-feedback${isCorrect ? ' correct' : ''}`} role="status">
          <p className="quiz-feedback-headline">{isCorrect ? 'Correct.' : 'Not quite.'}</p>
          <p className="quiz-feedback-explanation">{quiz.explanation}</p>
          <button type="button" className="btn btn-ghost quiz-retry" onClick={() => setAnswer(null)}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
