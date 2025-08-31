# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run start` - Start Expo development server
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator  
- `npm run web` - Start web development server

### Git Workflow
- **IMPORTANT**: Always ask before committing changes to ensure proper testing
- Test all changes thoroughly before adding to git
- Never commit untested code or experimental changes
- Always confirm with user before running `git add` and `git commit` commands

## Architecture

GameLauncher is an instant-play mobile gaming platform built with Expo/React Native that loads HTML5/WASM games via WebView with advanced remote catalog management and privacy-by-design features.

### Core Data Flow (Phase 2)
1. **Remote Catalog Loading**: `remoteCatalogService` fetches games from GitHub Pages with ETag caching and schema validation
2. **Fallback Strategy**: Remote catalog → cached version → bundled `src/data/games.json` 
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
- **Remote Catalog**: Primary source via GitHub Pages at `https://aroonii.github.io/GameLauncher/catalog.json`
- **Local Fallback**: `src/data/games.json` serves as bundled backup
- **Caching**: ETag-based HTTP caching with AsyncStorage persistence
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

### Remote Catalog Setup
The app now uses a sophisticated remote catalog system:
1. **GitHub Pages**: https://aroonii.github.io/GameLauncher/catalog.json
2. **Auto-deploy**: Updates to `catalog.json` in main branch trigger GitHub Pages redeployment
3. **Cache Management**: App respects HTTP ETag headers for efficient caching
4. **Real-time Updates**: Pull-to-refresh or cache expiration fetches latest catalog

## AI Dev Tasks
Use these files when I request structured feature development using PRDs:
- `/ai-dev-tasks/create-prd.md`
- `/ai-dev-tasks/generate-tasks.md` 
- `/ai-dev-tasks/process-task-list.md`

## Testing
- **Development**: Use `npm run start` with tunnel mode for device testing
- **Performance**: Test with heavier games like Slither.io and HexGL Racing
- **Network**: Test offline/online scenarios with remote catalog fallbacks