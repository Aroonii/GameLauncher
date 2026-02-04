# GameLauncher - Technical Specification

## 0. Summary

GameLauncher is an instant-play mobile gaming platform built with Expo/React Native that loads HTML5/WASM games via WebView with advanced remote catalog management and privacy-by-design features.

## 0.1 Core Principles (Guardrails)

1. **Privacy by Design**: User consent required for non-essential features
2. **Offline First**: App works with cached/bundled data when offline
3. **Performance**: Games load quickly, smooth WebView experience
4. **Reliability**: Robust error handling and fallback strategies

## 0.2 Explicitly Out of Scope (MVP)

- User accounts and authentication
- Multiplayer functionality
- In-app purchases
- Game saves/progress sync
- Push notifications
- E2E testing infrastructure

## 0.3 Development Method: Ralph Wiggum Loop

For each feature:
1. Implement smallest end-to-end slice
2. Run `npm test`
3. Fix failures
4. Repeat until ALL tests green
5. Only then move to next feature

---

## 1. Core User Journeys

### Journey 1: Browse and Play
1. User opens app
2. Sees categorized game list (Recently Played, Favorites, Categories)
3. Taps game card
4. Game loads in WebView
5. User plays game
6. Returns to catalog

### Journey 2: Manage Favorites
1. User taps star on game card
2. Game added to Favorites section
3. Favorites persist across sessions

### Journey 3: Privacy Consent
1. First launch shows consent dialog
2. User chooses consent level (Essential/Analytics/All)
3. Features enabled/disabled based on consent
4. User can change consent in settings

---

## 2. Functional Requirements

### 2.1 Remote Catalog
- [x] Fetch catalog from GitHub Pages
- [x] ETag-based caching
- [x] Schema validation
- [x] Fallback to cached/bundled catalog

### 2.2 Game Display
- [x] 2-column grid layout within categories
- [x] Category sections with Recently Played, Favorites
- [x] Game cards with thumbnails, titles, categories
- [x] Favorite star toggle

### 2.3 Game Playback
- [x] WebView game loading
- [x] Orientation handling
- [x] Error handling with retry/go-back
- [x] JavaScript and DOM storage enabled

### 2.4 Privacy & Analytics
- [x] Consent dialog with three levels
- [x] Feature gating based on consent
- [x] Privacy-compliant analytics
- [x] Data minimization

### 2.5 Favorites System
- [x] Toggle favorites via star icon
- [x] Persist to AsyncStorage
- [x] Track play statistics

---

## 3. Data Model

### Game
```typescript
interface Game {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  category: string;
  enabled?: boolean;
}
```

### Catalog
```typescript
interface Catalog {
  version: string;
  lastUpdated: string;
  games: Game[];
}
```

### Privacy Consent
```typescript
type ConsentLevel = 'essential' | 'analytics' | 'all';
```

### Favorites/Stats
```typescript
interface GameStats {
  favorited: boolean;
  playCount: number;
  lastPlayed: string | null;
}
```

---

## 4. Service Map

| Service | Responsibility |
|---------|---------------|
| `remoteCatalogService` | Fetch, cache, validate remote catalog |
| `privacyService` | Consent management and feature gating |
| `favoritesService` | Favorites and play statistics |
| `configService` | Feature flags and configuration |
| `analyticsService` | Privacy-compliant usage tracking |

---

## 5. Edge Cases (Must Handle)

- [ ] Network unavailable during catalog fetch → Use cached/bundled
- [x] Invalid catalog response → Use fallback
- [x] Game URL unreachable → Show error with retry
- [x] Privacy consent not given → Disable non-essential features
- [x] AsyncStorage full/unavailable → Graceful degradation

---

## 6. Test Plan (Minimum)

### Unit Tests Required
- [x] remoteCatalogService: fetch, cache, fallback
- [x] privacyService: consent levels, feature gating
- [x] favoritesService: add/remove, persistence
- [x] categoryUtils: grouping, sorting
- [x] schemaValidator: valid/invalid catalogs

### Manual Testing
- [ ] Fresh install flow
- [ ] Offline mode
- [ ] Game playback
- [ ] Favorites persistence
- [ ] Consent dialog flow

---

## 7. Non-Functional Requirements

- **Startup**: App usable within 2 seconds
- **Game Load**: WebView ready within 3 seconds
- **Storage**: < 50MB app size
- **Compatibility**: iOS 13+, Android 8+

---

## 8. Milestones

See `docs/PLAN.md` for current milestone tracking.

---

**Last Updated**: 2026-01-16
