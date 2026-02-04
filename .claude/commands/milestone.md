---
description: Complete a milestone with self-validation and doc updates
allowed-tools: Bash(npm test*), Bash(npm run typecheck*), Bash(git diff*), Bash(git status*), Read(docs/PLAN.md), Edit(docs/PLAN.md)
---

You are finishing a milestone for the GameLauncher project.

## Validation Steps

1) Run typecheck: `npm run typecheck`
   - Fix any errors until passing

2) Run unit tests: `npm test`
   - Fix failures until all tests green
   - Ensure minimum 80% coverage for new code

3) Check git status: `git status`
   - Review what files changed
   - Ensure no unintended changes

## Documentation Update

4) Update `docs/PLAN.md` with:
   - **What changed**: Summary of implementation
   - **What's done**: Completed items for this milestone
   - **Demo steps**: How to test the feature
   - **Test status**: Unit test count and coverage
   - **Next steps**: What remains or what's next

5) Do NOT edit `docs/SPEC.md` unless requirements truly changed.
   - If spec must change, add `## Change Request` section explaining why + impact

## Context
- Current git status: !`git status --short`
- Recent changes: !`git diff --stat HEAD~3`
