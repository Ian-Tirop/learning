import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './NotFound.css'

export function NotFound() {
  useDocumentTitle('Page not found — Ian Tirop')
  return (
    <section className="container not-found">
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
