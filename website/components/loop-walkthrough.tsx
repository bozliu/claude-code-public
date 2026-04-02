"use client";

import { useState } from "react";

import type { LoopStep } from "../lib/site-data";

function renderVisualization(step: number) {
  switch (step) {
    case 1:
      return [
        "$ claude-code",
        "",
        "Find all TODO comments in src/ and create a summary",
      ];
    case 2:
      return [
        "{",
        '  "messages": [...],',
        '  "memory": "attached",',
        '  "tools": "filtered for this turn"',
        "}",
      ];
    case 3:
      return [
        "assistant.content_block_start",
        "assistant.text: Let me inspect the repo first...",
        "assistant.tool_use: Read + Grep",
      ];
    case 4:
      return [
        "> Read src/query.ts",
        "> Grep TODO src/",
        "tool_result: 14 matches across 6 files",
      ];
    case 5:
      return [
        "session_memory: updated",
        "extractMemories: scheduled",
        "next turn starts with compacted context",
      ];
    default:
      return ["Waiting for the next turn..."];
  }
}

export function LoopWalkthrough({ steps }: { steps: LoopStep[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = steps[activeIndex];

  if (!current) {
    return null;
  }

  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < steps.length - 1;

  return (
    <div className="loop-sim">
      <nav className="loop-sim__nav" aria-label="Agent loop pipeline steps">
        {steps.map((step, index) => (
          <button
            aria-selected={index === activeIndex}
            className={index === activeIndex ? "loop-sim__nav-item is-active" : "loop-sim__nav-item"}
            key={step.step}
            onClick={() => setActiveIndex(index)}
            role="tab"
            type="button"
          >
            {`Step ${step.step}: ${step.title}`}
          </button>
        ))}
      </nav>

      <div className="loop-sim__panel">
        <div className="loop-sim__copy">
          <button className="loop-sim__start" type="button">
            Start simulation
          </button>
          <p className="loop-sim__hint">
            Watch what happens when you send a message to Claude Code
          </p>
          <h3>{`${current.step} ${current.title}`}</h3>
          <a href={current.githubUrl} rel="noreferrer" target="_blank">
            {current.sourcePath}
          </a>
          <p className="loop-sim__summary">{current.summary}</p>
          <p>{current.detail}</p>
        </div>

        <div className="loop-sim__terminal" aria-label={`Step ${current.step} visualization`}>
          {renderVisualization(current.step).map((line) => (
            <div className="loop-sim__line" key={`${current.step}-${line}`}>
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="loop-sim__controls">
        <button disabled={!canGoBack} onClick={() => setActiveIndex((index) => index - 1)} type="button">
          Previous step
        </button>
        <button onClick={() => setActiveIndex((index) => (canGoForward ? index + 1 : index))} type="button">
          {canGoForward ? "Next step" : "Restart"}
        </button>
        <span>{`${activeIndex + 1} / ${steps.length}`}</span>
      </div>
    </div>
  );
}
