import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { createPost, getPostBySlug, updatePost } from '../../data/postStore'
import { uploadPostImage } from '../../data/accountStore'
import { coverPresets, findMatchingPreset } from '../../data/coverPresets'
import { PostCover } from '../../components/PostCover'
import { ContentBlocks } from '../../components/ContentBlocks'
import { parsePostBody, serializePostBody } from '../../lib/postBody'
import { slugify } from '../../lib/slugify'
import { estimateReadingTime } from '../../lib/estimateReadingTime'
import { formatDate } from '../../lib/formatDate'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import './Write.css'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function toDatetimeLocalValue(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PostEditor() {
  const { slug } = useParams()
  const { isAdmin, loading: authLoading } = useAdmin()

  if (!authLoading && !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }
  if (authLoading) return null

  return <PostEditorForm key={slug || 'new'} slug={slug} isNew={!slug} />
}

const STATUS_TOAST = {
  published: 'Published! 🎉',
  scheduled: 'Scheduled — it\'ll go live automatically',
  draft: 'Draft saved',
}

function PostEditorForm({ slug, isNew }) {
  const navigate = useNavigate()
  const showToast = useToast()
  const [existing, setExisting] = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(!isNew)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    getPostBySlug(slug)
      .then((post) => {
        if (!cancelled) setExisting(post)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, isNew])

  const [title, setTitle] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [date, setDate] = useState(today())
  const [bodyText, setBodyText] = useState('')
  const [readingTimeValue, setReadingTimeValue] = useState('1')
  const [readingTimeTouched, setReadingTimeTouched] = useState(false)
  const [cover, setCover] = useState(coverPresets[0])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkHref, setLinkHref] = useState('')
  const [mode, setMode] = useState('write')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [seriesOrder, setSeriesOrder] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false)
  const bodyTextareaRef = useRef(null)

  useEffect(() => {
    if (!existing) return
    setTitle(existing.title)
    setSlugValue(existing.slug)
    setTagsInput(existing.tags.join(', '))
    setExcerpt(existing.excerpt)
    setDate(existing.date)
    setBodyText(serializePostBody(existing.content))
    setReadingTimeValue(String(existing.readingTime))
    setReadingTimeTouched(true)
    setCover(existing.cover?.type === 'image' ? existing.cover : findMatchingPreset(existing.cover))
    setLinkLabel(existing.link?.label || '')
    setLinkHref(existing.link?.href || '')
    setScheduledAt(toDatetimeLocalValue(existing.scheduledAt))
    setSeriesName(existing.seriesName || '')
    setSeriesOrder(existing.seriesOrder != null ? String(existing.seriesOrder) : '')
  }, [existing])

  useDocumentTitle(isNew ? 'New post — Ian Tirop' : 'Edit — Ian Tirop')
  useMetaRobots()

  if (!isNew && loadingExisting) {
    return (
      <section className="container write-page">
        <p className="loading-note">Loading post…</p>
      </section>
    )
  }
  if (!isNew && (loadError || !existing)) {
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

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setError('')
    try {
      const url = await uploadPostImage(file)
      setCover({ type: 'image', url })
    } catch (err) {
      setError(err.message || 'Could not upload that image.')
    } finally {
      setUploadingCover(false)
      event.target.value = ''
    }
  }

  const handleBodyImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingBodyImage(true)
    setError('')
    try {
      const url = await uploadPostImage(file)
      const textarea = bodyTextareaRef.current
      const insertion = `![](${url})`
      if (textarea) {
        const start = textarea.selectionStart ?? bodyText.length
        const end = textarea.selectionEnd ?? bodyText.length
        const before = bodyText.slice(0, start)
        const after = bodyText.slice(end)
        const needsLeadingBreak = before && !before.endsWith('\n\n')
        const needsTrailingBreak = after && !after.startsWith('\n\n')
        const next = `${before}${needsLeadingBreak ? '\n\n' : ''}${insertion}${needsTrailingBreak ? '\n\n' : ''}${after}`
        setBodyText(next)
      } else {
        setBodyText((current) => `${current}${current ? '\n\n' : ''}${insertion}`)
      }
    } catch (err) {
      setError(err.message || 'Could not upload that image.')
    } finally {
      setUploadingBodyImage(false)
      event.target.value = ''
    }
  }

  const buildData = (status) => ({
    title: title.trim(),
    tags,
    excerpt: excerpt.trim(),
    date,
    readingTime: effectiveReadingTime,
    cover,
    content: parsedContent,
    link: linkHref.trim() ? { href: linkHref.trim(), label: linkLabel.trim() || 'Read more' } : null,
    status,
    ...(status === 'scheduled' ? { scheduledAt: new Date(scheduledAt).toISOString() } : { scheduledAt: null }),
    seriesName: seriesName.trim() || null,
    seriesOrder: seriesOrder.trim() ? Number(seriesOrder) : null,
  })

  const handleSave = async (status) => {
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
    if (status === 'scheduled') {
      if (!scheduledAt) {
        setError('Pick a date and time to schedule this for.')
        return
      }
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        setError('Scheduled time has to be in the future.')
        return
      }
    }

    setSaving(true)
    setError('')

    try {
      if (isNew) {
        const finalSlug = slugValue.trim() || slugify(title)
        if (!finalSlug) {
          setError('Give your post a URL slug.')
          setSaving(false)
          return
        }
        await createPost({ ...buildData(status), slug: finalSlug })
      } else {
        await updatePost(existing.slug, buildData(status))
      }
      showToast(STATUS_TOAST[status] || 'Saved', { type: status === 'published' ? 'success' : 'default' })
      navigate('/write')
    } catch (err) {
      setError(err.message || 'Could not save that post right now.')
      setSaving(false)
    }
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

        <div className="field-row">
          <label className="field">
            <span>Series name (optional)</span>
            <input
              type="text"
              value={seriesName}
              onChange={(event) => setSeriesName(event.target.value)}
              placeholder="e.g. Learning React"
            />
          </label>
          <label className="field">
            <span>Position in series</span>
            <input
              type="number"
              min="1"
              value={seriesOrder}
              onChange={(event) => setSeriesOrder(event.target.value)}
              placeholder="1"
              disabled={!seriesName.trim()}
            />
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
            {cover.type === 'image' && (
              <button type="button" className="cover-pick selected" aria-pressed="true" aria-label="Uploaded cover image">
                <PostCover cover={cover} size="thumb" />
              </button>
            )}
            {coverPresets.map((preset, index) => {
              const isSelected =
                cover.type !== 'image' &&
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
            <label className="cover-pick cover-upload-pick">
              {uploadingCover ? (
                <span className="loading-note">Uploading…</span>
              ) : (
                <span>Upload your own</span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
                hidden
              />
            </label>
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
            {mode === 'write' && (
              <label className="btn btn-ghost insert-image-btn">
                {uploadingBodyImage ? 'Uploading…' : 'Insert image'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleBodyImageUpload}
                  disabled={uploadingBodyImage}
                  hidden
                />
              </label>
            )}
          </div>

          {mode === 'write' ? (
            <>
              <textarea
                ref={bodyTextareaRef}
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
                <code>&gt; quote</code> · <code>```code```</code> ·{' '}
                <code>Insert image</code> to add a photo at your cursor
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
                {formatDate(date, 'long')}
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

        <label className="field">
          <span>Schedule for later (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
          <p className="body-hint">
            Set a date/time and click Schedule instead of Publish — it goes live automatically, and
            subscribers still get notified. Checked once a day (Vercel's Hobby plan caps cron jobs at
            once daily), so it may go live up to ~24 hours after the time you pick — for anything
            more precise, publish it manually when the time comes.
          </p>
        </label>

        <div className="write-form-actions">
          <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => handleSave('draft')}>
            Save draft
          </button>
          {scheduledAt && (
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => handleSave('scheduled')}>
              {saving ? 'Saving…' : 'Schedule'}
            </button>
          )}
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => handleSave('published')}>
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>
    </section>
  )
}
