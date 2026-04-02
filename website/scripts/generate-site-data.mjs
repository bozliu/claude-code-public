import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(websiteRoot, "..");

const repoUrl = "https://github.com/bozliu/claude-code-public";

const toolSummaryOverrides = {
  AgentTool: "Spawn or delegate work to sub-agents inside the same task loop.",
  AskUserQuestionTool: "Pause and ask the user for a structured clarification when needed.",
  BashTool: "Run shell commands in the working directory with permission checks.",
  BriefTool: "Send a short checkpoint-style update back to the user.",
  ConfigTool: "Inspect or change runtime configuration from inside the session.",
  CtxInspectTool: "Inspect context-collapse state and prompt composition internals.",
  EnterPlanModeTool: "Switch the session into a planning-first operating mode.",
  ExitPlanModeV2Tool: "Leave plan mode and return to normal execution.",
  FileEditTool: "Patch existing files with scoped edits instead of full rewrites.",
  FileReadTool: "Read files with line-aware truncation, PDF handling, and attachment logic.",
  FileWriteTool: "Create or fully rewrite files in the working tree.",
  GlobTool: "Find files by path pattern when direct reads are too narrow.",
  GrepTool: "Search source text across the repo with grep-style matching.",
  ListMcpResourcesTool: "Inspect structured resources exposed by MCP servers.",
  LSPTool: "Ask language-server tooling for code intelligence when enabled.",
  NotebookEditTool: "Edit notebook files as a first-class artifact.",
  PowerShellTool: "Run PowerShell commands when that shell surface is enabled.",
  ReadMcpResourceTool: "Read one MCP resource payload directly into the turn.",
  REPLTool: "Use the Ant-only REPL tool surface when present.",
  SkillTool: "Invoke a skill workflow without leaving the current conversation.",
  SnipTool: "Manually snip conversation history when collapse features are enabled.",
  TaskCreateTool: "Create a tracked task item inside Todo v2 mode.",
  TaskGetTool: "Inspect a single tracked task item.",
  TaskListTool: "List tracked tasks in the current session.",
  TaskOutputTool: "Return a structured task result back into the loop.",
  TaskStopTool: "Mark a subtask as complete and end its execution path.",
  TaskUpdateTool: "Update tracked task state from inside the loop.",
  TerminalCaptureTool: "Capture visible terminal output for reasoning or review.",
  TodoWriteTool: "Maintain the lightweight todo list used during complex tasks.",
  ToolSearchTool: "Search the tool registry when the model needs discovery help.",
  TungstenTool: "Surface Anthropic-internal Tungsten capabilities in Ant builds.",
  WebBrowserTool: "Use the built-in browser surface when that experimental flag is on.",
  WebFetchTool: "Fetch and inspect a specific web page or URL.",
  WebSearchTool: "Search the web from inside the current turn.",
  WorkflowTool: "Run packaged workflow scripts through the tool layer.",
};

const featureSummaryOverrides = {
  AGENT_TRIGGERS_REMOTE: "Lets remote triggers wake or continue agents through a network path.",
  BUDDY: "Enables the mascot-style /buddy command and its terminal pet behavior.",
  BRIDGE_MODE: "Exposes a remote-control bridge for the CLI surface.",
  COORDINATOR_MODE: "Turns the main agent into a delegating coordinator for sub-agents.",
  CONTEXT_COLLAPSE: "Adds collapse, inspection, and withheld-context machinery to long sessions.",
  DAEMON: "Supports long-running daemon-style services used by bridge features.",
  EXTRACT_MEMORIES: "Runs post-turn memory extraction through a forked sub-agent.",
  EXPERIMENTAL_SKILL_SEARCH: "Adds local skill indexing and search helpers.",
  FORK_SUBAGENT: "Surfaces a user-facing command for explicitly forking a sub-agent.",
  KAIROS: "Bundles assistant mode, background behavior, dream work, and user messaging flows.",
  KAIROS_BRIEF: "Adds brief-only assistant checkpoints without full Kairos mode.",
  KAIROS_GITHUB_WEBHOOKS: "Lets assistant mode subscribe to GitHub pull-request events.",
  MONITOR_TOOL: "Enables monitoring-oriented tooling in the registry.",
  PROACTIVE: "Allows the agent to wake itself up and decide whether it should act.",
  TERMINAL_PANEL: "Adds terminal capture and panel support to the UI and tool layer.",
  TOKEN_BUDGET: "Injects budget tracking and turn-level cost controls into the loop.",
  UDS_INBOX: "Adds peer discovery and Unix-domain inbox messaging.",
  ULTRAPLAN: "Enables a more opinionated /ultraplan planning surface.",
  VOICE_MODE: "Adds voice-driven command and interaction paths.",
  WEB_BROWSER_TOOL: "Exposes an experimental browser tool directly in the registry.",
  WORKFLOW_SCRIPTS: "Turns packaged workflow scripts into callable commands and tools.",
};

