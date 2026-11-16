# Agent Kit

This folder contains the complete rulebook for AI agents working on flix-yourself-template.

## What is this?

Flix-yourself-template is a configurable Netflix-like streaming platform template. It's designed to be customized for personal content (couple videos, family memories, travel footage, etc.) without forking the codebase.

## Agent Documentation

Read these files **in order** before starting work:

### 1. [commit-and-pr.md](commit-and-pr.md)
Learn the commit format, branch naming conventions, PR workflow, and changeset requirements.

### 2. [definition-of-done.md](definition-of-done.md)
The checklist you must complete before considering any task finished.

### 3. [conventions.md](conventions.md)
Core architectural principles: DRY, pluggable architecture, configuration over code editing.

### 4. [config-options.md](config-options.md)
**The most important file**. Complete documentation of every configuration option the template supports. Read this before making ANY architectural decisions.

## Why These Rules?

This template is designed to be:
- **Configurable**: Users customize through config, not by editing source code
- **Maintainable**: Updates flow downstream without breaking customizations
- **Pluggable**: Swap databases, auth providers, storage backends through configuration
- **Agent-friendly**: Clear rules for AI agents to follow

## Template Philosophy

Think of this as a **framework, not a starting point**. Users don't fork it—they configure it. Your job as an agent is to:
1. Keep the codebase flexible and configurable
2. Add new features behind configuration options
3. Never hard-code choices users might want to change
4. Document every config option in `config-options.md`

## Quick Reference

- Main branch is protected
- All work happens on feature branches
- Conventional Commits required
- Changesets required for user-facing changes
- TypeScript, Prisma (only ORM), Next.js, Tailwind
- Dark Netflix-style UI (no theme choice)
- Database/auth/storage/deployment are all pluggable via config
