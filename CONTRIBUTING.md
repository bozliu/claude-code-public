# Contributing

Thanks for contributing.

## Before You Open A PR

1. Install dependencies with `bun install`.
2. If you change the explorer site, also run `npm --prefix website ci`.
3. Run the full validation set:

```bash
bun run lint
bun test
bun run build
npm --prefix website run build
```

## Scope Guidelines

- Keep diffs focused.
- Prefer source-backed claims over speculative commentary.
- Do not commit local secrets, generated build output, or machine-specific files.
- Keep public-facing copy in English.

## Repository Areas

- `src/`: CLI runtime and reverse-engineered implementation details
- `website/`: public explorer site
- `.github/workflows/ci.yml`: GitHub Actions checks

## Pull Requests

- Use a descriptive title.
- Explain what changed and why.
- Link any relevant issue or discussion.
- Include screenshots when the `website/` UI changes materially.
