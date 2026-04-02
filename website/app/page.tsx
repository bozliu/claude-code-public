import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArchitectureExplorer } from "../components/architecture-explorer";
import { CommandCatalog } from "../components/command-catalog";
import { HiddenFeatureCatalog } from "../components/hidden-feature-catalog";
import { LoopWalkthrough } from "../components/loop-walkthrough";
import { ToolCatalog } from "../components/tool-catalog";
import { getSiteData } from "../lib/site-data";

function Chapter({
  id,
  index,
  title,
  description,
  children,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="chapter" id={id}>
      <div className="shell">
        <div className="chapter__header">
          <span className="chapter__index">{index}</span>
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

export default async function HomePage() {
  const siteData = await getSiteData();

  return (
    <>
      <section className="poster-hero">
        <div className="shell">
          <div className="poster-hero__badges">
            <a href={siteData.githubRepoUrl} rel="noreferrer" target="_blank">
              View GitHub source
            </a>
          </div>

          <h1 className="poster-hero__title">
            Claude Code
            <span>Unpacked</span>
          </h1>
          <p className="poster-hero__lede">
            What actually happens when you type a message into Claude Code?
          </p>
          <p className="poster-hero__sublede">
            The agent loop, tool registry, command surface, memory system, and hidden feature
            gates mapped straight from the source.
          </p>

          <div className="poster-hero__stats">
            {siteData.hero.metrics.map((metric) => (
              <article className="poster-stat" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label.toUpperCase()}</span>
                {metric.detail ? <small>{metric.detail}</small> : null}
              </article>
            ))}
          </div>

          <a className="poster-hero__cta" href="#agent-loop">
            START EXPLORING ↓
          </a>
        </div>
      </section>

      <Chapter
        description="From keypress to grounded response, step by step through the source."
        id="agent-loop"
        index="01"
        title="The Agent Loop"
      >
        <LoopWalkthrough steps={siteData.loopSteps} />
      </Chapter>

      <Chapter
        description="Click through the repo’s main clusters and use the source samples as your reading order."
        id="architecture"
        index="02"
        title="Architecture Explorer"
      >
        <div className="chapter__split">
          <ArchitectureExplorer categories={siteData.architecture.categories} />
          <div className="chapter__media">
            <Image
              alt="Treemap-like architecture summary"
              height={900}
              src="/repo-assets/architecture-layers.png"
              width={1600}
            />
          </div>
        </div>
      </Chapter>

      <Chapter
        description="Every built-in tool Claude Code can call, sorted by what it does."
        id="tools"
        index="03"
        title="Tool System"
      >
        <ToolCatalog categories={siteData.tools.categories} entries={siteData.tools.entries} />
      </Chapter>

      <Chapter
        description="Every slash command in the reverse-engineered repo, grouped by operator intent."
        id="commands"
        index="04"
        title="Command Catalog"
      >
        <CommandCatalog
          categories={siteData.commands.categories}
          entries={siteData.commands.entries}
        />
      </Chapter>

      <Chapter
        description="Memory keeps the loop from forgetting what matters; feature gates reveal the product direction that has not fully shipped."
        id="memory"
        index="05"
        title="Memory & Hidden Features"
      >
        <div className="chapter__stack">
          <div className="memory-band">
            <div className="memory-band__copy">
              <h3>File-based memory, built for execution rather than omniscience.</h3>
              <p>{siteData.memory.summary}</p>
              <div className="memory-band__items">
                {siteData.memory.highlights.map((item) => (
                  <article key={item.title}>
                    <div className="memory-band__meta">
                      {item.githubUrl ? (
                        <a href={item.githubUrl} rel="noreferrer" target="_blank">
                          Source
                        </a>
                      ) : null}
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.summary}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="memory-band__media">
              <Image
                alt="Compaction diagram"
                height={900}
                src="/repo-assets/compaction.png"
                width={1600}
              />
            </div>
          </div>

          <div id="hidden-features">
            <HiddenFeatureCatalog entries={siteData.hiddenFeatures} />
          </div>
        </div>
      </Chapter>

      <section className="poster-footer-link">
        <div className="shell">
          <Link href="/explore">Open the deep-dive reading view →</Link>
        </div>
      </section>
    </>
  );
}
