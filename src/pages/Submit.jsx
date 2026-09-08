import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { createPost, getPostBySlug, updatePost } from '../data/postStore'
import { coverPresets } from '../data/coverPresets'
import { parsePostBody, serializePostBody } from '../lib/postBody'
import { estimateReadingTime } from '../lib/estimateReadingTime'
import { getMySubmissions, addMySubmission } from '../lib/mySubmissions'
import { useAccount } from '../context/AccountContext'
import { useAdmin } from '../context/AdminContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMetaRobots } from '../hooks/useMetaRobots'
import './write/Write.css'
import './Submit.css'

function randomCover() {
  return coverPresets[Math.floor(Math.random() * coverPresets.length)]
}

export function Submit() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const isEdit = Boolean(slug)
  const { account, loading: accountLoading } = useAccount()
  const { effectiveIsAdmin } = useAdmin()

  useDocumentTitle(isEdit ? 'Edit your submission — Ian Tirop' : 'Submit a post — Ian Tirop')
  useMetaRobots()

  const [existing, setExisting] = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(isEdit)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    getPostBySlug(slug, { token })
      .then((post) => {
        if (!cancelled) setExisting(post)
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't find that submission — check the link you used.")
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, token, isEdit])

  // A signed-in account can edit any of its own posts, any time — an
  // anonymous edit token only works while the post is still pending.
  const editableByToken = Boolean(token) && existing?.status === 'pending'
  const editableByAccount = Boolean(account) && Boolean(existing?.authorAccountId) && account.id === existing.authorAccountId
  const canEditExisting = editableByToken || editableByAccount

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [linkHref, setLinkHref] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!existing) return
    setTitle(existing.title)
    setExcerpt(existing.excerpt)
    setTagsInput(existing.tags.join(', '))
    setBodyText(serializePostBody(existing.content))
    setLinkHref(existing.link?.href || '')
  }, [existing])

  const submissions = getMySubmissions()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const parsedContent = parsePostBody(bodyText)

    if (!isEdit && !account && !name.trim()) {
      setError('Your name is required so Ian knows who to credit.')
      return
    }
    if (!title.trim() || !excerpt.trim() || parsedContent.length === 0) {
      setError('A title, excerpt, and body are all required.')
      return
    }

    setSaving(true)
    setError('')

    const tags = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: parsedContent,
      tags,
      cover: existing?.cover || randomCover(),
      date: new Date().toISOString().slice(0, 10),
      readingTime: estimateReadingTime(parsedContent),
      link: linkHref.trim() ? { href: linkHref.trim(), label: 'Read more' } : null,
    }

    try {
      if (isEdit) {
        await updatePost(slug, { ...payload, token })
        setResult({ slug, token })
      } else {
        const data = await createPost({
          ...payload,
          submittedByName: name.trim(),
          submittedByEmail: email.trim(),
        })
        addMySubmission(data.post.slug, data.editToken, payload.title)
        setResult({ slug: data.post.slug, token: data.editToken })
      }
    } catch (err) {
      setError(err.message || 'Could not submit that post right now.')
    } finally {
      setSaving(false)
    }
  }

  // Ian doesn't submit-for-review — he writes and publishes directly. Only
  // redirect the fresh-submission entry point (not /submit/edit/:slug,
  // which he'd never be linked to anyway); reader-preview mode leaves
  // effectiveIsAdmin false, so it still shows the real reader page there.
  if (!isEdit && effectiveIsAdmin) {
    return <Navigate to="/write/new" replace />
  }

  if (isEdit && (loadingExisting || (existing && accountLoading))) {
    return (
      <section className="container write-page">
        <p className="loading-note">Loading your submission…</p>
      </section>
    )
  }

  if (isEdit && loadError) {
    return (
      <section className="container write-page">
        <p className="comment-error write-error">{loadError}</p>
        <Link to="/submit" className="btn btn-ghost">
          Submit a new post instead
        </Link>
      </section>
    )
  }

  if (isEdit && existing && !canEditExisting) {
    return (
      <section className="container write-page">
        <p className="comment-error write-error">
          This submission has already been reviewed and can no longer be edited this way. Sign in to
          the account that submitted it to edit it any time.
        </p>
        <Link to="/account/login" className="btn btn-ghost">
          Sign in
        </Link>
      </section>
    )
  }

  if (result) {
    return (
      <section className="container write-page submit-page">
        <div className="write-header">
          <div>
            <p className="eyebrow">Submit a post</p>
            <h1>{isEdit ? 'Updated!' : 'Thanks — sent for review'}</h1>
          </div>
        </div>
        <p className="submit-confirmation">
          {isEdit
            ? "Your changes were saved. It's pending Ian's review before it goes live."
            : "Ian reviews every submission before it goes live. If it's approved, it'll appear on the blog under your name."}
        </p>
        {account ? (
          <p className="submit-confirmation">
            Track its status any time from <Link to="/profile">your profile</Link>.
          </p>
        ) : (
          <>
            <p className="submit-confirmation">
              Keep this link to check on or edit your submission before it&apos;s reviewed:
            </p>
            <p className="submit-edit-link">
              <Link to={`/submit/edit/${result.slug}?token=${result.token}`}>
                /submit/edit/{result.slug}
              </Link>
            </p>
            <p className="submit-confirmation">
              Or <Link to="/account/signup">create an account</Link> to track and edit your
              submissions from any device.
            </p>
          </>
        )}
      </section>
    )
  }

  return (
    <section className="container write-page submit-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Submit a post</p>
          <h1>{isEdit ? 'Edit your submission' : 'Write for the blog'}</h1>
          <p className="write-intro">
            {isEdit
              ? existing?.status === 'published'
                ? "Saving will send this back for review before your changes go live."
                : 'Still pending review — you can update it any time before then.'
              : "Send Ian a post you'd like to see published. He reviews every submission — nothing goes live without his approval."}
          </p>
        </div>
      </div>

      {error && <p className="comment-error write-error">{error}</p>}

      <form className="write-form" onSubmit={handleSubmit}>
        {!isEdit && account && (
          <p className="write-intro">
            Submitting as <strong>{account.displayName}</strong> ({account.email}) —{' '}
            <Link to="/profile">view your profile</Link>.
          </p>
        )}

        {!isEdit && !account && (
          <div className="field-row">
            <label className="field">
              <span>Your name</span>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" />
            </label>
            <label className="field">
              <span>Your email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>
        )}

        <label className="field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A title worth clicking"
          />
        </label>

        <label className="field">
          <span>Tags (comma separated)</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="css, debugging"
          />
        </label>

        <label className="field">
          <span>Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={2}
            placeholder="One or two sentences that sum up the post."
          />
        </label>

        <label className="field">
          <span>External link (optional)</span>
          <input
            type="url"
            value={linkHref}
            onChange={(event) => setLinkHref(event.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <label className="field">
          <span>Body</span>
          <textarea
            className="body-editor"
            value={bodyText}
            onChange={(event) => setBodyText(event.target.value)}
            rows={14}
            placeholder={
              'Write in plain paragraphs, separated by a blank line.\n\n' +
              '### Use this for a subheading\n\n' +
              '> Use this for a pulled quote\n\n' +
              '```\nUse triple backtick fences for code\n```'
            }
          />
          <p className="body-hint">
            Blank line = new paragraph · <code>### heading</code> · <code>&gt; quote</code> ·{' '}
            <code>```code```</code>
          </p>
        </label>

        <div className="write-form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Sending…' : isEdit ? 'Save changes' : 'Submit for review'}
          </button>
        </div>
      </form>

      {!isEdit && !account && (
        <p className="write-intro">
          <Link to="/account/signup">Create an account</Link> to track and edit your submissions
          from any device, even after Ian&apos;s reviewed one.
        </p>
      )}

      {!isEdit && !account && submissions.length > 0 && (
        <div className="my-submissions">
          <h2>Your submissions from this browser</h2>
          <ul>
            {submissions.map((item) => (
              <li key={item.slug}>
                <span>{item.title}</span>
                <Link to={`/submit/edit/${item.slug}?token=${item.token}`}>Check / edit</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
