import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getMyPosts } from '../../data/accountStore'
import { PostCover } from '../../components/PostCover'
import { useAccount } from '../../context/AccountContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useMetaRobots } from '../../hooks/useMetaRobots'
import { formatDate } from '../../lib/formatDate'
import '../write/Write.css'
import './Account.css'

const STATUS_LABEL = { draft: 'Draft', published: 'Published', pending: 'Pending review', rejected: 'Rejected' }

export function Dashboard() {
  useDocumentTitle('Your submissions — Ian Tirop')
  useMetaRobots()
  const { account, loading: authLoading, logout } = useAccount()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account) return
    getMyPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [account])

  if (!authLoading && !account) {
    return <Navigate to="/account/login" replace />
  }

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>Hi, {account?.displayName}</h1>
          <p className="write-intro">
            {loading ? 'Loading…' : `${posts.length} ${posts.length === 1 ? 'submission' : 'submissions'}`} —
            track their status and edit them any time.
          </p>
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
    </section>
  )
}
