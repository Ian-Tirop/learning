import { Link } from 'react-router-dom'
import { social } from '../data/social'
import { useAdmin } from '../context/AdminContext'
import './Footer.css'

// Trimmed to what's actually worth a second click from the footer — the
// main nav already covers Home/Write, so this stays a short reference
// list rather than a full sitemap, split into two even groups instead of
// one long column. Legal links live in the bottom bar instead of their
// own column; see Terms/Privacy below.
const exploreLinks = [
  { to: '/blog', label: 'Blog' },
  { to: '/community', label: 'Community' },
  { to: '/topics', label: 'Topics' },
]

const connectLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { href: '/rss.xml', label: 'RSS feed' },
]

export function Footer() {
  const { isAdmin } = useAdmin()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="footer-brand">
          <Link to="/" className="footer-brand-mark">
            <span className="brand-mark">IT</span>
            Ian Tirop
          </Link>
          <p className="footer-tagline">
            Notes on code, design, and things I learn by building.
          </p>

          <ul className="footer-social">
            {social.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                  <svg className="icon invertable" role="presentation" aria-hidden="true">
                    <use href={`/icons.svg#${item.icon}`}></use>
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer-col" aria-label="Explore">
          <p className="footer-col-title">Explore</p>
          <ul>
            {exploreLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Connect">
          <p className="footer-col-title">Connect</p>
          <ul>
            {connectLinks.map((link) => (
              <li key={link.to || link.href}>
                {link.to ? <Link to={link.to}>{link.label}</Link> : <a href={link.href}>{link.label}</a>}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <p className="signature">
          © {year} · <strong>Ian Tirop</strong>. All rights reserved.
        </p>

        <nav className="footer-legal" aria-label="Legal">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          {!isAdmin && <Link to="/admin/login">Admin</Link>}
        </nav>
      </div>
    </footer>
  )
}
