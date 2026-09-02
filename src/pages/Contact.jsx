import { useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import { ReaderFeedback } from '../components/ReaderFeedback'
import { social } from '../data/social'
import './Contact.css'

const contactMethods = [
  {
    id: 'personal-email',
    icon: 'mail-icon',
    label: 'Personal email',
    value: 'iantirop33@gmail.com',
    href: 'mailto:iantirop33@gmail.com',
    copyValue: 'iantirop33@gmail.com',
    actionLabel: 'Send an email',
  },
  {
    id: 'work-email',
    icon: 'mail-icon',
    label: 'Work email',
    value: 'ian.tirop@chainquest.co.ke',
    href: 'mailto:ian.tirop@chainquest.co.ke',
    copyValue: 'ian.tirop@chainquest.co.ke',
    actionLabel: 'Send an email',
  },
  {
    id: 'phone',
    icon: 'phone-icon',
    label: 'Phone',
    value: '+254 757 970917',
    href: 'tel:+254757970917',
    copyValue: '+254757970917',
    actionLabel: 'Call',
  },
]

export function Contact() {
  useDocumentTitle('Contact — Ian Tirop')
  useMetaDescription(
    "Get in touch with Ian Tirop — email, phone, or socials — or leave feedback on what to write about next.",
  )
  useCanonicalUrl()
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = async (method) => {
    try {
      await navigator.clipboard.writeText(method.copyValue)
      setCopiedId(method.id)
      setTimeout(() => setCopiedId((current) => (current === method.id ? null : current)), 1800)
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
          something I wrote — my inbox (or line) is open.
        </p>
      </div>

      <div className="contact-methods">
        {contactMethods.map((method) => (
          <div className="contact-card" key={method.id}>
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href={`/icons.svg#${method.icon}`}></use>
            </svg>
            <p className="contact-label">{method.label}</p>
            <p className="contact-value">{method.value}</p>
            <div className="contact-actions">
              <a className="btn btn-primary" href={method.href}>
                {method.actionLabel}
              </a>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => handleCopy(method)}
                aria-live="polite"
              >
                {copiedId === method.id ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
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

      <ReaderFeedback />
    </section>
  )
}
