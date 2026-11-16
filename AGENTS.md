# Agentic Development Rules

This repository uses an agent-first development workflow. All AI coding agents (Claude, Codex, Cursor, etc.) must follow these rules.

## Core Principles

1. **Branch-based workflow**: All changes happen on feature branches, never directly on `main`
2. **Pull Request mandatory**: Every change must go through a PR, even for agents
3. **Protected main branch**: `main` is protected and requires passing CI checks
4. **Conventional Commits**: All commits must follow the Conventional Commits specification
5. **Changesets required**: Every user-facing change needs a changeset file

## Workflow

```
feature branch → commit (conventional) → changeset → PR → CI → review → merge
```

## Documentation Structure

The complete agent rulebook lives in `agent-kit/`:

- **[commit-and-pr.md](agent-kit/commit-and-pr.md)** - Commit format, branch naming, PR workflow, changesets
- **[definition-of-done.md](agent-kit/definition-of-done.md)** - Checklist before marking work complete
- **[conventions.md](agent-kit/conventions.md)** - Architecture principles (DRY, pluggable, seams not forks)
- **[config-options.md](agent-kit/config-options.md)** - Complete configuration reference for the template

## Quick Start for Agents

Before starting work:
1. Read all files in `agent-kit/`
2. Create a feature branch (`feat/`, `fix/`, `docs/`, etc.)
3. Make your changes following conventions
4. Run the definition-of-done checklist
5. Create a changeset if user-facing
6. Open a PR with clear description

## Main Branch Protection

The `main` branch is protected. Direct pushes are blocked. CI must pass:
- Type checking (`pnpm typecheck`)
- Linting (`pnpm lint`)
- Build (`pnpm build`)
- Tests (`pnpm test`)

## Getting Help

If you're an agent and unsure about any workflow step, consult the relevant `agent-kit/` document. These files are your source of truth.
