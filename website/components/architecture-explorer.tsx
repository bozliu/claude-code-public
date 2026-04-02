"use client";

import { useState } from "react";
import type { ArchitectureCategory } from "../lib/site-data";

export function ArchitectureExplorer({
  categories,
}: {
  categories: ArchitectureCategory[];
}) {
  const [activeName, setActiveName] = useState(categories[0]?.name ?? "");
  const active = categories.find((category) => category.name === activeName) ?? categories[0];

  if (!active) {
    return null;
  }

  return (
    <div className="architecture-layout">
      <div className="architecture-map">
        {categories.map((category) => (
          <button
            className={`architecture-pill ${category.name === active.name ? "architecture-pill--active" : ""}`}
            key={category.name}
            onClick={() => setActiveName(category.name)}
            type="button"
          >
            <strong>{category.name}</strong>
            <span>{category.count} files</span>
          </button>
        ))}
      </div>
      <article className="detail-panel">
        <div className="detail-panel__meta">
          <span className="eyebrow">File cluster</span>
          <span>{active.count} files</span>
        </div>
        <h3>{active.name}</h3>
        <p className="detail-panel__lead">{active.summary}</p>
        <div className="sample-list">
          {active.samplePaths.map((samplePath) => (
            <code key={samplePath}>{samplePath}</code>
          ))}
        </div>
      </article>
    </div>
  );
}
