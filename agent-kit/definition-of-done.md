# Definition of Done

Before marking any task as complete or opening a PR, complete this checklist.

## Pre-PR Checklist

### 1. Code Quality

- [ ] **TypeScript**: No type errors
  ```bash
  pnpm typecheck
  ```
  
- [ ] **Linting**: No lint errors or warnings
  ```bash
  pnpm lint
  ```
  
- [ ] **Formatting**: Code is properly formatted
  ```bash
  pnpm format
  ```

- [ ] **Build**: Production build succeeds
  ```bash
  pnpm build
  ```

### 2. Testing

- [ ] **Unit tests**: All tests pass
  ```bash
  pnpm test
  ```

- [ ] **Manual testing**: Feature works in local dev environment
  ```bash
  pnpm dev
  ```

- [ ] **Edge cases**: Tested error states, empty states, loading states

- [ ] **Browser testing**: Works in Chrome, Safari, Firefox (if UI change)

### 3. Documentation

- [ ] **Code comments**: Complex logic is commented

- [ ] **Config options**: New config options added to `config-options.md`

- [ ] **README**: Updated if setup/deployment process changed

- [ ] **JSDoc**: Public APIs have JSDoc comments

### 4. Commits and Changes

- [ ] **Conventional Commits**: All commits follow the spec

- [ ] **Changeset**: Created if changes are user-facing
  ```bash
  pnpm changeset
  ```

- [ ] **No debug code**: Removed console.logs, debuggers, commented code

- [ ] **No TODOs**: Resolved or moved to GitHub issues

### 5. Configuration and Architecture

- [ ] **Pluggable**: New features are configurable, not hard-coded

- [ ] **Backwards compatible**: Existing configs still work (or breaking change documented)

- [ ] **Conventions followed**: Adheres to principles in `conventions.md`

- [ ] **No duplication**: No copy-pasted code; extracted to shared utilities

### 6. Security and Performance

- [ ] **No secrets**: No API keys, passwords, or tokens in code

- [ ] **Env vars**: Sensitive config uses environment variables

- [ ] **Performance**: No obvious performance regressions (large bundle size, slow queries)

- [ ] **Dependencies**: New deps are necessary and well-maintained

### 7. Git Hygiene

- [ ] **Branch naming**: Follows `<type>/<description>` format

- [ ] **Clean history**: No "WIP", "fix typo", "oops" commits (squash if needed)

- [ ] **Up to date**: Branch is rebased/merged with latest `main`

- [ ] **No merge conflicts**: Conflicts resolved cleanly

## PR Description Checklist

When opening the PR, ensure your description includes:

- [ ] **What**: Clear summary of changes
- [ ] **Why**: Rationale for the change
- [ ] **Changes**: Bullet-point list of what changed
- [ ] **Configuration**: Documentation of new/changed config options
- [ ] **Testing**: How it was tested
- [ ] **Screenshots**: If UI changed

## Post-Merge Checklist

After merging:

- [ ] **Delete branch**: Clean up merged feature branch
  ```bash
  git branch -d feat/my-feature
  ```

- [ ] **Verify deployment**: Check that changes work in deployed environment (if applicable)

- [ ] **Close related issues**: Link and close GitHub issues fixed by this PR

## Quick Validation Script

Run this to validate most checks:

```bash
# Full validation
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

If this passes, you're 80% done. Manual testing and documentation review are the remaining 20%.

## When to Skip Items

Some items can be skipped depending on the change:

- **Docs-only changes**: Skip testing, build (but still lint markdown)
- **Test-only changes**: Skip changeset (unless fixing test infrastructure)
- **Chore/deps updates**: Skip changeset unless user-facing impact

Use judgment, but when in doubt, complete the full checklist.

## Common Failures

### TypeScript errors
```bash
# Check specific file
pnpm tsc --noEmit src/path/to/file.ts

# Fix with explicit types or @ts-expect-error with comment
```

### Lint errors
```bash
# Auto-fix most issues
pnpm lint --fix

# For unfixable issues, use eslint-disable with justification
```

### Build failures
```bash
# Check build output for errors
pnpm build 2>&1 | tee build.log

# Common causes: missing deps, type errors, import issues
```

### Test failures
```bash
# Run specific test
pnpm test path/to/test.spec.ts

# Update snapshots if intentional UI change
pnpm test -u
```

## Definition of Done: Summary

✅ All checks pass  
✅ Code is tested  
✅ Documentation is updated  
✅ Commits are clean  
✅ PR description is complete  
✅ Changeset is created (if needed)  

When all boxes are checked, you're ready to open (or merge) the PR.
