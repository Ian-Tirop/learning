import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getMyPosts, getLikedPosts, getSavedPosts } from '../../data/accountStore'
import { PostCover } from '../../components/PostCover'
import { useAccount } from '../../context/AccountContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { formatDate } from '../../lib/formatDate'
import '../write/Write.css'
import './Account.css'

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected' }

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

export function Profile() {
  useDocumentTitle('Your profile — Ian Tirop')
  useMetaRobots()
  const { account, loading: authLoading, logout } = useAccount()

  const [posts, setPosts] = useState([])
  const [liked, setLiked] = useState([])
  const [savedArticles, setSavedArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account) return
    Promise.all([
      getMyPosts().catch(() => []),
      getLikedPosts().catch(() => []),
      getSavedPosts().catch(() => []),
    ])
      .then(([myPosts, likedPosts, saved]) => {
        setPosts(myPosts)
        setLiked(likedPosts)
        setSavedArticles(saved)
      })
      .finally(() => setLoading(false))
  }, [account])

  if (!authLoading && !account) {
    return <Navigate to="/account/login" replace />
  }

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Your profile</p>
          <h1>Hi, {account?.displayName}</h1>
          <p className="write-intro">{account?.email}</p>
        </div>
        <div className="write-header-actions">
          <Link to="/submit" className="btn btn-primary">
            Submit a new post
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">
          Your submissions {!loading && `(${posts.length})`}
        </h2>
        <p className="write-intro">Track their status and edit them any time.</p>

        {!loading && posts.length === 0 && (
          <p className="write-intro">You haven&apos;t submitted anything yet.</p>
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

      <div className="profile-section">
        <h2 className="profile-section-title">Liked articles {!loading && `(${liked.length})`}</h2>
        <p className="write-intro">
          Anything you&apos;ve liked across the site — Ian&apos;s own posts and other readers&apos;
          published submissions alike.
        </p>
        {!loading && liked.length === 0 && <p className="write-intro">Nothing liked yet.</p>}
        <ul className="write-list">
          {liked.map((post) => (
            <ArticleRow key={post.slug} post={post} />
          ))}
        </ul>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Saved articles {!loading && `(${savedArticles.length})`}</h2>
        <p className="write-intro">Bookmarked for later.</p>
        {!loading && savedArticles.length === 0 && <p className="write-intro">Nothing saved yet.</p>}
        <ul className="write-list">
          {savedArticles.map((post) => (
            <ArticleRow key={post.slug} post={post} />
          ))}
        </ul>
      </div>
    </section>
  )
}