const toolCategoryOrder = [
  "File operations",
  "Execution",
  "Search & fetch",
  "Agents & tasks",
  "Planning",
  "MCP",
  "System",
  "Experimental",
];

const commandCategoryOrder = [
  "Setup & config",
  "Daily workflow",
  "Code review & git",
  "Debugging & diagnostics",
  "Advanced & experimental",
];

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootDir) {
  const output = [];

  async function visit(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else {
        output.push(absolutePath);
      }
    }
  }

  await visit(rootDir);
  return output;
}

function githubUrl(relativePath) {
  return `${repoUrl}/blob/main/${toPosix(relativePath)}`;
}

function humanizeCamelCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\bMcp\b/g, "MCP")
    .replace(/\bCtx\b/g, "Context")
    .replace(/\bRepl\b/g, "REPL");
}

function displayToolName(className) {
  const raw = className.replace(/Tool$/, "");
  const overrides = {
    AskUserQuestion: "AskUserQuestion",
    ExitPlanModeV2: "ExitPlanMode",
    FileEdit: "Edit",
    FileRead: "Read",
    FileWrite: "Write",
    ListMcpResources: "ListMcpResources",
    ReadMcpResource: "ReadMcpResource",
    TaskOutput: "TaskOutput",
    TaskStop: "TaskStop",
    TodoWrite: "TodoWrite",
    WebFetch: "WebFetch",
    WebSearch: "WebSearch",
  };
  return overrides[raw] ?? raw;
}

function toolCategoryFromName(className) {
  if (/FileRead|FileEdit|FileWrite|Glob|Grep|NotebookEdit/.test(className)) {
    return "File operations";
  }
  if (/Bash|PowerShell|REPL/.test(className)) {
    return "Execution";
  }
  if (/WebBrowser|WebFetch|WebSearch|ToolSearch|LSP/.test(className)) {
    return "Search & fetch";
  }
  if (/Agent|Task|Team|SendMessage|ListPeers/.test(className)) {
    return "Agents & tasks";
  }
  if (/EnterPlanMode|ExitPlanMode|EnterWorktree|ExitWorktree|VerifyPlanExecution/.test(className)) {
    return "Planning";
  }
  if (/Mcp/.test(className)) {
    return "MCP";
  }
  if (/AskUserQuestion|TodoWrite|Skill|Config|RemoteTrigger|Cron|Snip|Workflow|TerminalCapture|Brief/.test(className)) {
    return "System";
  }
  if (/Sleep|SendUserFile|PushNotification|Monitor|SubscribePR|Tungsten|OverflowTest|CtxInspect|TestingPermission/.test(className)) {
    return "Experimental";
  }
  return "System";
}

