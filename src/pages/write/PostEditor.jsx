import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { createPost, getPostBySlug, slugExists, updatePost } from '../../data/postStore'
import { coverPresets, findMatchingPreset } from '../../data/coverPresets'
import { PostCover } from '../../components/PostCover'
import { ContentBlocks } from '../../components/ContentBlocks'
import { parsePostBody, serializePostBody } from '../../lib/postBody'
import { slugify } from '../../lib/slugify'
import { estimateReadingTime } from '../../lib/estimateReadingTime'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import './Write.css'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function PostEditor() {
  const { slug } = useParams()
  return <PostEditorForm key={slug || 'new'} slug={slug} isNew={!slug} />
}

function PostEditorForm({ slug, isNew }) {
  const navigate = useNavigate()
  const existing = isNew ? null : getPostBySlug(slug, { includeDrafts: true })

  const [title, setTitle] = useState(existing?.title || '')
  const [slugValue, setSlugValue] = useState(existing?.slug || '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [tagsInput, setTagsInput] = useState(existing?.tags?.join(', ') || '')
  const [excerpt, setExcerpt] = useState(existing?.excerpt || '')
  const [date, setDate] = useState(existing?.date || today())
  const [bodyText, setBodyText] = useState(existing ? serializePostBody(existing.content) : '')
  const [readingTimeValue, setReadingTimeValue] = useState(String(existing?.readingTime || 1))
  const [readingTimeTouched, setReadingTimeTouched] = useState(Boolean(existing))
  const [cover, setCover] = useState(() => findMatchingPreset(existing?.cover))
  const [linkLabel, setLinkLabel] = useState(existing?.link?.label || '')
  const [linkHref, setLinkHref] = useState(existing?.link?.href || '')
  const [mode, setMode] = useState('write')
  const [error, setError] = useState('')

  useDocumentTitle(isNew ? 'New post — Ian Tirop' : `Edit — Ian Tirop`)

  if (!isNew && !existing) {
    return <Navigate to="/write" replace />
  }

  const parsedContent = parsePostBody(bodyText)
  const effectiveReadingTime = readingTimeTouched
    ? Math.max(1, Number(readingTimeValue) || 1)
    : estimateReadingTime(parsedContent)
  const tags = tagsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const handleTitleChange = (value) => {
    setTitle(value)
    if (isNew && !slugManuallyEdited) setSlugValue(slugify(value))
  }

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true)
    setSlugValue(slugify(value))
  }

  const handleReadingTimeChange = (value) => {
    setReadingTimeTouched(true)
    setReadingTimeValue(value)
  }

  const buildData = (status) => ({
    title: title.trim(),
    tags,
    excerpt: excerpt.trim(),
    date,
    readingTime: effectiveReadingTime,
    cover,
    content: parsedContent,
    link: linkHref.trim()
      ? { href: linkHref.trim(), label: linkLabel.trim() || 'Read more' }
      : undefined,
    status,
  })

  const handleSave = (status) => {
    if (!title.trim()) {
      setError('Give your post a title.')
      return
    }
    if (parsedContent.length === 0) {
      setError('Write something in the body before saving.')
      return
    }
    if (!excerpt.trim()) {
      setError('Add a short excerpt — it shows up on the blog index and home page.')
      return
    }

    if (isNew) {
      const finalSlug = slugValue.trim() || slugify(title)
      if (!finalSlug) {
        setError('Give your post a URL slug.')
        return
      }
      if (slugExists(finalSlug)) {
        setError(`The URL "/blog/${finalSlug}" is already taken — try a different slug.`)
        return
      }
      createPost({ ...buildData(status), slug: finalSlug })
    } else {
      updatePost(existing.slug, buildData(status))
    }

    navigate('/write')
  }

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Write</p>
          <h1>{isNew ? 'New post' : 'Edit post'}</h1>
        </div>
        <Link to="/write" className="comment-action-btn">
          Cancel
        </Link>
      </div>

      {error && <p className="comment-error write-error">{error}</p>}

      <div className="write-form">
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="A title worth clicking"
          />
        </label>

        <label className="field">
          <span>URL slug</span>
          <div className="slug-input">
            <span className="slug-prefix">/blog/</span>
            <input
              type="text"
              value={slugValue}
              onChange={(event) => handleSlugChange(event.target.value)}
              disabled={!isNew}
              placeholder="a-title-worth-clicking"
            />
          </div>
        </label>

        <div className="field-row">
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
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={2}
            placeholder="One or two sentences shown on the blog index and home page."
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>External link label (optional)</span>
            <input
              type="text"
              value={linkLabel}
              onChange={(event) => setLinkLabel(event.target.value)}
              placeholder="Visit the project"
            />
          </label>
          <label className="field">
            <span>External link URL (optional)</span>
            <input
              type="url"
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
              placeholder="https://example.com"
            />
          </label>
        </div>

        <div className="field">
          <span>Cover</span>
          <div className="cover-picker">
            {coverPresets.map((preset, index) => {
              const isSelected =
                preset.icon === cover.icon &&
                preset.from === cover.from &&
                preset.to === cover.to &&
                preset.angle === cover.angle
              return (
                <button
                  key={index}
                  type="button"
                  className={`cover-pick${isSelected ? ' selected' : ''}`}
                  onClick={() => setCover(preset)}
                  aria-pressed={isSelected}
                  aria-label={`Use ${preset.icon.replace('-icon', '')} cover`}
                >
                  <PostCover cover={preset} size="thumb" />
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <div className="body-tabs">
            <button
              type="button"
              className={`body-tab${mode === 'write' ? ' active' : ''}`}
              onClick={() => setMode('write')}
            >
              Write
            </button>
            <button
              type="button"
              className={`body-tab${mode === 'preview' ? ' active' : ''}`}
              onClick={() => setMode('preview')}
            >
              Preview
            </button>
          </div>

          {mode === 'write' ? (
            <>
              <textarea
                className="body-editor"
                value={bodyText}
                onChange={(event) => setBodyText(event.target.value)}
                rows={16}
                placeholder={
                  'Write in plain paragraphs, separated by a blank line.\n\n' +
                  '### Use this for a subheading\n\n' +
                  '> Use this for a pulled quote\n\n' +
                  '```\nUse triple backtick fences for code\n```'
                }
              />
              <p className="body-hint">
                Blank line = new paragraph · <code>### heading</code> ·{' '}
                <code>&gt; quote</code> · <code>```code```</code>
              </p>
            </>
          ) : (
            <div className="body-preview">
              <PostCover cover={cover} size="banner" />
              <div className="post-row-tags">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <h1>{title || 'Untitled post'}</h1>
              <p className="post-meta">
                {new Date(date).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {effectiveReadingTime} min read
              </p>
              <div className="prose">
                {parsedContent.length > 0 ? (
                  <ContentBlocks content={parsedContent} />
                ) : (
                  <p>Nothing written yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <label className="field reading-time-field">
          <span>Reading time (minutes)</span>
          <div className="reading-time-row">
            <input
              type="number"
              min="1"
              value={readingTimeValue}
              onChange={(event) => handleReadingTimeChange(event.target.value)}
            />
            {readingTimeTouched && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => {
                  setReadingTimeTouched(false)
                  setReadingTimeValue(String(estimateReadingTime(parsedContent)))
                }}
              >
                Use auto-estimate
              </button>
            )}
          </div>
        </label>

        <div className="write-form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => handleSave('draft')}>
            Save draft
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleSave('published')}>
            Publish
          </button>
        </div>
      </div>
    </section>
  )
}
