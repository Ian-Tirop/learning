import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deletePost,
  getAllPosts,
  getDeletedStaticPosts,
  restorePost,
} from '../../data/postStore'
import { PostCover } from '../../components/PostCover'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import './Write.css'

export function WriteDashboard() {
  useDocumentTitle('Write — Ian Tirop')
  const [posts, setPosts] = useState(() => getAllPosts({ includeDrafts: true }))
  const [deleted, setDeleted] = useState(() => getDeletedStaticPosts())
  const [confirmingSlug, setConfirmingSlug] = useState(null)

  const refresh = () => {
    setPosts(getAllPosts({ includeDrafts: true }))
    setDeleted(getDeletedStaticPosts())
  }

  const handleDelete = (slug) => {
    deletePost(slug)
    setConfirmingSlug(null)
    refresh()
  }

  const handleRestore = (slug) => {
    restorePost(slug)
    refresh()
  }

  return (
    <section className="container write-page">
      <div className="write-header">
        <div>
          <p className="eyebrow">Write</p>
          <h1>Your posts</h1>
          <p className="write-intro">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} — create, edit, and publish
            from here. Changes save to this browser as you go.
          </p>
        </div>
        <Link to="/write/new" className="btn btn-primary">
          New post
        </Link>
      </div>

      <ul className="write-list">
        {posts.map((post) => (
          <li key={post.slug} className="write-row">
            <PostCover cover={post.cover} size="thumb" />
            <div className="write-row-main">
              <div className="write-row-title">
                <h2>{post.title}</h2>
                <span className={`status-badge ${post.status}`}>
                  {post.status === 'draft' ? 'Draft' : 'Published'}
                </span>
                {post.isLocal && <span className="status-badge local">New</span>}
                {post.isEdited && <span className="status-badge edited">Edited</span>}
              </div>
              <p className="write-row-meta">
                {new Date(post.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {post.readingTime} min read
              </p>
            </div>
            <div className="write-row-actions">
              <Link to={`/blog/${post.slug}`} className="comment-action-btn">
                Preview
              </Link>
              <Link to={`/write/${post.slug}`} className="comment-action-btn">
                Edit
              </Link>
              {confirmingSlug === post.slug ? (
                <span className="delete-confirm">
                  <button
                    type="button"
                    className="comment-action-btn danger"
                    onClick={() => handleDelete(post.slug)}
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    className="comment-action-btn"
                    onClick={() => setConfirmingSlug(null)}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="comment-action-btn danger"
                  onClick={() => setConfirmingSlug(post.slug)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {deleted.length > 0 && (
        <div className="write-deleted">
          <h2>Deleted</h2>
          <ul>
            {deleted.map((post) => (
              <li key={post.slug}>
                <span>{post.title}</span>
                <button
                  type="button"
                  className="comment-action-btn"
                  onClick={() => handleRestore(post.slug)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
