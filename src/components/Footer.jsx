import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import './Footer.css'

const social = [
  { href: 'https://github.com/', icon: 'github-icon', label: 'GitHub' },
  { href: 'https://x.com/', icon: 'x-icon', label: 'X.com' },
  { href: 'https://bsky.app/', icon: 'bluesky-icon', label: 'Bluesky' },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="signature">
          Built with ⚡ by <strong>Ian Tirop</strong>
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

        <p className="stack-credit">
          <img src={viteLogo} alt="" />
          <img src={reactLogo} alt="" />
          Vite + React
        </p>
      </div>
    </footer>
  )
}