function commandCategory(name) {
  if (
    [
      "init",
      "login",
      "logout",
      "config",
      "permissions",
      "model",
      "theme",
      "terminal-setup",
      "doctor",
      "mcp",
      "hooks",
      "chrome",
      "mobile",
      "desktop",
      "sandbox",
      "sandbox-toggle",
      "remote-env",
      "output-style",
      "color",
      "vim",
      "keybindings",
      "effort",
      "rate-limit-options",
      "upgrade",
    ].includes(name)
  ) {
    return "Setup & config";
  }
  if (
    [
      "compact",
      "memory",
      "context",
      "plan",
      "resume",
      "session",
      "files",
      "add-dir",
      "copy",
      "export",
      "summary",
      "clear",
      "brief",
      "skills",
      "tasks",
      "agents",
      "fast",
      "extra-usage",
      "tag",
      "rename",
      "help",
      "exit",
      "passes",
    ].includes(name)
  ) {
    return "Daily workflow";
  }
  if (
    [
      "review",
      "commit",
      "commit-push-pr",
      "diff",
      "pr_comments",
      "pr-comments",
      "branch",
      "issue",
      "security-review",
      "autofix-pr",
      "share",
      "install-github-app",
      "install-slack-app",
      "release-notes",
    ].includes(name)
  ) {
    return "Code review & git";
  }
  if (
    [
      "status",
      "stats",
      "cost",
      "usage",
      "version",
      "feedback",
      "think-back",
      "thinkback-play",
      "rewind",
      "ctx_viz",
      "debug-tool-call",
      "perf-issue",
      "heapdump",
      "ant-trace",
      "backfill-sessions",
      "break-cache",
      "bridge-kick",
      "mock-limits",
      "oauth-refresh",
      "reset-limits",
      "env",
      "bughunter",
      "insights",
    ].includes(name)
  ) {
    return "Debugging & diagnostics";
  }
  return "Advanced & experimental";
}

async function resolveTsSource(relativeWithoutExtension) {
  const candidates = [
    `${relativeWithoutExtension}.ts`,
    `${relativeWithoutExtension}.tsx`,
    path.join(relativeWithoutExtension, "index.ts"),
    path.join(relativeWithoutExtension, "index.tsx"),
  ];

  for (const candidate of candidates) {
    const absoluteCandidate = path.join(repoRoot, candidate);
    if (await exists(absoluteCandidate)) {
      return toPosix(candidate);
    }
  }

  return toPosix(`${relativeWithoutExtension}.ts`);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function collectTools() {
  const filePath = path.join(repoRoot, "src", "tools.ts");
  const content = await readFile(filePath, "utf8");
  const found = [];
  const matchers = [
    /import\s+\{\s*(\w+Tool)\s*\}\s+from\s+'\.\/(tools\/[^']+?)\.js'/g,
    /require\('\.\/(tools\/[^']+?)\.js'\)\.(\w+Tool)/g,
  ];

  for (const matcher of matchers) {
    for (const match of content.matchAll(matcher)) {
      const className = matcher === matchers[0] ? match[1] : match[2];
      const importPath = matcher === matchers[0] ? match[2] : match[1];
      if (!className.endsWith("Tool")) {
        continue;
      }
      found.push({ className, importPath: `src/${importPath}` });
    }
  }

  const entries = [];
  for (const item of uniqueBy(found, (entry) => entry.className)) {
    const sourcePath = await resolveTsSource(item.importPath);
    const name = displayToolName(item.className);
    entries.push({
      name,
      category: toolCategoryFromName(item.className),
      sourcePath,
      githubUrl: githubUrl(sourcePath),
      summary:
        toolSummaryOverrides[item.className] ??
        `${humanizeCamelCase(name)} is exposed through the tool registry for agent execution.`,
    });
  }

  const categories = toolCategoryOrder.filter((category) =>
    entries.some((entry) => entry.category === category),
  );
  return {
    categories,
    entries: entries.sort((left, right) => left.name.localeCompare(right.name)),
  };
}

