# Tasks for PRD – Phase 2: Remote Catalog & Personalization (Refined)

Based on the refined Phase 2 PRD requirements and current codebase analysis, here are the detailed implementation tasks to evolve from static bundled catalog to a secure, accessible, live platform.

## Relevant Files

### New Files
- `src/services/remoteCatalogService.ts` - Remote catalog fetching with HTTPS validation and fallback strategy
- `src/services/privacyService.ts` - Privacy consent management and data anonymization
- `src/services/favoritesService.ts` - Favorites persistence with AsyncStorage and validation
- `src/services/imageCacheService.ts` - Intelligent thumbnail caching with LRU and memory management
- `src/services/networkService.ts` - Wi-Fi detection wrapper around existing NetInfo integration
- `src/services/configService.ts` - Runtime configuration management and environment switching
- `src/utils/schemaValidator.ts` - JSON schema validation with input sanitization
- `src/utils/categoryUtils.ts` - Game grouping, sorting, and category management logic
- `src/utils/migrationUtils.ts` - Phase 1 to Phase 2 data migration and compatibility
- `src/config/appConfig.ts` - Environment configuration with validation and defaults
- `src/components/CategoryHeader.tsx` - Category section headers with accessibility support
- `src/components/ConsentDialog.tsx` - Privacy consent UI with clear messaging
- `src/components/ErrorBoundaryEnhanced.tsx` - Enhanced error handling with user recovery options

### Modified Files
- `src/types/index.ts` - Add privacy types, cache metadata, and migration interfaces
- `src/screens/GameListScreen.tsx` - Transform to SectionList with categories and remote catalog integration
- `src/components/GameCard.tsx` - Add favorite star, accessibility labels, and cache-aware image loading
- `src/services/storageService.ts` - Extend with remote catalog metadata and migration support
- `src/services/analyticsService.ts` - Add privacy compliance and new Phase 2 performance events
- `src/data/games.json` - Add category fields to all existing games
- `package.json` - Add any additional dependencies for accessibility or security features
- `App.tsx` - Add privacy consent initialization and migration logic on startup

### Notes

- Leverage existing NetInfo integration for network detection rather than reimplementing
- Build on existing analytics service architecture with structured event logging
- Extend current storage service patterns for consistency with existing cache management
- Maintain existing GameCard animation and styling patterns while adding new functionality
- Use existing TypeScript patterns and service singleton architecture
- All new components should follow existing styling patterns with LinearGradient and shadow effects

## Implementation Priority

**Phase 2A (Core Infrastructure):**
- Tasks 1.0, 2.0, 5.0 - Remote catalog, security, and configuration foundations

**Phase 2B (User Features):**  
- Tasks 3.0, 4.0, 6.0 - Categories, favorites, caching, and accessibility

**Phase 2C (Enhancement & Quality):**
- Tasks 7.0, 8.0 - Analytics enhancement and comprehensive testing

This task breakdown ensures secure, accessible implementation while building on the existing codebase's solid foundation.

## Current Codebase Analysis

**Existing Infrastructure:**
- **Game Interface**: Already supports `category` field (line 7 in types/index.ts)
- **Storage Service**: Robust caching with 24h expiry and performance logging
- **Analytics Service**: Comprehensive event tracking with structured logging 
- **Network Detection**: NetInfo already integrated for offline/online states
- **UI Components**: GameCard with category-based color coding and animations
- **Navigation**: Stack-based navigation with proper TypeScript support

**Architectural Patterns:**
- Service-oriented architecture with singleton patterns
- AsyncStorage for persistence with error handling
- Performance-first approach with timing measurements
- Comprehensive analytics instrumentation
- React Native best practices with proper TypeScript types

## Tasks

- [ ] 1.0 **Remote Catalog Infrastructure**
  - [ ] 1.1 Create `src/services/remoteCatalogService.ts` with HTTPS-only fetching and certificate validation
  - [ ] 1.2 Implement multi-level fallback strategy: remote → cached → bundled JSON
  - [ ] 1.3 Add URL validation with whitelist checking and security enforcement
  - [ ] 1.4 Extend existing `storageService.ts` with remote catalog metadata and cache management
  - [ ] 1.5 Add timeout handling (5s max), retry logic (3 attempts), and comprehensive error types
  - [ ] 1.6 Integrate remote fetching into existing `GameListScreen` load flow

