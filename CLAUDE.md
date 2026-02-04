# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run start` - Start Expo development server
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator  
- `npm run web` - Start web development server

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode during development
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI environments

### Validation
- `npm run typecheck` - TypeScript validation
- `npm run validate` - Typecheck + all tests (use before commits)

### Git Workflow
- **IMPORTANT**: Always ask before committing changes to ensure proper testing
- Test all changes thoroughly before adding to git
- Never commit untested code or experimental changes
- Always confirm with user before running `git add` and `git commit` commands
- **MANDATORY**: Run `npm run validate` before any commit (pre-commit hook enforces this)

## Required Reading

Before starting work, review:
1. **`docs/SPEC.md`** - Technical specification and requirements
2. **`docs/PLAN.md`** - Current milestone status and next tasks
3. **`docs/DEVELOPMENT-GUIDE.md`** - Development workflow and setup

## Development Workflow (Ralph Wiggum Loop)

For each feature/milestone:
1. Implement smallest end-to-end slice
2. Run `npm run validate` (typecheck + tests)
3. Fix failures
4. Repeat steps 2-3 until ALL tests pass
5. Only then move to next feature

**Stop condition**: ALL tests green + feature works on device.

### Definition of Done (Per Milestone)
- [ ] Feature works end-to-end (UI + services + data)
- [ ] Errors handled (validation + empty states)
- [ ] Tests added for critical logic (min 80% coverage for new code)
- [ ] `npm run validate` passing
- [ ] `docs/PLAN.md` updated if milestone completed

## Architecture

GameLauncher is an instant-play mobile gaming platform built with Expo/React Native that loads HTML5/WASM games via WebView with advanced remote catalog management and privacy-by-design features.

### Core Data Flow (Phase 2)
1. **Catalog Loading**:
   - **Dev mode**: Uses bundled `src/data/games.json` directly (no network fetch)
   - **Production**: `remoteCatalogService` fetches from GitHub Pages with ETag caching
2. **Fallback Strategy** (production only): Remote catalog → cached version → bundled games
3. **Privacy-First**: `privacyService` manages user consent levels (essential/analytics/all)
4. **Favorites System**: `favoritesService` handles game preferences with AsyncStorage persistence
5. **2-Column Layout**: Games display in side-by-side pairs within each category section
6. **Navigation**: Stack-based navigation from categorized game list → WebView with orientation handling

### Key Services & Components
- **remoteCatalogService** (`src/services/remoteCatalogService.ts`): Handles remote catalog fetching with ETag caching, schema validation, and fallback logic
- **privacyService** (`src/services/privacyService.ts`): Privacy-by-design consent management (essential/analytics/all levels)
- **favoritesService** (`src/services/favoritesService.ts`): Game favorites and play statistics with AsyncStorage persistence  
- **configService** (`src/services/configService.ts`): Feature flags and configuration management
- **analyticsService** (`src/services/analyticsService.ts`): Privacy-compliant usage analytics
- **GameCard** (`src/components/GameCard.tsx`): Enhanced game cards with favorites, categories, and 2-column layout support
- **ConsentDialog** (`src/components/ConsentDialog.tsx`): GDPR-compliant privacy consent interface
- **categoryUtils** (`src/utils/categoryUtils.ts`): Game categorization with Recently Played, Favorites, and category-based grouping

### TypeScript Configuration
- Path aliases configured: `@/*` maps to `src/*` with specific aliases for major directories
- Strict mode enabled for type safety
- Expo TypeScript base configuration extended

### WebView Integration
- Games load from remote URLs defined in game metadata
- Error handling with retry/go-back options
- JavaScript and DOM storage enabled for game functionality
- Media playback configured for game assets

### Game Catalog Management (Phase 2)
- **Two Catalog Files** (keep in sync):
  - `src/data/games.json` - Used in dev mode, bundled with app
  - `catalog.json` - Deployed to GitHub Pages for production
- **Dev Mode**: Edit `src/data/games.json` → changes appear immediately with `npm run start`
- **Production**: Fetches from `https://aroonii.github.io/GameLauncher/catalog.json`
- **Disabling Games**: Set `"enabled": false` and optionally `"disabledReason": "reason"`
- **Caching**: ETag-based HTTP caching with AsyncStorage persistence (production only)
- **Schema Validation**: JSON schema validation for catalog integrity
- **Categories**: Automatic categorization with Recently Played (max 2), Favorites, and category-based grouping
- **Layout**: 2-column grid display within each category section using SectionList with game row grouping

### Privacy & Analytics
- **Consent Levels**: Essential (required) / Analytics (optional) / All features (full personalization)
- **Data Minimization**: Features disabled based on user consent level
- **GDPR Compliance**: Withdraw consent anytime, clear data on request
- **Analytics**: Privacy-compliant usage tracking with session management

### Recent Improvements
- **UI Enhancement**: Rich GameCard design with category colors, favorite stars, and smooth animations
- **Layout**: 2-games-per-row within categories for better space utilization
- **Performance**: Added heavier games (Hextris, Slither.io) for testing complex WebGL/multiplayer games
- **Images**: SVG-based game thumbnails via jsdelivr CDN for reliable display

### Catalog Workflow
**Local Development:**
1. Edit `src/data/games.json` directly
2. Run `npm run start` - changes appear immediately
3. No network requests needed during dev

**Deploying to Production:**
1. Sync changes: Copy `src/data/games.json` content to `catalog.json`
2. Commit and push both files
3. GitHub Pages auto-deploys `catalog.json`
4. Production app fetches from https://aroonii.github.io/GameLauncher/catalog.json

**Cache Management (Production):**
- App uses ETag headers for efficient caching
- Pull-to-refresh fetches latest catalog
- Fallback to cached/bundled catalog if network fails

## AI Dev Tasks
Use these files when I request structured feature development using PRDs:
- `/ai-dev-tasks/create-prd.md`
- `/ai-dev-tasks/generate-tasks.md` 
- `/ai-dev-tasks/process-task-list.md`

## Testing Framework

### Test Requirements
- **MANDATORY**: All new functionality MUST include comprehensive unit tests
- **MANDATORY**: Run `npm test` after implementing any feature to ensure all tests pass
- **MANDATORY**: Achieve minimum 80% test coverage for new code
- **MANDATORY**: Test both success and error scenarios for all new functions

### Test Structure
- **Services**: Test all public methods, error handling, and state management
- **Components**: Test rendering, user interactions, and prop handling  
- **Utilities**: Test all helper functions with edge cases and invalid inputs
- **Integration**: Test service interactions and data flow

### Test Files Location
- Service tests: `src/services/__tests__/[serviceName].test.ts`
- Component tests: `src/components/__tests__/[componentName].test.tsx` 
- Utility tests: `src/utils/__tests__/[utilityName].test.ts`

### Manual Testing
- **Development**: Use `npm run start` - uses local `src/data/games.json` directly
- **Device Testing**: Use `npm run start` with tunnel mode for device testing
- **Performance**: Test with heavier games like Hextris
- **Production Testing**: Build release version to test remote catalog fetching

### Test Standards
- Use descriptive test names that explain what is being tested
- Mock external dependencies (AsyncStorage, NetInfo, etc.)
- Test error scenarios and edge cases
- Verify analytics and privacy compliance in tests
- Ensure tests are fast and reliable (no flaky tests)