async function collectCommands() {
  const filePath = path.join(repoRoot, "src", "commands.ts");
  const content = await readFile(filePath, "utf8");
  const imports = new Map();

  for (const match of content.matchAll(/import\s+([^;]+?)\s+from\s+'\.\/(commands\/[^']+?)\.js'/g)) {
    const importSpec = match[1];
    const sourcePath = `src/${match[2]}`;
    const defaultMatch = importSpec.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (defaultMatch) {
      imports.set(defaultMatch[1], sourcePath);
    }
    const namedMatch = importSpec.match(/\{([^}]+)\}/);
    if (namedMatch) {
      for (const rawName of namedMatch[1].split(",")) {
        const cleanName = rawName.trim().split(/\s+as\s+/)[0];
        if (cleanName) {
          imports.set(cleanName, sourcePath);
        }
      }
    }
  }

  for (const match of content.matchAll(/const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*[\s\S]*?require\('\.\/(commands\/[^']+?)\.js'\)/g)) {
    imports.set(match[1], `src/${match[2]}`);
  }

  const commandsBodyMatch = content.match(/const COMMANDS = memoize\(\(\): Command\[\] => \[([\s\S]*?)\]\)/);
  const includedVars = new Set();
  if (commandsBodyMatch) {
    const body = commandsBodyMatch[1];
    for (const match of body.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/gm)) {
      includedVars.add(match[1]);
    }
    for (const match of body.matchAll(/\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]/g)) {
      includedVars.add(match[1]);
    }
    for (const match of body.matchAll(/login\(\)/g)) {
      includedVars.add("login");
    }
  }

  const entries = [];

  for (const variableName of includedVars) {
    const relativePath = imports.get(variableName);
    if (!relativePath) {
      continue;
    }

    const sourcePath = await resolveTsSource(relativePath);
    const absolutePath = path.join(repoRoot, sourcePath);
    let commandName = variableName.replace(/Command$/, "");
    let description = "Built-in command exposed through the REPL command registry.";

    if (await exists(absolutePath)) {
      const commandSource = await readFile(absolutePath, "utf8");
      const scopedNamePattern = new RegExp(
        `${variableName}[\\s\\S]{0,500}?name:\\s*['"]([^'"]+)['"]`,
      );
      const scopedDescriptionPattern = new RegExp(
        `${variableName}[\\s\\S]{0,700}?description:\\s*['"]([^'"]+)['"]`,
      );
      const nameMatch =
        commandSource.match(scopedNamePattern) ??
        commandSource.match(/name:\s*['"]([^'"]+)['"]/);
      const descriptionMatch =
        commandSource.match(scopedDescriptionPattern) ??
        commandSource.match(/description:\s*['"]([^'"]+)['"]/);
      if (nameMatch) {
        commandName = nameMatch[1];
      }
      if (descriptionMatch) {
        description = descriptionMatch[1];
      }
    }

    entries.push({
      name: `/${commandName}`,
      category: commandCategory(commandName),
      summary: description,
      sourcePath,
      githubUrl: githubUrl(sourcePath),
    });
  }

  const uniqueEntries = uniqueBy(entries, (entry) => entry.name);
  uniqueEntries.sort((left, right) => left.name.localeCompare(right.name));

  return {
    categories: commandCategoryOrder.filter((category) =>
      uniqueEntries.some((entry) => entry.category === category),
    ),
    entries: uniqueEntries,
  };
}

async function collectFeatures() {
  const sourceFiles = (await walkFiles(path.join(repoRoot, "src"))).filter((filePath) =>
    /\.(ts|tsx|js|jsx)$/.test(filePath),
  );
  const usage = new Map();

  for (const absolutePath of sourceFiles) {
    const content = await readFile(absolutePath, "utf8");
    for (const match of content.matchAll(/feature\('([^']+)'\)/g)) {
      const name = match[1];
      const relativePath = toPosix(path.relative(repoRoot, absolutePath));
      const existing = usage.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        usage.set(name, { count: 1, sourcePath: relativePath });
      }
    }
  }

  const featuredNames = [
    "KAIROS",
    "PROACTIVE",
    "COORDINATOR_MODE",
    "BRIDGE_MODE",
    "EXTRACT_MEMORIES",
    "TOKEN_BUDGET",
    "BUDDY",
    "WORKFLOW_SCRIPTS",
  ];

  return {
    distinctFeatureCount: usage.size,
    entries: featuredNames
      .filter((name) => usage.has(name))
      .map((name) => {
        const details = usage.get(name);
        return {
          name,
          gate: `feature('${name}')`,
          summary:
            featureSummaryOverrides[name] ??
            `Feature-gated behavior with ${details.count} source references in the repo.`,
          sourcePath: details.sourcePath,
          githubUrl: githubUrl(details.sourcePath),
        };
      }),
  };
}

