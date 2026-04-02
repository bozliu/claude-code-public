# Claude Code Public

An unofficial, source-backed reconstruction of the Claude Code CLI.

This repository is focused on understanding how the product works in practice: the agent loop, tool surface, slash commands, memory system, permissions model, and feature-gated paths that shape the runtime. It is not affiliated with Anthropic.

## What Is Included

- The reverse-engineered CLI source under [`src/`](./src)
- A standalone Next.js explorer site under [`website/`](./website)
- Bun tests, build scripts, and GitHub Actions CI

Live explorer site:

- [public-rouge-one.vercel.app](https://public-rouge-one.vercel.app)

## Requirements

- [Bun](https://bun.sh/) `>= 1.2.0`
- A valid provider setup if you want to run the CLI against real models

## Local Development

Install root dependencies:

```bash
bun install
```

Run the CLI in development mode:

```bash
bun run dev
```

Build the CLI:

```bash
bun run build
```

Run the explorer site:

```bash
npm --prefix website ci
npm --prefix website run dev
```

Build the explorer site:

```bash
npm --prefix website run build
```

## Validation

Run the same checks used in CI:

```bash
bun run lint
bun test
bun run build
npm --prefix website run build
```

## Repository Layout

- [`src/`](./src): CLI runtime, agent loop, tools, services, and memory
- [`packages/`](./packages): workspace packages used by the CLI
- [`scripts/`](./scripts): maintenance and health-check scripts
- [`website/`](./website): English-first repo explorer site

## Notes

- The codebase intentionally keeps generated build output out of version control.
- The public site is the primary documentation surface for this release.
- Some runtime paths are still reverse-engineered approximations rather than upstream source.
