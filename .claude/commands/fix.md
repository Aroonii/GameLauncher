---
description: Auto-fix TypeScript errors and common issues
allowed-tools: Bash(npm run typecheck*), Bash(npm test*)
---

Auto-fix common issues in the GameLauncher project:

1) Run typecheck: `npm run typecheck`
   - Identify TypeScript errors

2) For each error:
   - Read the affected file
   - Fix the type error
   - Verify fix with `npm run typecheck`

3) Run tests to ensure fixes don't break anything: `npm test`

4) Report what was fixed and final status
