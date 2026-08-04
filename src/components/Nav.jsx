import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import './Nav.css'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">IT</span>
          Ian Tirop
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links${open ? ' open' : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="nav-icon-row">
            <NavLink
              to="/write"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `write-link${isActive ? ' active' : ''}`}
              aria-label="Write and manage posts"
              title="Write"
            >
              <svg className="icon" role="presentation" aria-hidden="true">
                <use href="/icons.svg#pencil-icon"></use>
              </svg>
            </NavLink>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
