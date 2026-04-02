import Link from 'next/link'
import type { ReactNode } from 'react'

import { repoMeta } from '../../content/explore'
import { exploreNavigation } from '../../content/explore-index'

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="explore-shell">
      <aside className="explore-nav">
        <div className="explore-brand">
          <p className="explore-kicker">Repo explorer</p>
          <Link href="/explore" className="explore-brand-link">
            {repoMeta.name}
          </Link>
          <p className="explore-lede">{repoMeta.tagline}</p>
        </div>

        <nav aria-label="Explore sections" className="explore-nav-list">
          {exploreNavigation.map(item => (
            <Link
              key={item.slug}
              href={`/explore/${item.slug}`}
              className="explore-nav-item"
            >
              <span>{item.title}</span>
              <small>{item.summary}</small>
            </Link>
          ))}
        </nav>

        <div className="explore-source-note">
          <p>Built from source links and repository structure.</p>
          <a href={repoMeta.repoUrl} target="_blank" rel="noreferrer">
            Open repository
          </a>
        </div>
      </aside>

      <main className="explore-main">{children}</main>
    </div>
  )
}
