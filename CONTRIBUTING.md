# Contributing to PostHTML

Thanks for considering contributing! This project is small but active. Here's how to get started.

## Code of Conduct

Be respectful, constructive, and assume good faith. This is a small personal project — treat others how you'd want to be treated.

## How to Contribute

### Report Issues

Open a [GitHub issue](https://github.com/androdotdev/plantodo/issues) with:
- Clear title and description
- Steps to reproduce (if bug)
- Screenshots or terminal output (if applicable)

### Submit Changes

1. **Fork** the repo
2. **Create a branch** — `fix/description` or `feat/description`
3. **Make your changes** — match the existing code style
4. **Test** — ensure existing tests pass (`bun run test`)
5. **Lint** — `bun run lint` should have 0 errors
6. **Open a PR** against `main` — describe what you changed and why

### Development Setup

```bash
git clone git@github.com:androdotdev/plantodo.git
cd plantodo
bun install
bun -C web dev     # start Next.js dev server on :3000
bun run test        # run all tests
bun run lint        # check for lint errors
```

### Style Guide

- TypeScript with strict mode
- Follow the conventions in [`AGENTS.md`](./AGENTS.md)
- Use `import type` for type-only imports
- camelCase variables, PascalCase types
- Design tokens from globals.css — no hardcoded hex values

## PR Checklist

- [ ] Tests pass (`bun run test`)
- [ ] Lint passes (`bun run lint` — 0 errors)
- [ ] No new dependencies without reason
- [ ] Matches existing code style

## Questions?

Open a [discussion](https://github.com/androdotdev/plantodo/discussions) or an issue with the "question" label.
