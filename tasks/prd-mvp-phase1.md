# PRD – MVP (Phase 1)

## 🎯 Goal
Deliver a lightweight instant-play launcher for HTML5 games using React Native WebView, enabling casual mobile gamers to discover and quickly try new games without downloads or installs.

## 📦 Scope
- Game list screen (`games.json` → AsyncStorage cache → list UI)
- Game view screen (WebView execution, error handling, landscape orientation)
- Pull-to-refresh and retry functionality
- Offline fallback with cached metadata
- Logging basic events: `app_open`, `catalog_loaded`, `game_opened`, `game_error`

## 🚫 Out of Scope (Non-Goals)
- User accounts, favorites, monetization
- Cloud streaming
- Push notifications
- Game categories/genres
- Ratings or reviews
- User-generated content

## 👤 Target Users
**Primary:** Casual mobile gamers seeking quick, zero-commitment gaming experiences
- Demographics: Mobile-first users who value convenience over depth
- Behavior: Quick discovery, trial-based engagement, low storage tolerance

## 📱 User Stories
1. **As a casual gamer**, I want to browse available games so that I can discover new titles quickly
2. **As a mobile user**, I want to try games instantly so that I don't waste time on downloads
3. **As a user with limited storage**, I want games to run without installation so I can preserve device space
4. **As a user with unreliable internet**, I want to see cached game options so I can still browse when offline

## ✅ Functional Requirements

1. **Game Catalog Display**
   - System must load games from local `games.json` file containing 5-10 games
   - System must display game title and thumbnail image in a scrollable list
   - System must cache game metadata using AsyncStorage for offline access
   - System must support pull-to-refresh to reload catalog

2. **Game Execution**
   - System must open games in WebView within the same screen context
   - System must support landscape orientation for optimal game experience
   - System must enable JavaScript and DOM storage for game functionality
   - System must provide back navigation to return to game list

3. **Error Handling & Resilience**
   - System must show error message with retry button when games fail to load
   - System must provide "go back" option from error screens
   - System must log errors for debugging (`game_error` event)
   - System must fall back to cached metadata when network is unavailable

4. **Performance & Analytics**
   - System must log basic usage events: `app_open`, `catalog_loaded`, `game_opened`, `game_error`
   - System must cache game metadata for <500ms catalog fetch performance
   - System must handle offline mode gracefully with last-known game list

## 🔑 Non-Functional Requirements
- **App Bundle Size:** <20 MB total package size
- **Performance:** Cold start <2s on low-end Android devices
- **Network:** First game load <3s on 4G connection
- **Reliability:** Crash-free >99% during test cycles
- **Platform Support:** Both Android and iOS with consistent UX

## ✅ Acceptance Criteria
- 95% of valid games load successfully in WebView
- Catalog displays with cache fallback in <500ms
- Offline mode shows last-cached game list without errors
- Error screens provide both retry and navigation options
- Games render properly in landscape orientation
- App launches and displays game list within 2 seconds on test devices

## 🏗️ Technical Considerations
- **WebView Integration:** Use `react-native-webview` with JavaScript enabled
- **State Management:** AsyncStorage for game metadata caching with `@games_cache` key
- **Navigation:** Stack navigation between GameList and GameView screens
- **Orientation:** Implement landscape lock for game view screen
- **Error Boundaries:** Wrap WebView with error handling for graceful failures

## 📊 Success Metrics
- **Engagement:** Average session duration >3 minutes
- **Retention:** 70% of users return within 7 days
- **Performance:** <1% crash rate during 100 test sessions
- **Load Success:** >95% successful game loads on first attempt

## ❓ Open Questions
1. Should there be a loading indicator for game initialization?
2. What should be the timeout duration for game loading failures?
3. Should the app remember the last played game for quick access?
4. What analytics events are needed beyond the basic four mentioned?

## 📁 Deliverables
- GameListScreen component with catalog display
- GameViewScreen component with WebView integration  
- AsyncStorage service for metadata caching
- Error handling components and retry logic
- Basic event logging implementation
- 5-10 curated HTML5 games in games.json