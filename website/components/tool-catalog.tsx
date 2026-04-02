"use client";

import { useMemo, useState } from "react";

import type { ToolEntry } from "../lib/site-data";

export function ToolCatalog({
  categories,
  entries,
}: {
  categories: string[];
  entries: ToolEntry[];
}) {
  const [activeName, setActiveName] = useState(entries[0]?.name ?? "");

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.name === activeName) ?? entries[0],
    [activeName, entries],
  );

  const grouped = useMemo(
    () =>
      categories.map((category) => ({
        category,
        entries: entries.filter((entry) => entry.category === category),
      })),
    [categories, entries],
  );

  if (!activeEntry) {
    return null;
  }

  return (
    <div className="reference-catalog">
      <div className="reference-catalog__detail">
        <span className="reference-catalog__eyebrow">{activeEntry.category}</span>
        <h3>{activeEntry.name}</h3>
        <p>{activeEntry.summary}</p>
        {activeEntry.sourcePath ? (
          <a href={activeEntry.githubUrl} rel="noreferrer" target="_blank">
            {activeEntry.sourcePath}
          </a>
        ) : null}
      </div>

      <div className="reference-catalog__groups">
        {grouped.map((group) => (
          <section className="reference-catalog__group" key={group.category}>
            <div className="reference-catalog__group-header">
              <h3>{group.category.toUpperCase()}</h3>
              <span>{`${group.entries.length} tools`}</span>
            </div>
            <div className="reference-catalog__buttons">
              {group.entries.map((entry) => (
                <button
                  className={entry.name === activeEntry.name ? "reference-catalog__button is-active" : "reference-catalog__button"}
                  key={entry.name}
                  onClick={() => setActiveName(entry.name)}
                  type="button"
                >
                  <strong>{entry.name}</strong>
                  <span>{entry.summary}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="reference-catalog__note">Click a tool to see details and source code</p>
    </div>
  );
}
