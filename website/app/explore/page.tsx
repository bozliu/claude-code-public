import Link from 'next/link'

import {
  commandCatalog,
  featureCatalog,
  heroStats,
  repoMeta,
  toolCatalog,
} from '../../content/explore'
import { featuredDeepDives } from '../../content/explore-index'

const walkthrough = [
  {
    step: '01',
    title: 'Prompt enters the loop',
    body:
      'A user message is preprocessed, compacted when needed, and merged with session state before the model sees it.',
  },
  {
    step: '02',
    title: 'The model proposes actions',
    body:
      'The assistant response can include reasoning, tool calls, and stop conditions in a single streamed turn.',
  },
  {
    step: '03',
    title: 'Tools ground the answer',
    body:
      'Read, search, shell, and external integrations turn the turn into something evidence-based rather than speculative.',
  },
  {
    step: '04',
    title: 'Memory updates the next turn',
    body:
      'Session memory and persistent files preserve the useful part of the conversation so the next pass starts smarter.',
  },
]

export default function ExploreHomePage() {
  return (
    <div className="explore-home">
      <section className="explore-home__hero">
        <div className="explore-home__hero-copy">
          <p className="eyebrow">Source-backed repo explorer</p>
          <h1>{repoMeta.name}</h1>
          <p className="explore-home__summary">
            An English-first reading guide for engineers who want to understand
            how Claude Code is assembled, where its agent loop lives, and which
            parts are hidden behind flags.
          </p>
          <div className="explore-home__hero-links">
            <Link href="/explore/agent-loop" className="explore-home__primary">
              Start with Agent Loop
            </Link>
            <a
              href={repoMeta.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="explore-home__secondary"
            >
              Open source
            </a>
          </div>
        </div>

        <div className="explore-home__stats" aria-label="Repository highlights">
          {heroStats.map(stat => (
            <div key={stat.label} className="explore-home__stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="explore-home__section">
        <div className="explore-home__section-head">
          <p className="eyebrow">Featured deep dives</p>
          <h2>Read the repo in the order it actually executes.</h2>
        </div>
        <div className="explore-home__deep-dive-list">
          {featuredDeepDives.map(item => (
            <Link
              key={item.slug}
              href={item.href}
              className="explore-home__deep-dive-item"
            >
              <span className="explore-home__meta">
                {item.eyebrow} · {item.sourceCount} source refs
              </span>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="explore-home__section">
        <div className="explore-home__section-head">
          <p className="eyebrow">Agent walkthrough</p>
          <h2>One turn, from prompt to memory.</h2>
        </div>
        <div className="explore-home__walkthrough">
          {walkthrough.map(item => (
            <article key={item.step} className="explore-home__walk-step">
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="explore-home__section explore-home__split">
        <div>
          <div className="explore-home__section-head">
            <p className="eyebrow">Tool system</p>
            <h2>Capability first, not feature soup.</h2>
          </div>
          <div className="explore-home__catalog">
            {toolCatalog.map(group => (
              <div key={group.category} className="explore-home__catalog-group">
                <h3>{group.category}</h3>
                <p>{group.items.join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="explore-home__section-head">
            <p className="eyebrow">Commands and flags</p>
            <h2>What operators can steer, and what is still gated.</h2>
          </div>
          <div className="explore-home__catalog">
            <div className="explore-home__catalog-group">
              <h3>Commands</h3>
              {commandCatalog.map(group => (
                <p key={group.category}>
                  <strong>{group.category}:</strong> {group.items.join(' · ')}
                </p>
              ))}
            </div>
            <div className="explore-home__catalog-group">
              <h3>Hidden features</h3>
              {featureCatalog.slice(0, 4).map(feature => (
                <p key={feature.name}>
                  <strong>{feature.name}:</strong> {feature.summary}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="explore-home__section">
        <div className="explore-home__section-head">
          <p className="eyebrow">What this site is for</p>
          <h2>It should help you answer “where is this behavior coming from?” fast.</h2>
        </div>
        <div className="explore-home__note">
          <p>
            Every chapter links back to source so you can move from
            explanation to code without losing the trail. The goal is not to
            restate the repository. It is to give you a sharp map for browsing the
            repository as an engineer.
          </p>
        </div>
      </section>
    </div>
  )
}
