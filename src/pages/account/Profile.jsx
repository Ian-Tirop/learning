import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getMyPosts, getLikedPosts, getSavedPosts, getFollowing, toggleFollow } from '../../data/accountStore'
import { getAllPosts } from '../../data/postStore'
import { getRecommendedPosts } from '../../lib/postRanking'
import { PostCover } from '../../components/PostCover'
import { useAccount } from '../../context/AccountContext'
import { useToast } from '../../context/ToastContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { useCountUp } from '../../hooks/useCountUp'
import { formatDate } from '../../lib/formatDate'
import { initials } from '../../lib/initials'
import '../write/Write.css'
import './Account.css'

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected', scheduled: 'Scheduled' }

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'grid-icon' },
  { key: 'submissions', label: 'Submissions', icon: 'pencil-icon' },
  { key: 'liked', label: 'Liked', icon: 'thumb-up-icon' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-icon' },
  { key: 'following', label: 'Following', icon: 'star-icon' },
  { key: 'settings', label: 'Settings', icon: 'user-icon' },
]

function StatValue({ value }) {
  const animated = useCountUp(value)
  return <span className="stat-value">{animated}</span>
}

function ArticleRow({ post }) {
  return (
    <li className="write-row">
      <PostCover cover={post.cover} size="thumb" />
      <div className="write-row-main">
        <div className="write-row-title">
          <h2>{post.title}</h2>
        </div>
        <p className="write-row-meta">{formatDate(post.date)}</p>
      </div>
      <div className="write-row-actions">
        <Link to={`/blog/${post.slug}`} className="comment-action-btn">
          Read
        </Link>
      </div>
    </li>
  )
}

function WriterRow({ writer, onUnfollow }) {
  return (
    <li className="write-row">
      <div className="profile-avatar profile-avatar-sm" aria-hidden="true">
        {initials(writer.displayName)}
      </div>
      <div className="write-row-main">
        <div className="write-row-title">
          <h2>{writer.displayName}</h2>
        </div>
        <p className="write-row-meta">
          {writer.postCount} published {writer.postCount === 1 ? 'post' : 'posts'}
        </p>
      </div>
      <div className="write-row-actions">
        <button type="button" className="comment-action-btn" onClick={() => onUnfollow(writer.id)}>
          Unfollow
        </button>
      </div>
    </li>
  )
}

function ProfileDetailsForm({ account, updateProfile }) {
  const [displayName, setDisplayName] = useState(account.displayName)
  const [email, setEmail] = useState(account.email)
  const [nickname, setNickname] = useState(account.nickname || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await updateProfile({ displayName, email, nickname })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="write-form profile-form settings-card" onSubmit={handleSubmit}>
      <h3 className="settings-card-title">Profile details</h3>
      <p className="body-hint">Your name and email — shown to Ian when you submit a post.</p>
      <div className="field-row">
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value)
              setSuccess(false)
            }}
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setSuccess(false)
            }}
          />
        </label>
      </div>
      <label className="field">
        <span>Nickname (optional)</span>
        <input
          type="text"
          value={nickname}
          placeholder="Shown on your own profile only"
          onChange={(event) => {
            setNickname(event.target.value)
            setSuccess(false)
          }}
        />
      </label>
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="form-success">Profile updated.</p>}
      <div className="write-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}

function AvatarUploadForm({ account, uploadAvatar }) {
  const showToast = useToast()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAvatar(file)
      showToast('Profile picture updated.', { type: 'success' })
    } catch (err) {
      showToast(err.message || 'Could not upload that image.', { type: 'error' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="settings-card">
      <h3 className="settings-card-title">Profile picture</h3>
      <p className="body-hint">PNG, JPEG, WebP, or GIF, up to 5MB.</p>
      <div className="avatar-upload-row">
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt="" className="profile-avatar profile-avatar-sm profile-avatar-photo" />
        ) : (
          <div className="profile-avatar profile-avatar-sm" aria-hidden="true">
            {initials(account.displayName)}
          </div>
        )}
        <label className="btn btn-ghost">
          {uploading ? 'Uploading…' : 'Upload photo'}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            hidden
          />
        </label>
      </div>
    </div>
  )
}