async function collectArchitecture() {
  const sourceFiles = (await walkFiles(path.join(repoRoot, "src"))).filter((filePath) =>
    /\.(ts|tsx)$/.test(filePath),
  );
  const relativePaths = sourceFiles.map((filePath) => toPosix(path.relative(repoRoot, filePath)));

  const bucketConfigs = [
    {
      name: "Terminal surface",
      summary:
        "Entrypoints, screens, and UI state compose the visible CLI shell before any model call happens.",
      matchers: ["src/entrypoints/", "src/screens/", "src/main.tsx", "src/state/"],
    },
    {
      name: "Orchestration core",
      summary:
        "QueryEngine, query.ts, and input processing coordinate one running session across many turns.",
      matchers: ["src/QueryEngine.ts", "src/query.ts", "src/context.ts", "src/utils/processUserInput/"],
    },
    {
      name: "Tool surface",
      summary:
        "The tool registry, tool definitions, and concrete tool implementations turn model intent into action.",
      matchers: ["src/tools.ts", "src/Tool.ts", "src/tools/"],
    },
    {
      name: "Memory & context",
      summary:
        "File-backed memory, retrieval, compaction, and attachment shaping keep long sessions usable.",
      matchers: ["src/memdir/", "src/utils/attachments.ts", "src/context.ts"],
    },
    {
      name: "Services & extensions",
      summary:
        "Transport, analytics, plugins, skills, and commands extend the core loop into a full product surface.",
      matchers: ["src/services/", "src/plugins/", "src/skills/", "src/commands.ts", "src/commands/"],
    },
  ];

  const buckets = bucketConfigs.map((bucket) => ({
    ...bucket,
    samplePaths: [],
    count: 0,
  }));

  for (const relativePath of relativePaths) {
    const bucket = buckets.find((candidate) =>
      candidate.matchers.some((matcher) => relativePath.startsWith(matcher)),
    );
    if (!bucket) {
      continue;
    }
    bucket.count += 1;
    if (bucket.samplePaths.length < 4) {
      bucket.samplePaths.push(relativePath);
    }
  }

  return {
    summary:
      "The repo behaves like a compact operating system for coding work: terminal shell, orchestration, turn loop, tool execution, and supporting services.",
    categories: buckets.map(({ matchers, ...rest }) => rest),
  };
}

async function collectRepoMetrics(toolCount, commandCount, featureCount, deepDiveCount) {
  const sourceFiles = (await walkFiles(path.join(repoRoot, "src"))).filter((filePath) =>
    /\.(ts|tsx)$/.test(filePath),
  );

  let sourceLines = 0;
  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, "utf8");
    sourceLines += content.split("\n").length;
  }

  return [
    {
      label: "Source files",
      value: String(sourceFiles.length),
      detail: `${sourceLines.toLocaleString("en-US")} lines across src/`,
    },
    {
      label: "Tools in registry",
      value: String(toolCount),
      detail: "Parsed from src/tools.ts",
    },
    {
      label: "Slash commands",
      value: String(commandCount),
      detail: "Parsed from src/commands.ts",
    },
    {
      label: "Feature gates",
      value: String(featureCount),
      detail: `${deepDiveCount} explorer deep dives in /website`,
    },
  ];
}

