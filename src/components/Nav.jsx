import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { NavSearch } from './NavSearch'
import { useAdmin } from '../context/AdminContext'
import { useAccount } from '../context/AccountContext'
import './Nav.css'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/blog', label: 'Blog' },
  { to: '/community', label: 'Community' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  const { isAdmin, effectiveIsAdmin, viewMode, setViewMode, logout } = useAdmin()
  const { account } = useAccount()

  return (
    <header className="site-nav">
      {isAdmin && viewMode === 'reader' && (
        <div className="reader-preview-banner">
          <span>👁️ Previewing the site as a reader would see it — no admin controls are showing.</span>
          <button type="button" onClick={() => setViewMode('admin')}>
            Return to admin view
          </button>
        </div>
      )}
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
          <div className="nav-main-links">
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
            {!effectiveIsAdmin && (
              <NavLink
                to="/submit"
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                Write
              </NavLink>
            )}
          </div>
          <div className="nav-icon-row">
            <NavSearch />

            {!effectiveIsAdmin && (
              <NavLink
                to={account ? '/profile' : '/account/login'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `profile-link${isActive ? ' active' : ''}${account ? ' signed-in' : ''}`
                }
                aria-label={account ? `Hi, ${account.displayName}` : 'Sign in'}
                title={account ? `Hi, ${account.displayName}` : 'Sign in'}
              >
                <svg className="icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#user-icon"></use>
                </svg>
                {account && <span className="profile-signed-in-dot" aria-hidden="true" />}
              </NavLink>
            )}

            {isAdmin && (
              <button
                type="button"
                className={`view-toggle${viewMode === 'reader' ? ' active' : ''}`}
                onClick={() => setViewMode(viewMode === 'admin' ? 'reader' : 'admin')}
                title={viewMode === 'admin' ? 'Preview the site as a reader' : 'Back to your admin view'}
              >
                {viewMode === 'admin' ? 'Preview as reader' : 'Exit preview'}
              </button>
            )}

            {effectiveIsAdmin && (
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
            )}

            {isAdmin && (
              <button
                type="button"
                className="view-toggle"
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
                title="Log out"
              >
                Log out
              </button>
            )}

            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