- [ ] 2.0 **Security & Privacy Framework**
  - [ ] 2.1 Create `src/services/privacyService.ts` for consent management and data anonymization
  - [ ] 2.2 Create `src/components/ConsentDialog.tsx` for privacy consent UI with clear messaging
  - [ ] 2.3 Create `src/utils/schemaValidator.ts` with JSON validation and input sanitization
  - [ ] 2.4 Add XSS prevention and URL validation for all remote content
  - [ ] 2.5 Implement data retention policies and automated cleanup in analytics service
  - [ ] 2.6 Add privacy policy integration and opt-out functionality

- [ ] 3.0 **Categories & Favorites System**
  - [ ] 3.1 Create `src/services/favoritesService.ts` with AsyncStorage persistence and validation
  - [ ] 3.2 Create `src/utils/categoryUtils.ts` for game grouping and sorting logic
  - [ ] 3.3 Create `src/components/CategoryHeader.tsx` with visual distinction and accessibility labels
  - [ ] 3.4 Transform `GameListScreen.tsx` from FlatList to SectionList with category grouping
  - [ ] 3.5 Enhance `GameCard.tsx` with favorite star toggle, haptic feedback, and accessibility support
  - [ ] 3.6 Add "Favorites" auto-category that appears when ≥1 game favorited
  - [ ] 3.7 Update existing `games.json` with category fields for all games

- [ ] 4.0 **Image Caching & Prefetching**
  - [ ] 4.1 Create `src/services/networkService.ts` for Wi-Fi detection using existing NetInfo integration
  - [ ] 4.2 Create `src/services/imageCacheService.ts` with LRU cache and size management
  - [ ] 4.3 Implement intelligent prefetch queue with priority (favorites → recent → all)
  - [ ] 4.4 Add background prefetch triggers and progress tracking
  - [ ] 4.5 Update `GameCard` image loading to use cache-first strategy
  - [ ] 4.6 Add memory pressure handling and cache cleanup policies

- [ ] 5.0 **Configuration Management**
  - [ ] 5.1 Create `src/config/appConfig.ts` with environment variables and validation
  - [ ] 5.2 Create `src/services/configService.ts` for runtime configuration management
  - [ ] 5.3 Add `CATALOG_MODE` environment variable (BUNDLED | REMOTE) with default handling
  - [ ] 5.4 Add development config switcher in debug mode for testing
  - [ ] 5.5 Implement config change detection and graceful app state transitions
  - [ ] 5.6 Add configuration validation and error recovery

- [ ] 6.0 **Accessibility & User Experience**
  - [ ] 6.1 Add accessibility labels and hints to all new interactive components
  - [ ] 6.2 Implement keyboard navigation support for favorites and categories
  - [ ] 6.3 Add VoiceOver/TalkBack support with semantic announcements
  - [ ] 6.4 Create `src/components/ErrorBoundaryEnhanced.tsx` with user-friendly error recovery
  - [ ] 6.5 Add high contrast mode support and minimum touch target compliance
  - [ ] 6.6 Implement loading states and progress indicators for all async operations
  - [ ] 6.7 Add error messages with retry options and clear user guidance

- [ ] 7.0 **Enhanced Analytics & Monitoring**
  - [ ] 7.1 Extend existing `analyticsService.ts` with privacy compliance and consent checking
  - [ ] 7.2 Add new Phase 2 events: `catalog_source`, `favorites_count`, `thumbnail_prefetch_bytes`
  - [ ] 7.3 Add performance monitoring: `catalog_fetch_time`, `cache_hit_rate`, `memory_usage_peak`
  - [ ] 7.4 Implement event batching and offline queue with existing storage patterns
  - [ ] 7.5 Add accessibility usage tracking and feature adoption metrics
  - [ ] 7.6 Create analytics dashboard integration for development insights

- [ ] 8.0 **Migration & Quality Assurance**
  - [ ] 8.1 Create `src/utils/migrationUtils.ts` for Phase 1 to Phase 2 data migration
  - [ ] 8.2 Add automatic detection and conversion of existing cache formats
  - [ ] 8.3 Implement rollback capability and data corruption recovery
  - [ ] 8.4 Add comprehensive test coverage for remote catalog scenarios
  - [ ] 8.5 Test accessibility features with screen reader simulation
  - [ ] 8.6 Validate security measures with malicious payload testing
  - [ ] 8.7 Test migration scenarios and data integrity validation
  - [ ] 8.8 Performance testing with large catalogs and memory constraints