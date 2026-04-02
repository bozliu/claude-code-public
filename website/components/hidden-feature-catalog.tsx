"use client";

import { useMemo, useState } from "react";

import type { HiddenFeature } from "../lib/site-data";

export function HiddenFeatureCatalog({
  entries,
}: {
  entries: HiddenFeature[];
}) {
  const [activeName, setActiveName] = useState(entries[0]?.name ?? "");
  const activeEntry = useMemo(
    () => entries.find((entry) => entry.name === activeName) ?? entries[0],
    [activeName, entries],
  );

  if (!activeEntry) {
    return null;
  }

  return (
    <div className="reference-catalog">
      <div className="reference-catalog__detail">
        <span className="reference-catalog__eyebrow">{activeEntry.gate}</span>
        <h3>{activeEntry.name}</h3>
        <p>{activeEntry.summary}</p>
        {activeEntry.sourcePath ? (
          <a href={activeEntry.githubUrl} rel="noreferrer" target="_blank">
            {activeEntry.sourcePath}
          </a>
        ) : null}
      </div>

      <div className="reference-catalog__groups">
        <section className="reference-catalog__group">
          <div className="reference-catalog__group-header">
            <h3>FEATURE GATES</h3>
            <span>{entries.length}</span>
          </div>
          <div className="reference-catalog__buttons">
            {entries.map((entry) => (
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
      </div>

      <p className="reference-catalog__note">Click a feature to inspect the gate and source</p>
    </div>
  );
}
