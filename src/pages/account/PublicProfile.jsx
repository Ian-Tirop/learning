import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getPublicProfile, toggleFollow } from '../../data/accountStore'
import { useAccount } from '../../context/AccountContext'
import { useToast } from '../../context/ToastContext'
import { PostList } from '../../components/PostList'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { formatDate } from '../../lib/formatDate'
import { initials } from '../../lib/initials'
import '../write/Write.css'
import '../Blog.css'
import './Account.css'

// A public counterpart to /profile (which is always the signed-in
// account's own, private dashboard) — anyone can view this, logged in or
// not, for any reader account. Only ever exposes what's already public on
// their posts/bylines: name, avatar, follower count, and their published
// posts. Never their liked/saved lists or email.
export function PublicProfile() {
  const { accountId } = useParams()
  const { account: viewer } = useAccount()
  const showToast = useToast()
  useMetaRobots()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followState, setFollowState] = useState(null)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    getPublicProfile(accountId)
      .then((data) => {
        if (cancelled) return
        setProfile(data.account)
        setPosts(data.posts)
        setFollowState({ following: data.account.isFollowing, followerCount: data.account.followerCount })
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  useDocumentTitle(profile ? `${profile.displayName} — Ian Tirop` : 'Reader profile — Ian Tirop')

  const handleToggleFollow = async () => {
    if (followBusy) return
    setFollowBusy(true)
    try {
      const result = await toggleFollow(accountId)
      setFollowState({ following: result.following, followerCount: result.followerCount })
      showToast(result.following ? `Following ${profile.displayName}` : `Unfollowed ${profile.displayName}`)
    } catch (err) {
      showToast(err.message || 'Could not update that right now.', { type: 'error' })
    } finally {
      setFollowBusy(false)
    }
  }

  if (notFound) {
    return <Navigate to="/community" replace />
  }

  if (loading || !profile) {
    return (
      <section className="container write-page">
        <p className="loading-note">Loading…</p>
      </section>
    )
  }

  const isOwnProfile = Boolean(viewer) && viewer.id === profile.id

  return (
    <section className="container write-page profile-page">
      <div className="profile-header">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="profile-avatar profile-avatar-photo" />
        ) : (
          <div className="profile-avatar" aria-hidden="true">
            {initials(profile.displayName)}
          </div>
        )}
        <div className="profile-header-info">
          <p className="eyebrow">Reader profile</p>
          <h1>{profile.displayName}</h1>
          <p className="write-intro">
            {followState.followerCount} {followState.followerCount === 1 ? 'follower' : 'followers'} · Member
            since {formatDate(profile.createdAt)}
          </p>
        </div>
        <div className="write-header-actions">
          {isOwnProfile ? (
            <Link to="/profile" className="btn btn-ghost">
              This is you
            </Link>
          ) : viewer ? (
            <button
              type="button"
              className={`btn ${followState.following ? 'btn-ghost' : 'btn-primary'}`}
              onClick={handleToggleFollow}
              disabled={followBusy}
            >
              {followState.following ? 'Following' : 'Follow'}
            </button>
          ) : (
            <Link to="/account/login" className="btn btn-ghost">
              Log in to follow
            </Link>
          )}
        </div>
      </div>

      <h2 className="profile-section-title">Published posts ({posts.length})</h2>
      <PostList
        posts={posts}
        loading={false}
        emptyMessage={`${profile.displayName} hasn't published anything yet.`}
      />
    </section>
  )
}
