#!/bin/bash
# ---
# description: Complete a milestone with self-validation and doc updates
# allowed-tools: Bash(npm test*), Bash(npm run typecheck*), Bash(git diff*), Bash(git status*)
# ---

# You are finishing a milestone.
#
# 1) Run typecheck: `npm run typecheck` and fix errors until passing.
# 2) Run unit tests: `npm test` and fix failures until green.
# 3) Update `docs/PLAN.md`:
#    - What changed
#    - What's done in this milestone
#    - Demo steps
#    - Test status
# 4) Do NOT edit `docs/SPEC.md` unless requirements truly changed.
#
# Context:
# - git status: `git status`
# - git diff: `git diff --stat`

echo "Running milestone completion checks..."

# TypeScript check
echo "Running typecheck..."
npm run typecheck 2>&1

# Run tests
echo "Running tests..."
npm test 2>&1

echo ""
echo "Milestone checks complete."
echo "Remember to update docs/PLAN.md with:"
echo "  - What changed"
echo "  - Demo steps"
echo "  - Test status"