function ChangePasswordForm({ changePassword }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="write-form profile-form settings-card" onSubmit={handleSubmit}>
      <h3 className="settings-card-title">Password</h3>
      <p className="body-hint">Change your password.</p>
      <label className="field">
        <span>Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
      </div>
      {error && (
        <p className="comment-error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="form-success">Password changed.</p>}
      <div className="write-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}

export function Profile() {
  useDocumentTitle('Your profile — Ian Tirop')
  useMetaRobots()
  const { account, loading: authLoading, logout, updateProfile, changePassword, uploadAvatar } = useAccount()
  const showToast = useToast()

  const [posts, setPosts] = useState([])
  const [liked, setLiked] = useState([])
  const [savedArticles, setSavedArticles] = useState([])
  const [following, setFollowing] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const handleUnfollow = async (writerId) => {
    const writer = following.find((w) => w.id === writerId)
    await toggleFollow(writerId)
    setFollowing((current) => current.filter((w) => w.id !== writerId))
    if (writer) showToast(`Unfollowed ${writer.displayName}`)
  }

  useEffect(() => {
    if (!account) return
    Promise.all([
      getMyPosts().catch(() => []),
      getLikedPosts().catch(() => []),
      getSavedPosts().catch(() => []),
      getFollowing().catch(() => []),
      getAllPosts().catch(() => []),
    ])
      .then(([myPosts, likedPosts, saved, followedWriters, allPublished]) => {
        setPosts(myPosts)
        setLiked(likedPosts)
        setSavedArticles(saved)
        setFollowing(followedWriters)

        // Personalized picks: scored against everything they've liked/saved,
        // excluding those same posts and anything they wrote themselves.
        const seen = new Set([
          ...likedPosts.map((p) => p.slug),
          ...saved.map((p) => p.slug),
          ...myPosts.map((p) => p.slug),
        ])
        const interestTags = [...likedPosts, ...saved].flatMap((p) => p.tags || [])
        const candidates = allPublished.filter((p) => !seen.has(p.slug))
        setRecommended(getRecommendedPosts(candidates, interestTags, 6))
      })
      .finally(() => setLoading(false))
  }, [account])

  if (!authLoading && !account) {
    return <Navigate to="/account/login" replace />
  }

  if (!account) {
    return (
      <section className="container write-page">
        <p className="loading-note">Loading…</p>
      </section>
    )
  }

  return (
    <section className="container write-page profile-page">
      <div className="profile-header">
        {account.avatarUrl ? (
          <img src={account.avatarUrl} alt="" className="profile-avatar profile-avatar-photo" />
        ) : (
          <div className="profile-avatar" aria-hidden="true">
            {initials(account.displayName)}
          </div>
        )}
        <div className="profile-header-info">
          <p className="eyebrow">Your profile</p>
          <h1>
            {account.displayName}
            {account.nickname && <span className="profile-nickname"> "{account.nickname}"</span>}
          </h1>
          <p className="write-intro">
            {account.email} · Member since {formatDate(account.createdAt)}
          </p>
        </div>
        <div className="write-header-actions">
          <Link to="/submit" className="btn btn-primary">
            Write a new post
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="analytics-grid profile-stats">
        <button type="button" className="stat-card" onClick={() => setActiveTab('submissions')}>
          <StatValue value={posts.length} />
          <span className="stat-label">Submissions</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('liked')}>
          <StatValue value={liked.length} />
          <span className="stat-label">Liked</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('saved')}>
          <StatValue value={savedArticles.length} />
          <span className="stat-label">Saved</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('following')}>
          <StatValue value={following.length} />
          <span className="stat-label">Following</span>
        </button>
        <button type="button" className="stat-card" onClick={() => setActiveTab('overview')}>
          <StatValue value={recommended.length} />
          <span className="stat-label">Recommended</span>
        </button>
      </div>

      <div className="profile-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`profile-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href={`/icons.svg#${tab.icon}`}></use>
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Recommended for you</h2>
          <p className="write-intro">
            {liked.length + savedArticles.length > 0
              ? 'Picked based on what you’ve liked and saved.'
              : 'Popular around the site right now — like or save a few posts to personalize this.'}
          </p>
          {!loading && recommended.length === 0 && (
            <p className="write-intro">✨ Nothing to recommend yet — check back once there&apos;s more on the blog.</p>
          )}
          <ul className="write-list">
            {recommended.map((post) => (
              <ArticleRow key={post.slug} post={post} />
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">
            Your submissions {!loading && `(${posts.length})`}
          </h2>
          <p className="write-intro">Track their status and edit them any time.</p>

          {!loading && posts.length === 0 && (
            <p className="write-intro">📝 You haven&apos;t submitted anything yet.</p>
          )}

          <ul className="write-list">
            {posts.map((post) => (
              <li key={post.slug} className="write-row">
                <PostCover cover={post.cover} size="thumb" />
                <div className="write-row-main">
                  <div className="write-row-title">
                    <h2>{post.title}</h2>
                    <span className={`status-badge ${post.status}`}>{STATUS_LABEL[post.status]}</span>
                  </div>
                  <p className="write-row-meta">
                    {formatDate(post.date)}
                    {post.status === 'rejected' && post.reviewNote && ` · note: ${post.reviewNote}`}
                    {post.status === 'published' &&
                      ' · editing this sends it back for review before your changes go live'}
                  </p>
                </div>
                <div className="write-row-actions">
                  <Link to={`/blog/${post.slug}`} className="comment-action-btn">
                    Preview
                  </Link>
                  <Link to={`/submit/edit/${post.slug}`} className="comment-action-btn">
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'liked' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Liked articles {!loading && `(${liked.length})`}</h2>
          <p className="write-intro">
            Anything you&apos;ve liked across the site — Ian&apos;s own posts and other readers&apos;
            published submissions alike.
          </p>
          {!loading && liked.length === 0 && <p className="write-intro">👍 Nothing liked yet.</p>}
          <ul className="write-list">
            {liked.map((post) => (
              <ArticleRow key={post.slug} post={post} />
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Saved articles {!loading && `(${savedArticles.length})`}</h2>
          <p className="write-intro">Bookmarked for later.</p>
          {!loading && savedArticles.length === 0 && <p className="write-intro">🔖 Nothing saved yet.</p>}
          <ul className="write-list">
            {savedArticles.map((post) => (
              <ArticleRow key={post.slug} post={post} />
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'following' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Writers you follow {!loading && `(${following.length})`}</h2>
          <p className="write-intro">
            Follow a writer from any of their posts to keep track of new ones here.
          </p>
          {!loading && following.length === 0 && <p className="write-intro">⭐ Not following anyone yet.</p>}
          <ul className="write-list">
            {following.map((writer) => (
              <WriterRow key={writer.id} writer={writer} onUnfollow={handleUnfollow} />
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="profile-panel">
          <h2 className="profile-section-title">Account settings</h2>
          <div className="profile-settings-forms">
            <AvatarUploadForm account={account} uploadAvatar={uploadAvatar} />
            <ProfileDetailsForm account={account} updateProfile={updateProfile} />
            <ChangePasswordForm changePassword={changePassword} />
          </div>
        </div>
      )}
    </section>
  )
}
