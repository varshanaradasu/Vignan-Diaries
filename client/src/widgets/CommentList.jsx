export default function CommentList({ items }) {
  return (
    <div className="comment-list">
      {items.length === 0 && <div>No comments yet. Be the first to comment.</div>}
      {items.map(c => (
        <div key={c._id} className="comment-item">
          <strong>{c.authorName || 'Anon'}</strong>
          <div dangerouslySetInnerHTML={{ __html: c.content }} />
          <small>{new Date(c.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  )
}
