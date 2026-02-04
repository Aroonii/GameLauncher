#!/bin/bash
# ---
# description: Verify environment is ready before starting work
# allowed-tools: Bash(npm run typecheck*), Bash(git status*), Read(docs/PLAN.md)
# ---

# Pre-flight checks when starting a session:
#
# 1) Check git status: `git status`
#    - Are there uncommitted changes?
#    - What branch are we on?
#
# 2) Run quick typecheck: `npm run typecheck`
#    - Report any TS errors that need fixing
#
# 3) Read current milestone status from `docs/PLAN.md`:
#    - What milestone are we on?
#    - What's the next task?
#
# 4) Report summary:
#    - Environment ready / Issues found
#    - Current milestone and next steps

echo "Running pre-flight checks..."

# Git status
echo "Checking git status..."
git status --short

# TypeScript check
echo "Running typecheck..."
npm run typecheck 2>&1 || echo "TypeScript errors found - fix before proceeding"

echo "Pre-flight checks complete. Review docs/PLAN.md for current milestone."