function buildLoopSteps() {
  return [
    {
      step: 1,
      title: "Shape the input",
      summary: "User input is normalized, slash commands are intercepted, and session state is folded into the outgoing prompt.",
      sourcePath: "src/utils/processUserInput/processSlashCommand.tsx",
      githubUrl: githubUrl("src/utils/processUserInput/processSlashCommand.tsx"),
      detail:
        "This is where raw terminal input stops being just text. The runtime can rewrite it, attach context, and divert slash commands before the model sees a single token.",
    },
    {
      step: 2,
      title: "Enter QueryEngine",
      summary: "The session manager prepares prompt state, memory context, transcript persistence, and query options for one turn.",
      sourcePath: "src/QueryEngine.ts",
      githubUrl: githubUrl("src/QueryEngine.ts"),
      detail:
        "QueryEngine is the session spine. It owns enough state to make retries, compaction, and persistence feel like one continuous conversation rather than disconnected API calls.",
    },
    {
      step: 3,
      title: "Stream the model turn",
      summary: "The query loop streams assistant content, tool calls, and stop signals while deciding whether another pass is needed.",
      sourcePath: "src/query.ts",
      githubUrl: githubUrl("src/query.ts"),
      detail:
        "The repo’s agentic feel comes from this loop. Tool calls, failures, retries, and budget logic all show up here as visible control flow rather than invisible magic.",
    },
    {
      step: 4,
      title: "Ground with tools",
      summary: "Tool calls read files, search the repo, execute commands, or reach external systems before the answer continues.",
      sourcePath: "src/tools.ts",
      githubUrl: githubUrl("src/tools.ts"),
      detail:
        "The runtime decides which capabilities exist for this turn. That filtering is what makes the answer evidence-backed instead of a clever but ungrounded guess.",
    },
    {
      step: 5,
      title: "Persist memory",
      summary: "Session summaries and file-backed memories capture the useful part of the turn for later retrieval and consolidation.",
      sourcePath: "src/memdir/memdir.ts",
      githubUrl: githubUrl("src/memdir/memdir.ts"),
      detail:
        "Memory is not treated as a giant external database here. It is a lightweight anti-forgetting layer that keeps the loop coherent across debugging, editing, and retries.",
    },
  ];
}

function buildMemoryHighlights() {
  return [
    {
      title: "Session transcripts act as episodic memory",
      summary:
        "Every turn is persisted so the repo can reconstruct what happened, not just what the latest prompt says.",
      githubUrl: githubUrl("src/QueryEngine.ts"),
    },
    {
      title: "SessionMemory distills while the conversation is still live",
      summary:
        "The runtime does lightweight distillation before the session ends, so useful structure is already present when the next turn starts.",
      githubUrl: githubUrl("src/memdir/memdir.ts"),
    },
    {
      title: "extractMemories forks a sub-agent for semantic compression",
      summary:
        "Persistent memories are promoted from dialogue into reusable Markdown files instead of staying trapped in transcript history.",
      githubUrl: githubUrl("src/services/extractMemories/prompts.ts"),
    },
    {
      title: "autoDream consolidates, merges, and prunes",
      summary:
        "Background consolidation keeps the file-based memory set from becoming a pile of repetitive fragments.",
      githubUrl: githubUrl("src/services/autoDream/consolidationPrompt.ts"),
    },
  ];
}

function buildDeepDives() {
  return [
    { slug: "agent-loop", title: "Agent Loop", summary: "Trace one turn end to end.", readingTime: "6 min read" },
    { slug: "architecture", title: "Architecture", summary: "Learn the five-layer stack.", readingTime: "5 min read" },
    { slug: "tools", title: "Tools", summary: "See how capabilities are filtered and surfaced.", readingTime: "5 min read" },
    { slug: "commands", title: "Commands", summary: "Browse the operator-facing slash command surface.", readingTime: "4 min read" },
    { slug: "memory", title: "Memory", summary: "Understand file-based retrieval and consolidation.", readingTime: "5 min read" },
    { slug: "hidden-features", title: "Hidden Features", summary: "Inspect the gated paths shaping the product’s direction.", readingTime: "4 min read" },
  ];
}

