---
description: Run typecheck and tests, report status
allowed-tools: Bash(npm test*), Bash(npm run typecheck*)
---

Run validation checks for the GameLauncher project:

1) TypeScript check: `npm run typecheck`
   - Report any type errors

2) Unit tests: `npm test`
   - Report pass/fail count

3) Show summary:
   - Total tests passed/failed
   - Any errors that need attention
   - Coverage highlights (if coverage was run)

If tests fail, offer to help fix them.
