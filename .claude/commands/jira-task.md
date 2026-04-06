---
name: jira-task
description: Jira-first workflow for one issue: fetch -> implement -> test -> docs -> handoff to review.
---

# Jira Task Command

Use this for one Jira ticket end-to-end.

## Steps

1. Read `.cursor/skills/simple-workflow/SKILL.md` and `.cursor/skills/jira/SKILL.md`.
2. Call `jira-search` to fetch full issue context.
3. Prepare branch:
   - `feature/<JIRA-KEY>-<short-name>`
   - optional: separate worktree for parallel tasks.
4. Call `worker` to implement exactly the ticket scope.
5. Call `test-runner`:
   - PHPUnit + Playwright
   - coverage >= 70
   - if failed -> call `debugger` (max 2 attempts) then rerun `test-runner`.
6. Call `reviewer` for quality gate.
7. Call `documenter` for project docs (`docs/*`).
8. Call `confluence-documenter` for end-user instructions.
9. Prepare Jira handoff comment with:
   - business logic summary
   - UI changes summary
   - Playwright screenshots/report paths
   - MR link
   - pipeline result
10. Move issue to status `Review` only if all gates passed.

## Hard Rules
- Never move to `Review` with failed tests/pipeline.
- Never skip coverage gate (min 70).
- Never skip Confluence update for user-facing changes.

## Final Output
Return:
- issue key
- branch name
- changed files
- test summary
- coverage
- Jira comment text
- Confluence page link/title
- MR + pipeline status
