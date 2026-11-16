# Commit and PR Workflow

## Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (triggers MINOR version bump)
- **fix**: A bug fix (triggers PATCH version bump)
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semi-colons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, or auxiliary tools
- **ci**: Changes to CI configuration files and scripts

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or append `!` after the type:

```
feat!: migrate to new config format

BREAKING CHANGE: config.json is now config.yaml with different schema
```

This triggers a MAJOR version bump.

### Examples

Good commits:
```
feat(auth): add Clerk authentication provider
fix(video): resolve playback stuttering on Safari
docs(readme): add deployment instructions
refactor(db): extract Prisma client to separate module
chore(deps): update Next.js to 14.0.0
```

Bad commits:
```
updated stuff
WIP
fix bug
added feature
```

### Commit Scope (Optional)

Scopes help organize commits:
- `auth` - Authentication and authorization
- `video` - Video playback and streaming
- `db` - Database and data layer
- `ui` - User interface components
- `config` - Configuration system
- `storage` - Media storage backends
- `admin` - Admin dashboard
- `api` - API routes and endpoints

## Branch Naming

Create feature branches with descriptive names matching your commit type:

### Format
```
<type>/<short-description>
```

### Examples
```
feat/clerk-auth-provider
fix/safari-video-playback
docs/deployment-guide
refactor/prisma-client-extraction
chore/nextjs-upgrade
```

### Branch Lifecycle

1. **Create branch** from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/my-feature
   ```

2. **Make commits** following Conventional Commits

3. **Push branch**:
   ```bash
   git push -u origin feat/my-feature
   ```

4. **Open PR** (see below)

5. **After merge**, delete branch:
   ```bash
   git checkout main
   git pull
   git branch -d feat/my-feature
   ```

## Pull Request Workflow

### Before Opening a PR

1. ✅ Run the [definition-of-done checklist](definition-of-done.md)
2. ✅ Create a changeset if your changes are user-facing (see below)
3. ✅ Ensure all commits follow Conventional Commits
4. ✅ Write a clear PR description

### PR Title

Use the same format as commits:
```
feat(auth): add Clerk authentication provider
```

### PR Description Template

```markdown
## What

Brief description of what this PR does.

## Why

Why is this change needed? What problem does it solve?

## Changes

- Bullet point list of changes
- Keep it concise
- Focus on what, not how

## Configuration

If this adds/changes config options, document them here and ensure `config-options.md` is updated.

## Testing

How was this tested?
- [ ] Local dev environment
- [ ] Production build
- [ ] Specific scenarios (list them)

## Screenshots/Videos

If UI changes, include visuals.

## Checklist

- [ ] Definition of done completed
- [ ] Changeset created (if user-facing)
- [ ] Config options documented
- [ ] Tests pass
- [ ] Build succeeds
```

### PR Review

- All PRs require passing CI checks
- PRs to `main` may require human review (depending on repo settings)
- Agents can self-merge if CI passes and no review is required
- Address all failing checks before merging

## Changesets

Changesets track changes for version bumping and changelog generation.

### When to Create a Changeset

Create a changeset if your changes are **user-facing**:
- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Configuration option changes
- ❌ Internal refactors (no user impact)
- ❌ Documentation only
- ❌ Test changes only

### How to Create a Changeset

Run:
```bash
pnpm changeset
```

This will prompt you for:
1. **Bump type**: patch (fix), minor (feat), or major (breaking)
2. **Summary**: A user-friendly description of the change

Or create manually:

1. Create `.changeset/<random-words>.md`:
   ```bash
   touch .changeset/cool-horses-dance.md
   ```

2. Add content:
   ```markdown
   ---
   "flix-yourself-template": minor
   ---

   Add Clerk authentication provider as a config option
   ```

### Changeset Format

```markdown
---
"<package-name>": <bump-type>
---

User-friendly description of the change
```

**Bump types**:
- `major` - Breaking changes (e.g., config format change)
- `minor` - New features (e.g., new auth provider)
- `patch` - Bug fixes (e.g., fix video playback)

### Multiple Changes in One PR

If your PR includes multiple user-facing changes, create multiple changesets or combine them into one with a detailed description.

### Example Changesets

**.changeset/clerk-auth.md**:
```markdown
---
"flix-yourself-template": minor
---

Add Clerk as an authentication provider option. Configure via `auth.provider: "clerk"` in config.
```

**.changeset/config-breaking.md**:
```markdown
---
"flix-yourself-template": major
---

BREAKING: Migrate configuration from JSON to YAML format. Users must convert their `config.json` to `config.yaml`.
```

**.changeset/safari-fix.md**:
```markdown
---
"flix-yourself-template": patch
---

Fix video playback stuttering issue on Safari browsers.
```

## Workflow Summary

```
1. Create feature branch (feat/my-feature)
2. Make changes
3. Commit with Conventional Commits format
4. Run definition-of-done checklist
5. Create changeset (if user-facing)
6. Push branch
7. Open PR
8. CI runs automatically
9. Fix any CI failures
10. Merge when green
11. Delete branch
```

## Common Mistakes to Avoid

❌ Committing directly to `main`  
❌ Non-conventional commit messages  
❌ Forgetting changesets for user-facing changes  
❌ Opening PR without running definition-of-done checklist  
❌ Vague PR descriptions ("fix stuff", "updates")  
❌ Not updating `config-options.md` when adding config options  

✅ Always use feature branches  
✅ Follow Conventional Commits strictly  
✅ Create changesets for user-facing changes  
✅ Complete definition-of-done before PR  
✅ Write clear, specific PR descriptions  
✅ Keep `config-options.md` in sync  
