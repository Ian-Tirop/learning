import { Link } from 'react-router-dom'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import { social } from '../data/social'
import { useAdmin } from '../context/AdminContext'
import './Footer.css'

const siteLinks = [
  { to: '/', label: 'Home' },
  { to: '/blog', label: 'Blog' },
  { to: '/community', label: 'Community' },
  { to: '/topics', label: 'Topics' },
  { to: '/submit', label: 'Write' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const resourceLinks = [
  { href: '/rss.xml', label: 'RSS feed' },
  { href: '/sitemap.xml', label: 'Sitemap' },
]

export function Footer() {
  const { isAdmin } = useAdmin()
  const year = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

        <nav className="footer-col" aria-label="Site">
          <p className="footer-col-title">Site</p>
          <ul>
            {siteLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Resources">
          <p className="footer-col-title">Resources</p>
          <ul>
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <p className="signature">
          © {year} · Built with ⚡ by <strong>Ian Tirop</strong>
        </p>

        <p className="stack-credit">
          <img src={viteLogo} alt="" />
          <img src={reactLogo} alt="" />
          Vite + React
        </p>

        <button type="button" className="back-to-top" onClick={scrollToTop}>
          Back to top
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#arrow-icon"></use>
          </svg>
        </button>

        {!isAdmin && (
          <Link to="/admin/login" className="admin-entry">
            Admin
          </Link>
        )}
      </div>
    </footer>
  )
}