async function copyAssets() {
  const publicRoot = path.join(websiteRoot, "public");
  const assetRoot = path.join(publicRoot, "repo-assets");
  await mkdir(assetRoot, { recursive: true });

  const docsRoot = path.join(repoRoot, "docs");
  if (!(await exists(docsRoot))) {
    return;
  }

  const copies = [
    {
      from: path.join(repoRoot, "docs", "favicon.svg"),
      to: path.join(publicRoot, "favicon.svg"),
    },
    {
      from: path.join(repoRoot, "docs", "logo", "light.svg"),
      to: path.join(assetRoot, "logo-light.svg"),
    },
    {
      from: path.join(repoRoot, "docs", "logo", "dark.svg"),
      to: path.join(assetRoot, "logo-dark.svg"),
    },
    {
      from: path.join(repoRoot, "docs", "images", "agentic-loop.png"),
      to: path.join(assetRoot, "agentic-loop.png"),
    },
    {
      from: path.join(repoRoot, "docs", "images", "architecture-layers.png"),
      to: path.join(assetRoot, "architecture-layers.png"),
    },
    {
      from: path.join(repoRoot, "docs", "images", "compaction.png"),
      to: path.join(assetRoot, "compaction.png"),
    },
  ];

  await Promise.all(copies.map((copyJob) => cp(copyJob.from, copyJob.to)));
}

async function main() {
  const generatedFile = path.join(websiteRoot, "lib", "data", "generated", "site-data.json");
  const repoInputsAvailable = await exists(path.join(repoRoot, "src"));

  if (!repoInputsAvailable) {
    if (await exists(generatedFile)) {
      console.log("Repo sources are unavailable; reusing checked-in generated site data.");
      return;
    }

    throw new Error(
      "Repo sources are unavailable and no generated site data is present.",
    );
  }

  await copyAssets();

  const [tools, commands, features, architecture] = await Promise.all([
    collectTools(),
    collectCommands(),
    collectFeatures(),
    collectArchitecture(),
  ]);
  const deepDives = buildDeepDives();

  const metrics = await collectRepoMetrics(
    tools.entries.length,
    commands.entries.length,
    features.distinctFeatureCount,
    deepDives.length,
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    githubRepoUrl: repoUrl,
    hero: {
      eyebrow: "Repo Explorer",
      title: "Claude Code, mapped from the source.",
      description:
        "An English-first explorer for engineers who want the real shape of the reverse-engineered Claude Code repo: how the loop runs, where tools live, how memory persists, and which paths stay hidden behind feature gates.",
      metrics,
      primaryCta: {
        label: "Start with Agent Loop",
        href: "/explore/agent-loop",
      },
      secondaryCta: {
        label: "Browse GitHub",
        href: repoUrl,
      },
    },
    featuredQuote:
      "The most useful question is not “what does this repo claim to do?” It is “what actually happens after one prompt enters the loop?”",
    loopSteps: buildLoopSteps(),
    architecture,
    tools: {
      summary:
        "The tool registry is where the runtime turns model intent into permissioned capability. It shows what the agent can really do in this environment.",
      categories: tools.categories,
      entries: tools.entries,
    },
    commands: {
      summary:
        "Slash commands are the operator control surface. They let you steer planning, context, auth, memory, and diagnostics without leaving the terminal.",
      categories: commands.categories,
      entries: commands.entries,
    },
    memory: {
      summary:
        "This repo treats memory as a file-based execution aid, not a massive external knowledge graph. The goal is to keep useful context alive while the agent iterates.",
      highlights: buildMemoryHighlights(),
    },
    hiddenFeatures: features.entries,
    deepDives,
  };

  const outputDir = path.join(websiteRoot, "lib", "data", "generated");
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "site-data.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Generated site-data.json with ${tools.entries.length} tools, ${commands.entries.length} commands, and ${features.distinctFeatureCount} feature gates.`,
  );
}

await main();
