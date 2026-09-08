import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaRobots } from '../hooks/useMetaRobots'
import './NotFound.css'

function LostIllustration() {
  return (
    <svg className="not-found-illustration" viewBox="0 0 160 120" aria-hidden="true">
      <defs>
        <linearGradient id="notfound-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <circle className="not-found-dot dot-1" cx="24" cy="30" r="4" fill="url(#notfound-gradient)" />
      <circle className="not-found-dot dot-2" cx="140" cy="24" r="3" fill="var(--accent-3)" />
      <circle className="not-found-dot dot-3" cx="132" cy="90" r="5" fill="url(#notfound-gradient)" />
      <g className="not-found-page">
        <rect x="45" y="20" width="70" height="88" rx="10" fill="var(--code-bg)" stroke="var(--border)" strokeWidth="2" />
        <path d="M45 30a10 10 0 0 1 10-10h50a10 10 0 0 1 10 10v6H45z" fill="var(--border)" opacity="0.4" />
        <text x="80" y="72" textAnchor="middle" fontSize="40" fontWeight="700" fill="url(#notfound-gradient)">
          ?
        </text>
      </g>
    </svg>
  )
}

export function NotFound() {
  useDocumentTitle('Page not found — Ian Tirop')
  useMetaRobots()
  return (
    <section className="container not-found">
      <LostIllustration />
      <p className="not-found-code gradient-text">404</p>
      <h1>This page wandered off.</h1>
      <p className="not-found-text">
        Whatever you were looking for isn&apos;t at this address anymore.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </section>
  )
}
