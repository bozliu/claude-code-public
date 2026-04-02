import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  exploreEntries,
  exploreSlugs,
  getExploreEntry,
  type ExploreSlug,
} from '../../../content/explore'

export function generateStaticParams() {
  return exploreSlugs.map(slug => ({ slug }))
}

export default async function ExploreDeepDivePage({
  params,
}: {
  params: Promise<{ slug: ExploreSlug }>
}) {
  const { slug } = await params
  const entry = getExploreEntry(slug)

  if (!entry) {
    notFound()
  }

  const nextEntries = exploreEntries
    .filter(item => item.slug !== entry.slug)
    .slice(0, 3)

  return (
    <article className="explore-detail">
      <header className="explore-detail__hero">
        <div className="explore-detail__hero-copy">
          <p className="eyebrow">{entry.eyebrow}</p>
          <h1>{entry.title}</h1>
          <p className="explore-detail__summary">{entry.intro}</p>
        </div>

        <aside className="explore-detail__sidebar">
          <div className="explore-detail__meta-block">
            <span className="explore-detail__label">Quick read</span>
            <strong>{entry.summary}</strong>
          </div>

          <div className="explore-detail__meta-block">
            <span className="explore-detail__label">Signals</span>
            <ul>
              {entry.stats.map(stat => (
                <li key={stat}>{stat}</li>
              ))}
            </ul>
          </div>
        </aside>
      </header>

      <section className="explore-detail__sources">
        <p className="eyebrow">Source trail</p>
        <div className="explore-detail__source-list">
          {entry.sourceRefs.map(ref => (
            <a key={ref.href} href={ref.href} target="_blank" rel="noreferrer">
              {ref.label}
            </a>
          ))}
        </div>
      </section>

      <section className="explore-detail__content">
        {entry.sections.map(section => (
          <section key={section.heading} className="explore-detail__section">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
            {section.bullets ? (
              <ul>
                {section.bullets.map(bullet => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </section>

      <section className="explore-detail__next">
        <p className="eyebrow">Keep reading</p>
        <div className="explore-detail__next-list">
          {nextEntries.map(item => (
            <Link key={item.slug} href={`/explore/${item.slug}`}>
              <span>{item.title}</span>
              <small>{item.summary}</small>
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}
