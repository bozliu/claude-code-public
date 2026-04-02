import { readFile } from "fs/promises";
import path from "path";
import { cache } from "react";

export type HeroMetric = {
  label: string;
  value: string;
  detail?: string;
};

export type LoopStep = {
  step: number;
  title: string;
  summary: string;
  sourcePath: string;
  githubUrl: string;
  detail: string;
};

export type ArchitectureCategory = {
  name: string;
  count: number;
  summary: string;
  samplePaths: string[];
};

export type ToolEntry = {
  name: string;
  category: string;
  sourcePath?: string;
  githubUrl?: string;
  summary: string;
};

export type CommandEntry = {
  name: string;
  category: string;
  summary: string;
  sourcePath?: string;
  githubUrl?: string;
};

export type MemoryHighlight = {
  title: string;
  summary: string;
  githubUrl?: string;
};

export type HiddenFeature = {
  name: string;
  gate: string;
  summary: string;
  sourcePath?: string;
  githubUrl?: string;
};

export type DeepDiveMeta = {
  slug: string;
  title: string;
  summary: string;
  readingTime: string;
};

export type SiteData = {
  generatedAt: string;
  githubRepoUrl: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    metrics: HeroMetric[];
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
  };
  featuredQuote: string;
  loopSteps: LoopStep[];
  architecture: {
    summary: string;
    categories: ArchitectureCategory[];
  };
  tools: {
    summary: string;
    categories: string[];
    entries: ToolEntry[];
  };
  commands: {
    summary: string;
    categories: string[];
    entries: CommandEntry[];
  };
  memory: {
    summary: string;
    highlights: MemoryHighlight[];
  };
  hiddenFeatures: HiddenFeature[];
  deepDives: DeepDiveMeta[];
};

const fallbackData: SiteData = {
  generatedAt: new Date(0).toISOString(),
  githubRepoUrl: "https://github.com/bozliu/claude-code-public",
  hero: {
    eyebrow: "Repo Explorer",
    title: "Claude Code, mapped from the source.",
    description:
      "A source-backed guide to the agent loop, tools, memory system, commands, and hidden features inside this reverse-engineered repo.",
    metrics: [],
    primaryCta: { label: "Open Explorer", href: "/explore" },
    secondaryCta: { label: "Browse GitHub", href: "https://github.com/bozliu/claude-code-public" },
  },
  featuredQuote:
    "What actually happens when you type a message into Claude Code? This site answers that from the code, not from marketing copy.",
  loopSteps: [],
  architecture: {
    summary:
      "The app layers interactive UI, orchestration, the agent loop, tools, and API services into a terminal-native system.",
    categories: [],
  },
  tools: { summary: "Source-backed tool registry.", categories: [], entries: [] },
  commands: {
    summary: "Slash commands grouped by workflow.",
    categories: [],
    entries: [],
  },
  memory: {
    summary:
      "Memory is implemented as a file-based system: topic files, retrieval, consolidation, and session summaries.",
    highlights: [],
  },
  hiddenFeatures: [],
  deepDives: [],
};

function generatedPath() {
  return path.join(process.cwd(), "lib", "data", "generated", "site-data.json");
}

export const getSiteData = cache(async (): Promise<SiteData> => {
  try {
    const raw = await readFile(generatedPath(), "utf8");
    const parsed = JSON.parse(raw) as SiteData;
    return parsed;
  } catch {
    return fallbackData;
  }
});
