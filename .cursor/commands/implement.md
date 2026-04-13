---
name: implement
description: Simple workflow - Code → Test → Docs. For single tasks like components, functions, or endpoints.
---

# Implement Command

## ⛔ YOU ARE FORBIDDEN FROM DOING ANY WORK YOURSELF

**Do NOT write code. Do NOT edit files. Do NOT run tests directly.**

Every single step must be executed by a subagent via the `Task` tool.
You are the coordinator only. If you find yourself about to do anything besides calling `Task` — STOP.

---

## MANDATORY: Serena preflight

1. Call `mcp__serena__check_onboarding_performed`.
2. If onboarding is not performed, call `mcp__serena__onboarding`.
3. Use Serena semantic tools as the primary code navigation method for all subsequent steps.

---

## MANDATORY: Read and follow the skill

1. Read `.cursor/skills/simple-workflow/SKILL.md` using the Read tool — right now, before anything else
2. Execute EXACTLY as described in the skill — using `Task(subagent_type=...)` for each step
3. Do not skip, summarize, or shortcut any step from the skill
