# Development Guide - GameLauncher

> AI-assisted development with self-validation, automated testing, and the Ralph Wiggum Loop methodology adapted for React Native/Expo.

---

## Core Philosophy

### Ralph Wiggum Loop
Development in tight vertical slices with forced iteration until tests pass.

**For each milestone:**
1. Implement smallest end-to-end slice
2. Run unit tests (`npm test`)
3. Fix failures
4. Repeat steps 2-3 until ALL tests pass
5. Only then move to next milestone

**Stop condition**: ALL tests green + feature works on device.

### Definition of Done (Per Milestone)
- [ ] Feature works end-to-end (UI + services + data)
- [ ] Errors handled (validation + empty states)
- [ ] Tests added for critical logic (min 80% coverage for new code)
- [ ] `npm run typecheck` passing (0 errors)
- [ ] No critical-path TODOs
- [ ] PLAN.md updated if milestone completed

---

## Quick Setup Checklist

### Phase 1: Verify Core Setup
- [x] Git repo initialized
- [x] TypeScript configured
- [x] Jest test framework configured
- [x] CLAUDE.md exists

### Phase 2: Enhanced Setup
- [ ] `docs/SPEC.md` created (requirements + data model)
- [ ] `docs/PLAN.md` created (milestone tracking)
- [ ] `.claude/settings.json` configured (hook registration)
- [ ] `.claude/hooks/` created (start-gate, stop-gate)
- [ ] `.claude/commands/` enhanced (test, milestone, fix)
- [ ] `.git/hooks/pre-commit` created
- [ ] `.github/workflows/validate.yml` created

---

## Documentation Structure

### 1. CLAUDE.md (Project Root)
**Purpose**: Instructions for Claude Code AI agent.
**Location**: `CLAUDE.md` (already exists)

### 2. docs/SPEC.md
**Purpose**: Technical specification with requirements, data model, edge cases.
**Key Sections**:
- Summary
- Core Principles (Guardrails)
- Out of Scope (MVP)
- Functional Requirements
- Data Model
- API/Service Map
- Edge Cases
- Test Plan
- Milestones

### 3. docs/PLAN.md
**Purpose**: Living document tracking milestone progress.
**Update After Each Milestone**:
- What changed
- What's done
- Demo steps to test
- Test status
- Known issues or next steps

---

## Git Hooks

### Pre-commit Hook

**Location**: `.git/hooks/pre-commit`

**What it does**: Prevents commits if tests or typecheck fail.

**Setup**:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Claude Code Setup

### Directory Structure
```
.claude/
├── settings.json           # Hook registration
├── hooks/
│   ├── start-gate.sh      # Runs on session start
│   └── stop-gate.sh       # Runs on session stop
└── commands/
    ├── test.md            # /test command
    ├── milestone.md       # /milestone command
    ├── fix.md             # /fix command
    ├── create-prd.md      # /create-prd command
    ├── generate-tasks.md  # /generate-tasks command
    └── process-task-list.md # /process-task-list command
```

### Claude Commands Reference

| Command | What It Does |
|---------|-------------|
| `/test` | Run typecheck + tests, report status |
| `/milestone` | Complete milestone workflow with validation |
| `/fix` | Auto-fix linting/formatting issues |
| `/create-prd` | Create a PRD for a new feature |
| `/generate-tasks` | Generate tasks from PRD |
| `/process-task-list` | Process and implement task list |

---

## Package.json Scripts

### Available Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm test"
  }
}
```

### Quick Commands
| Command | What It Does |
|---------|-------------|
| `npm run validate` | Typecheck + All tests |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | TypeScript validation only |

---

## Testing Infrastructure

### Test Structure
```
src/
├── services/__tests__/     # Service unit tests
├── components/__tests__/   # Component tests
└── utils/__tests__/        # Utility function tests
```

### Test Requirements (from CLAUDE.md)
- All new functionality MUST include comprehensive unit tests
- Run `npm test` after implementing any feature
- Minimum 80% coverage for new code
- Test both success and error scenarios
- Mock external dependencies (AsyncStorage, NetInfo, etc.)

### Example Test Pattern
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle success case', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle error case', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## CI/CD Pipeline

### GitHub Actions
**File**: `.github/workflows/validate.yml`

Runs on push/PR to main branch:
1. TypeScript check
2. Unit tests with coverage
3. Build validation

---

## Daily Workflow

```
Morning:
→ Start Claude Code
→ Check git status and current milestone
→ Review docs/PLAN.md for next task

Development:
→ Write code
→ Run /test frequently
→ Commit when ready (pre-commit hook validates)

End of Milestone:
→ Run /milestone
→ Tests must pass
→ PLAN.md gets updated
```

---

## Troubleshooting

### Commands Not Found
- Restart Claude Code terminal
- Check files exist in `.claude/commands/`
- Run `/help` to verify commands appear

### Tests Fail
- Check AsyncStorage mocks are set up
- Verify NetInfo mocks are configured
- Run `npm test -- --verbose` for detailed output

### TypeScript Errors
- Run `npm run typecheck` to see all errors
- Check path aliases in tsconfig.json

---

## Customization Notes

### React Native/Expo Specifics
- No E2E testing framework configured (could add Detox or Maestro later)
- Uses `expo start` for development
- WebView-based game loading
- AsyncStorage for persistence

### Why No E2E Tests?
React Native E2E testing requires Detox or Maestro, which have significant setup overhead. For this project, comprehensive unit tests + manual testing on device is the current strategy. E2E can be added later if needed.

---

**Last Updated**: 2026-01-16
