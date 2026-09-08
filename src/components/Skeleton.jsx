import './Skeleton.css'

/** A shimmering placeholder block — pass width/height as CSS values. */
export function Skeleton({ width = '100%', height = '16px', radius = '6px', className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/** A row of skeleton blocks shaped like a post card, for list loading states. */
export function SkeletonPostCard() {
  return (
    <div className="card skeleton-post-card">
      <Skeleton height="160px" radius="12px" />
      <div className="skeleton-post-card-body">
        <Skeleton width="40%" height="12px" />
        <Skeleton width="85%" height="20px" />
        <Skeleton width="100%" height="14px" />
        <Skeleton width="70%" height="14px" />
      </div>
    </div>
  )
}

/** A row shaped like a write-list / analytics-list item. */
export function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <Skeleton width="48px" height="48px" radius="10px" />
      <div className="skeleton-row-body">
        <Skeleton width="60%" height="16px" />
        <Skeleton width="35%" height="12px" />
      </div>
    </div>
  )
}
