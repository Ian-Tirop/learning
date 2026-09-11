import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaDescription } from '../hooks/useMetaDescription'
import { useCanonicalUrl } from '../hooks/useCanonicalUrl'
import './Legal.css'

export function Privacy() {
  useDocumentTitle('Privacy Policy — Ian Tirop')
  useMetaDescription('What data Ian Tirop’s blog collects from readers and accounts, and how it’s used.')
  useCanonicalUrl()

  return (
    <section className="container legal-page">
      <div className="section-heading">
        <p className="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated September 2026.</p>
      </div>

      <section>
        <h2>What's collected</h2>
        <p>This is a small, self-hosted blog — here's exactly what it stores, and nothing more:</p>
        <ul>
          <li>
            <strong>If you create an account:</strong> your email, display
            name, and a hashed (never plain-text) password, plus an
            optional avatar image and nickname if you add them.
          </li>
          <li>
            <strong>If you comment, like, rate, or react without an account:</strong>{' '}
            a random id is generated in your browser&apos;s local storage —
            it isn&apos;t linked to your identity, it just lets you edit or
            remove your own comment/reaction later.
          </li>
          <li>
            <strong>If you submit a post</strong> without an account, the
            name and email you enter on that form, so it can be reviewed and
            you can be notified of the outcome.
          </li>
          <li>
            <strong>If you subscribe to the newsletter</strong> or use the
            Contact/"Suggest an edit" forms, the email and message you
            provide.
          </li>
        </ul>
        <p>
          There is no page-view tracking, no advertising, and no
          third-party analytics on this site.
        </p>
      </section>

      <section>
        <h2>How it's used</h2>
        <p>
          Solely to run the features you&apos;re using: logging you in,
          showing your own submissions/likes/saves, sending you a
          publish/approval/rejection email when relevant, and — if you
          reported or were reported in a comment — surfacing that to Ian for
          moderation. Nothing is sold, and nothing is shared beyond the
          service providers below.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Signed in? A single cookie keeps you logged in
          (<code>reader_session</code>, or <code>admin_session</code> for the
          site owner). It&apos;s required for staying logged in and isn&apos;t
          used for tracking or advertising.
        </p>
      </section>

      <section>
        <h2>Who this data passes through</h2>
        <ul>
          <li><strong>Neon</strong> — hosts the database everything above lives in.</li>
          <li><strong>Vercel</strong> — hosts the site and any uploaded images (avatars, post covers).</li>
          <li><strong>Resend</strong> — sends account, submission, and newsletter emails, when configured.</li>
          <li>
            <strong>Anthropic</strong> — powers the chat widget, when
            configured; it only ever receives public post content, never
            your account details.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can update or delete most of your own data from your{' '}
          <Link to="/profile">profile</Link> — change your password, remove
          your avatar, or unsubscribe from the newsletter via the link in
          any newsletter email. To delete your account entirely, reach out
          from the <Link to="/contact">Contact page</Link>.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If what&apos;s collected or how it&apos;s used ever changes, this
          page will be updated to reflect it.
        </p>
      </section>

      <p className="legal-note">
        This is a plain-language description of how this specific site
        actually works, written by its own developer — not a substitute for
        legal advice.
      </p>
    </section>
  )
}
