import Link from 'next/link'

export default function ExploreNotFound() {
  return (
    <div className="explore-not-found">
      <p className="eyebrow">Not found</p>
      <h1>This deep dive is not in the explorer yet.</h1>
      <p>
        The supported routes are <code>agent-loop</code>,{' '}
        <code>architecture</code>, <code>tools</code>, <code>commands</code>,{' '}
        <code>memory</code>, and <code>hidden-features</code>.
      </p>
      <Link href="/explore" className="explore-not-found__link">
        Back to the explorer
      </Link>
    </div>
  )
}
