import { useId, useState } from 'react'
import './PasswordField.css'

// Shared by every password input in the app (signup, login, reset, change
// password) so the show/hide toggle only has to be built once.
export function PasswordField({ label, value, onChange, placeholder, autoFocus, autoComplete, id }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)

  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <div className="password-field">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href={`/icons.svg#${visible ? 'eye-off-icon' : 'eye-icon'}`}></use>
          </svg>
        </button>
      </div>
    </label>
  )
}
