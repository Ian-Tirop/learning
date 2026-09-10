// A post's canonical URL depends on who wrote it, mirroring the Blog vs
// Community page split: an admin-authored post lives under /blog, a
// reader-submitted (and admin-approved) one lives under /community.
// submittedByName is the same signal Blog.jsx/Community.jsx already use
// to decide which list a post belongs on — a post has it set if and only
// if it went through /submit rather than being written directly.
export function getPostPath(post) {
  return post.submittedByName ? `/community/${post.slug}` : `/blog/${post.slug}`
}
