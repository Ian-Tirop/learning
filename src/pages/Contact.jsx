import { useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './Contact.css'

const email = 'iantirop33@gmail.com'

const social = [
  { href: 'https://github.com/', icon: 'github-icon', label: 'GitHub' },
  { href: 'https://x.com/', icon: 'x-icon', label: 'X.com' },
  { href: 'https://bsky.app/', icon: 'bluesky-icon', label: 'Bluesky' },
]

export function Contact() {
  useDocumentTitle('Contact — Ian Tirop')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied or unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <section className="container contact-page">
      <div className="section-heading">
        <p className="eyebrow">Contact</p>
        <h1>Let&apos;s talk</h1>
        <p className="contact-intro">
          Questions, corrections on a post, or just want to say hi about
          something I wrote — my inbox is open.
        </p>
      </div>

      <div className="contact-card">
        <svg className="icon mail" role="presentation" aria-hidden="true">
          <use href="/icons.svg#mail-icon"></use>
        </svg>
        <p className="contact-email">{email}</p>
        <div className="contact-actions">
          <a className="btn btn-primary" href={`mailto:${email}`}>
            Send an email
          </a>
          <button type="button" className="btn btn-ghost" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy address'}
          </button>
        </div>
      </div>

      <div className="contact-social">
        <p>Or find me elsewhere</p>
        <ul>
          {social.map((item) => (
            <li key={item.label}>
              <a href={item.href} target="_blank" rel="noreferrer">
                <svg className="icon invertable" role="presentation" aria-hidden="true">
                  <use href={`/icons.svg#${item.icon}`}></use>
                </svg>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
