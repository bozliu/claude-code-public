import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({
  githubRepoUrl,
}: {
  githubRepoUrl: string;
}) {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/">
          <img
            alt="Claude Code Unpacked"
            className="brand__logo"
            height={42}
            src="/repo-assets/logo-light.svg"
            width={42}
          />
          <span className="brand__copy">
            <strong>Claude Code Unpacked</strong>
            <span>Source-backed repo explorer</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <a href="/#agent-loop">Agent Loop</a>
          <a href="/#architecture">Architecture</a>
          <a href="/#tools">Tools</a>
          <a href="/#commands">Commands</a>
          <a href="/#memory">Memory</a>
          <a href="/#hidden-features">Hidden Features</a>
        </nav>
        <div className="site-actions">
          <a
            className="button button--primary"
            href={githubRepoUrl}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  githubRepoUrl,
}: {
  githubRepoUrl: string;
}) {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div>
          <p className="eyebrow">Repo Explorer</p>
          <p className="site-footer__copy">
            Unofficial, source-backed, and built from the reverse-engineered Claude
            Code repository.
          </p>
        </div>
        <div className="site-footer__links">
          <a href={githubRepoUrl} rel="noreferrer" target="_blank">
            Repository
          </a>
          <Link href="/explore/agent-loop">Deep dives</Link>
        </div>
      </div>
    </footer>
  );
}

export function SectionFrame({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="section" id={id}>
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">{eyebrow}</p>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
