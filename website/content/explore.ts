export const repoMeta = {
  name: 'Claude Code Repo Explorer',
  tagline: 'A source-backed map of how this CLI thinks, acts, and remembers.',
  repoUrl: 'https://github.com/bozliu/claude-code-public',
  owner: 'bozliu/claude-code-public',
}

const source = (path: string) =>
  `${repoMeta.repoUrl}/blob/main/${path.replace(/^\//, '')}`

const sourceTree = (path: string) =>
  `${repoMeta.repoUrl}/tree/main/${path.replace(/^\//, '')}`

export type ExploreSlug =
  | 'agent-loop'
  | 'architecture'
  | 'tools'
  | 'commands'
  | 'memory'
  | 'hidden-features'

export type SourceRef = {
  label: string
  href: string
}

export type PageSection = {
  heading: string
  body: string
  bullets?: string[]
}

export type ExploreEntry = {
  slug: ExploreSlug
  title: string
  eyebrow: string
  summary: string
  intro: string
  stats: string[]
  sourceRefs: SourceRef[]
  sections: PageSection[]
}

export const heroStats = [
  { label: 'Architecture layers', value: '5' },
  { label: 'Memory types', value: '4' },
  { label: 'Memory index cap', value: '200 / 25KB' },
  { label: 'Primary commands', value: '30+' },
]

export const toolCatalog = [
  {
    category: 'Core execution',
    items: ['Bash', 'Read', 'Grep', 'Glob', 'FileEdit', 'FileWrite'],
  },
  {
    category: 'Agentic interactions',
    items: ['Agent', 'AskUserQuestion', 'Skill', 'TodoWrite', 'TaskList'],
  },
  {
    category: 'External context',
    items: ['WebFetch', 'WebSearch', 'MCP resources', 'MCP tool calls'],
  },
  {
    category: 'Power-user surfaces',
    items: ['Plan mode', 'Resume', 'Rewind', 'Compact', 'Context inspection'],
  },
]

export const commandCatalog = [
  {
    category: 'Workflow',
    items: ['/plan', '/resume', '/rewind', '/compact', '/status'],
  },
  {
    category: 'Memory and context',
    items: ['/memory', '/context', '/summary', '/feedback', '/clear'],
  },
  {
    category: 'Model and setup',
    items: ['/model', '/mcp', '/skills', '/login', '/logout'],
  },
  {
    category: 'Hidden or gated',
    items: ['/buddy', '/proactive', '/brief', '/assistant'],
  },
]

export const featureCatalog = [
  {
    name: 'KAIROS',
    summary: 'Persistent assistant mode with logs, dream, and push-style behavior.',
  },
  {
    name: 'PROACTIVE',
    summary: 'Lets the agent wake itself up and check whether it should act.',
  },
  {
    name: 'COORDINATOR_MODE',
    summary: 'Turns the main agent into a task coordinator for sub-agents.',
  },
  {
    name: 'BRIDGE_MODE',
    summary: 'Exposes the CLI through a remote control bridge.',
  },
  {
    name: 'EXTRACT_MEMORIES',
    summary: 'Runs memory extraction as a background forked sub-agent.',
  },
  {
    name: 'TOKEN_BUDGET',
    summary: 'Adds turn-level token budget nudges and cut-offs.',
  },
  {
    name: 'BUDDY',
    summary: 'An internal mascot-style feature for the terminal UI.',
  },
]

