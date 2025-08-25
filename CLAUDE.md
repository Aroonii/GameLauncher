# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run start` - Start Expo development server
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator  
- `npm run web` - Start web development server

## Architecture

GameLauncher is an instant-play mobile gaming platform built with Expo/React Native that loads HTML5/WASM games via WebView.

### Core Data Flow
1. **Game Loading**: `GameListScreen` loads games from `src/data/games.json` and caches them using `storageService`
2. **Caching Strategy**: First check AsyncStorage cache, fall back to JSON file, then cache for future loads
3. **Navigation**: Stack-based navigation from game list → WebView with game context passed as route params
4. **Game Execution**: Games load in `react-native-webview` with error handling and loading states

### Key Components
- **storageService** (`src/services/storageService.ts`): AsyncStorage wrapper for game metadata caching with key `@games_cache`
- **AppNavigator** (`src/navigation/AppNavigator.tsx`): Stack navigator defining `GameList` → `GameView` flow
- **Game Interface** (`src/types/index.ts`): Core data structure with `id`, `title`, `image`, `url` fields

### TypeScript Configuration
- Path aliases configured: `@/*` maps to `src/*` with specific aliases for major directories
- Strict mode enabled for type safety
- Expo TypeScript base configuration extended

### WebView Integration
- Games load from remote URLs defined in game metadata
- Error handling with retry/go-back options
- JavaScript and DOM storage enabled for game functionality
- Media playback configured for game assets

### Game Catalog Management
Games are defined in `src/data/games.json` as an array of Game objects. The current catalog uses placeholder URLs that should be replaced with actual game endpoints for production deployment.

## AI Dev Tasks
Use these files when I request structured feature development using PRDs:
- `/ai-dev-tasks/create-prd.md`
- `/ai-dev-tasks/generate-tasks.md`
- `/ai-dev-tasks/process-task-list.md`