import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import './Legal.css'

export function Terms() {
  useDocumentTitle('Terms of Service — Ian Tirop')
  useMetaDescription('The terms for creating an account, submitting a post, and commenting on Ian Tirop’s blog.')
  useCanonicalUrl()

  return (
    <section className="container legal-page">
      <div className="section-heading">
        <p className="eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated September 2026.</p>
      </div>

      <section>
        <h2>What this site is</h2>
        <p>
          This is Ian Tirop&apos;s personal blog and a small community
          space for reader-submitted posts. Creating an account is optional
          and only needed if you want to submit a post, comment while
          signed in, or save/like posts across devices — reading, and even
          commenting anonymously, doesn&apos;t require one.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You&apos;re responsible for keeping your password private and for anything done from your account.</li>
          <li>Use a real, working email — it&apos;s how password resets and status updates on your submissions reach you.</li>
          <li>One account per person; don&apos;t impersonate someone else or create an account on their behalf.</li>
        </ul>
      </section>

      <section>
        <h2>Submissions and comments</h2>
        <p>
          Anything you submit at <Link to="/submit">/submit</Link> is
          reviewed before it&apos;s ever public — submitting a post doesn&apos;t
          guarantee it gets published, and it can be rejected with or
          without a reason given. Once published, a post or comment is
          publicly visible and attributed to your display name (or the name
          you submitted under, if you weren&apos;t signed in).
        </p>
        <p>Don&apos;t post anything that:</p>
        <ul>
          <li>Is illegal, harassing, hateful, or abusive toward another person.</li>
          <li>Infringes someone else&apos;s copyright or other rights.</li>
          <li>Is spam, or unrelated advertising.</li>
          <li>Impersonates someone else or misrepresents who wrote it.</li>
        </ul>
        <p>
          Comments can be reported by other readers, and any post, comment,
          or account can be removed or restricted at Ian&apos;s discretion if
          it breaks these rules — repeated or serious violations can result
          in a warning on your account or its removal entirely.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          This site is run by one person, for free, as a personal project.
          It&apos;s provided as-is, with no uptime guarantee and no warranty
          of any kind — content may be wrong, incomplete, or change without
          notice.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          These terms may be updated as the site changes. Continuing to use
          the site after an update means you accept the current version,
          which always lives at this same page.
        </p>
      </section>

      <p className="legal-note">
        Questions about any of this? Reach out from the{' '}
        <Link to="/contact">Contact page</Link>.
      </p>
    </section>
  )
}