export const exploreEntries: ExploreEntry[] = [
  {
    slug: 'agent-loop',
    title: 'Agent Loop',
    eyebrow: 'Turn engine',
    summary:
      'The repeatable think-act-observe loop that turns one prompt into a source-grounded sequence of actions.',
    intro:
      'This repo is not a single-shot chat app. It is a looped system: prepare the prompt, stream a model response, execute tools, absorb the result, and decide whether the turn should continue. That loop is the difference between “answering” and “working.”',
    stats: ['Streaming-first', 'Tool-aware', 'Stop-hook driven'],
    sourceRefs: [
      {
        label: 'Source: processSlashCommand.tsx',
        href: source('src/utils/processUserInput/processSlashCommand.tsx'),
      },
      { label: 'Source: query.ts', href: source('src/query.ts') },
      { label: 'Source: QueryEngine.ts', href: source('src/QueryEngine.ts') },
      {
        label: 'Source: claude.ts',
        href: source('src/services/api/claude.ts'),
      },
    ],
    sections: [
      {
        heading: 'A turn is a control system, not a chat bubble',
        body:
          'The loop starts before the model sees anything. The runtime trims context, applies session state, and builds a prompt that already knows about memory, tools, and the current operating mode. The model response is only one stage in that pipeline.',
        bullets: [
          'Input shaping happens before the API request is sent.',
          'Tool results are folded back into the conversation instead of appended as noise.',
          'Stop hooks and recovery paths decide whether the turn ends or re-enters the loop.',
        ],
      },
      {
        heading: 'Why engineers should care',
        body:
          'If you are tracing behavior, the loop is where you learn whether the agent is truly grounded. Every extra pass should come from new evidence, not from the same prompt running again with no state change.',
        bullets: [
          'The loop explains why file reads and command output matter more than prompt cleverness.',
          'Failures are first-class, because the agent can observe and retry.',
          'The loop is the cleanest place to instrument latency, tool usage, and prompt shape.',
        ],
      },
      {
        heading: 'What to watch in source',
        body:
          'Follow one turn end to end and you will see the architecture clearly: user input enters the engine, query code streams the assistant response, tools fire, and the next state is assembled from those observations.',
        bullets: [
          'Start in the query path, not in the UI.',
          'Watch where assistant content turns into tool calls.',
          'Trace the places where a turn can be compacted, truncated, or resumed.',
        ],
      },
    ],
  },
  {
    slug: 'architecture',
    title: 'Architecture',
    eyebrow: 'Five layers',
    summary:
      'A map of the CLI front door, orchestration core, turn loop, tool surface, and API transport.',
    intro:
      'The repo is organized like a compact operating system for coding tasks. The terminal surface collects intent, the orchestration layer manages a session, the loop executes turns, the tool layer performs side effects, and the API layer streams model output back into the system.',
    stats: ['5 layers', 'CLI-first', 'Streaming transport'],
    sourceRefs: [
      { label: 'Source: cli entrypoint', href: source('src/entrypoints/cli.tsx') },
      { label: 'Source: REPL screen', href: source('src/screens/REPL.tsx') },
      { label: 'Source: context.ts', href: source('src/context.ts') },
      { label: 'Source: tools.ts', href: source('src/tools.ts') },
    ],
    sections: [
      {
        heading: 'The shape of the stack',
        body:
          'The stack is intentionally small enough to hold in your head: UI, session orchestration, loop execution, tool dispatch, and transport. That separation keeps the CLI responsive while the model is busy.',
        bullets: [
          'The REPL owns the visible interaction surface.',
          'QueryEngine owns the session timeline and persistence.',
          'Tool and transport boundaries keep the action layer swappable.',
        ],
      },
      {
        heading: 'Why this layout works',
        body:
          'The system favors readable boundaries over maximal abstraction. Each layer is easy to inspect, but the user still experiences one continuous agentic flow.',
        bullets: [
          'The front door stays simple even when the backend is doing a lot.',
          'The architecture is easy to reason about during debugging.',
          'The boundaries align with the points where permissions and context can change.',
        ],
      },
      {
        heading: 'How to navigate the codebase',
        body:
          'The best route through the repo is linear: start with the entrypoint, follow the session manager, then trace the loop until you hit the tool registry and API client. That path explains most surprising behavior faster than jumping between features.',
        bullets: [
          'Look for the smallest path that goes from input to output.',
          'Keep an eye on where state is persisted versus recomputed.',
          'Use source links and runtime traces together instead of trusting a single description.',
        ],
      },
    ],
  },
  {
    slug: 'tools',
    title: 'Tools',
    eyebrow: 'The agent’s hands',
    summary:
      'How the CLI exposes file, shell, search, and external integrations as a permissioned capability surface.',
    intro:
      'Tools are the action layer. They let Claude Code read files, edit them, run commands, inspect search results, and call into external systems. The important part is not the list itself, but the fact that the registry is filtered before the model ever sees it.',
    stats: ['Shell + file ops', 'MCP-aware', 'Permission filtered'],
    sourceRefs: [
      { label: 'Source: tools.ts', href: source('src/tools.ts') },
      { label: 'Source: Tool.ts', href: source('src/Tool.ts') },
      {
        label: 'Source: FileReadTool.ts',
        href: source('src/tools/FileReadTool/FileReadTool.ts'),
      },
      {
        label: 'Source: BashTool.tsx',
        href: source('src/tools/BashTool/BashTool.tsx'),
      },
    ],
    sections: [
      {
        heading: 'Tools are contracts',
        body:
          'Each tool is a contract between the model and the runtime. The model can ask for an action, but the runtime decides whether that action is available, safe, and scoped correctly for the current session.',
        bullets: [
          'Core tools cover file reads, writes, search, and shell execution.',
          'Agentic tools add task management and question-asking behaviors.',
          'MCP tools extend the system into external services without flattening everything into one API.',
        ],
      },
      {
        heading: 'The boundary that matters',
        body:
          'This is where real-world trust is enforced. A tool request is only useful if the runtime validates it before anything irreversible happens. That validation layer is what keeps the loop honest.',
        bullets: [
          'Availability is contextual, not global.',
          'Permission checks happen before side effects.',
          'Search and read tools keep the model anchored to local evidence.',
        ],
      },
      {
        heading: 'Reading the registry',
        body:
          'For code explorers, the registry is more interesting than the names. It shows which capabilities are surfaced by default, which ones are gated, and how the system adapts when external context is plugged in.',
        bullets: [
          'Start with registry shape, not invocation syntax.',
          'Inspect the metadata that hides or reveals whole tool families.',
          'Notice how permission state changes the prompt surface.',
        ],
      },
    ],
  },
  {
    slug: 'commands',
    title: 'Commands',
    eyebrow: 'Operator surfaces',
    summary:
      'Slash commands as the control plane around the same agentic engine, grouped by intent instead of implementation detail.',
    intro:
      'Slash commands are the operator interface. They do not replace the loop; they steer it. Commands tune the session, expose memory and context, switch modes, and open up workflows that would be noisy if they lived in the main conversation path.',
    stats: ['Workflow commands', 'State commands', 'Hidden switches'],
    sourceRefs: [
      { label: 'Source: commands.ts', href: source('src/commands.ts') },
      { label: 'Source: command registry', href: sourceTree('src/commands') },
      {
        label: 'Source: slash interception',
        href: source('src/utils/processUserInput/processSlashCommand.tsx'),
      },
    ],
    sections: [
      {
        heading: 'Commands sit above the loop',
        body:
          'A command is a control decision, not a separate product feature. Some commands change model settings, some inspect current state, and some trigger special workflows that would otherwise be awkward to express as a normal prompt.',
        bullets: [
          'Workflow commands move you between states.',
          'Inspection commands expose memory, model, and context details.',
          'Gated commands reveal internal or experimental pathways.',
        ],
      },
      {
        heading: 'Why intent-based grouping helps',
        body:
          'Engineers browsing a large command set care more about what each command is for than where it lives in the source tree. A clean catalog should help someone answer “what do I use here?” before they ever ask “how is this implemented?”',
        bullets: [
          'Group by operator intent, not by folder name.',
          'Keep source links close to each cluster.',
          'Make hidden or gated behavior obvious enough to avoid guesswork.',
        ],
      },
      {
        heading: 'What this page should teach',
        body:
          'The interesting part is the control surface around the loop. Once you see how commands change session behavior, the rest of the repo becomes easier to read because you know where operators can intervene.',
        bullets: [
          'Commands are a way to shape the same engine, not bypass it.',
          'The catalog should be skimmable in seconds.',
          'Every command family should map back to a source file or registry entry.',
        ],
      },
    ],
  },
  {
    slug: 'memory',
    title: 'Memory',
    eyebrow: 'Persistent context',
    summary:
      'The file-based memory stack that keeps context visible, inspectable, and easy to consolidate.',
    intro:
      'Memory in this repo is intentionally file-based. `MEMORY.md` acts as the index, memory files hold the durable content, session memory compresses the live conversation, and background agents consolidate what should survive into the next turn.',
    stats: ['4 memory types', 'Session memory', 'Dream consolidation'],
    sourceRefs: [
      { label: 'Source: memdir.ts', href: source('src/memdir/memdir.ts') },
      { label: 'Source: memory types', href: source('src/memdir/memoryTypes.ts') },
      { label: 'Source: memory scan', href: source('src/memdir/memoryScan.ts') },
      {
        label: 'Source: SessionMemory',
        href: source('src/services/SessionMemory/sessionMemory.ts'),
      },
    ],
    sections: [
      {
        heading: 'A deliberate memory stack',
        body:
          'The design splits memory into a small set of readable file types instead of hiding it inside a database or a vector layer. That makes the system easier to debug and much easier to reason about during a real agent turn.',
        bullets: [
          '`MEMORY.md` is the index, not the memory itself.',
          'Feedback memory records both corrections and validated wins.',
          'Session memory keeps the current conversation compact and available.',
        ],
      },
      {
        heading: 'Why the file-based choice matters',
        body:
          'This tradeoff favors transparency over magical retrieval. You can inspect the files, diff them, and understand what the agent was told without needing special infrastructure.',
        bullets: [
          'Grep and file reads are enough to investigate most memory behavior.',
          'Consolidation happens as explicit work, not hidden background magic.',
          'The agent stays grounded in the same repo that defines it.',
        ],
      },
      {
        heading: 'What engineers should notice',
        body:
          'The memory system is really about shaping which context survives the next turn. That includes negative feedback, positive confirmation, and any distilled lesson that should become part of the agent’s operating habits.',
        bullets: [
          'Not all memory is recall; some of it is behavior shaping.',
          'Consolidation is the bridge between raw conversation and reusable knowledge.',
          'The simple storage format is a feature, not a limitation.',
        ],
      },
    ],
  },
  {
    slug: 'hidden-features',
    title: 'Hidden Features',
    eyebrow: 'Gated capability map',
    summary:
      'A source-backed view of the flags and subsystems that hint at where the product is headed.',
    intro:
      'This section is where the repo stops looking like a terminal utility and starts looking like a platform. Feature flags reveal persistent assistants, remote bridges, proactive behavior, coordinator modes, and playful UX experiments that are not always exposed to every user.',
    stats: ['Gated subsystems', 'Feature flags', 'Forward-looking'],
    sourceRefs: [
      {
        label: 'Source: GrowthBook',
        href: source('src/services/analytics/growthbook.ts'),
      },
      { label: 'Source: main.tsx', href: source('src/main.tsx') },
      { label: 'Source: commands.ts', href: source('src/commands.ts') },
      {
        label: 'Source: bridgeMain.ts',
        href: source('src/bridge/bridgeMain.ts'),
      },
    ],
    sections: [
      {
        heading: 'Flags as architecture signals',
        body:
          'The flag surface is a map of possible futures. Some flags point at longer-running autonomy, some point at collaboration, and some point at product experiments that make the terminal feel less static.',
        bullets: [
          'KAIROS suggests a persistent assistant mode.',
          'BRIDGE_MODE suggests remote control and external orchestration.',
          'COORDINATOR_MODE suggests a task-division layer around the core agent.',
          'BUDDY suggests the team is willing to make the UI feel alive.',
        ],
      },
      {
        heading: 'How to read them safely',
        body:
          'These should be framed as source-backed signals, not promises. A clean explorer site should make it obvious which capabilities are active, which are gated, and which are only hinting at a future direction.',
        bullets: [
          'Always show the gate or feature name next to the claim.',
          'Avoid over-interpreting experimental flags as product guarantees.',
          'Use the section to connect present behavior with likely next steps.',
        ],
      },
      {
        heading: 'Why this chapter belongs here',
        body:
          'Understanding the hidden surface helps explain why the rest of the repo is shaped the way it is. You can see the product bias, the collaboration model, and the engineering choices that keep the system extensible.',
        bullets: [
          'Hidden features reveal the product’s direction of travel.',
          'The explorer should make gated paths discoverable without sensationalizing them.',
          'Source links keep the chapter grounded in code, not rumor.',
        ],
      },
    ],
  },
]

export function getExploreEntry(slug: ExploreSlug) {
  return exploreEntries.find(entry => entry.slug === slug)
}

export const exploreSlugs = exploreEntries.map(entry => entry.slug)
