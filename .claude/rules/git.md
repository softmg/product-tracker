# Git Workflow

## Branch Naming

```
feature/<short-name>          # without Jira
feature/<JIRA-KEY>-<name>     # with Jira (Alpha+, required in Production)
fix/<short-name>
hotfix/<short-name>
refactor/<short-name>
docs/<short-name>
```

Rules:
- Lowercase and hyphens only
- Short but descriptive
- One branch = one logical change

## Commit Format

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

Types: `feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf` · `style`

Subject rules:
- Lowercase, imperative mood ("add" not "added")
- ≤ 50 characters
- No period at end

Examples:
```
feat(auth): add oauth login
fix(api): handle null response from payment gateway
test(cart): add unit tests for discount logic
```

## Pull Requests

- Ideal size: < 400 lines changed
- Maximum: 1000 lines
- Must be up to date with `main` before merge
- Merge only after review and green pipeline

## Hard Rules

- ❌ No force-push to `main`
- ❌ No secrets or credentials in commits
- ❌ No large binary files
- ❌ No WIP commits in a PR
- ✅ Delete branch after merge
- ✅ Atomic commits — one logical change per commit
