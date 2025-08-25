# PRD – Phase 2: Remote Catalog & Personalization

## 🎯 Goal
Evolve GameLauncher from a static demo (bundled `games.json`) into a **live platform** with a remotely hosted catalog and basic personalization features.  
This allows us to add/rotate games instantly without releasing new APKs, measure engagement more realistically, and prepare for future cloud features.

---

## 📂 Scope
1. **Remote Catalog**
   - Fetch `games.json` from configurable HTTPS endpoint (tunnel/CDN/API).
   - Validate against v1 schema (id, title, thumbnail, url, tags, orientation).
   - Cache result in AsyncStorage with 24h expiry.
   - Fallback: if remote fails → use cached → if no cache → use bundled JSON.

2. **Categories**
   - Add `category` field to `games.json`.
   - UI: group games by category with headers and distinct color bands.

3. **Favorites**
   - Long-press or tap star on a game → adds to Favorites.
   - Store in AsyncStorage.
   - "Favorites" category auto-appears if ≥1 game saved.

4. **Prefetch Thumbnails**
   - On Wi-Fi only, prefetch thumbnails and cache them.
   - If cached, game cards load instantly without re-download.

5. **Config Switcher**
   - Simple config/env that allows toggling:
     - `BUNDLED` mode → load from local `games.json`
     - `REMOTE` mode → load from remote URL

---

## 🚫 Out of Scope
- User login / cloud-synced favorites  
- Monetization (ads, rewards)  
- Cloud game streaming (will come in Phase 3)  
- API write-back (developers adding games themselves)  
- Real-time multiplayer features
- Push notifications for new games  

---

## 🔑 Non-Functional Requirements

### Performance
- Cold start still <2s on low-end Android devices  
- Catalog fetch + validation + render in <500ms median  
- Image cache operations <100ms per thumbnail  
- Memory usage increase <20% compared to Phase 1

### Security
- All network requests over HTTPS only with certificate validation  
- URL whitelist validation for catalog endpoints  
- Input sanitization for all remote JSON data  
- No sensitive data in analytics events

### Reliability
- App continues to work offline with last known cache  
- Graceful degradation when remote services unavailable  
- Cache corruption recovery without data loss  
- Network timeout handling (5s max per request)

### Accessibility
- VoiceOver/TalkBack support for all new UI elements  
- Keyboard navigation compatibility  
- High contrast mode support  
- Minimum touch target size 44dp  

---

## ✅ Acceptance Criteria

### Core Functionality
- When remote catalog updates, app shows new game list on next refresh  
- Invalid catalog gracefully fails with user-friendly error message  
- Categories render correctly with consistent visual hierarchy  
- Favorites persist across app restarts and OS updates  
- Thumbnails load instantly when cached (no placeholder flash)  
- Config switching between BUNDLED/REMOTE works without code changes

### Error Handling
- Network failures show retry option with clear messaging  
- Malformed JSON displays specific validation errors  
- Cache corruption triggers automatic cleanup and rebuild  
- Missing thumbnails fall back to default placeholder gracefully

### User Experience
- Loading states provide clear feedback during operations  
- Favorite toggle provides immediate visual and haptic feedback  
- Categories display proper empty states when no games exist  
- Cache updates happen transparently without blocking UI

### Privacy & Analytics
- User consent obtained before analytics collection  
- No personally identifiable information in tracked events  
- Analytics data aggregated and anonymized  
- Clear privacy policy accessible within app  

---

## 📊 Metrics to Track

### Performance Metrics
- `catalog_fetch_time` - Remote fetch duration in ms
- `catalog_validation_time` - JSON validation duration in ms  
- `cache_hit_rate` - Percentage of cache hits vs misses
- `image_load_time` - Average thumbnail load time
- `memory_usage_peak` - Peak memory during image operations

### Usage Analytics
- `catalog_source` - Data source (bundled|cached|remote)
- `favorites_count` - Number of games favorited per user
- `category_interaction` - Most accessed game categories
- `offline_usage_duration` - Time spent in offline mode

### Technical Metrics
- `thumbnail_prefetch_bytes` - Data usage for image prefetching
- `cache_cleanup_frequency` - How often cache cleanup occurs
- `network_error_rate` - Percentage of failed network requests
- `config_switch_count` - Frequency of mode switching (dev only)  

---

## 📦 Deliverables

### Core Services
- Remote catalog service with HTTPS validation and multi-level fallback  
- Enhanced storage service with cache management and cleanup  
- Favorites service with AsyncStorage persistence  
- Image cache service with Wi-Fi-only prefetching  
- Network service for connectivity monitoring

### Schema & Validation
- Updated game schema with category field and backward compatibility  
- JSON schema validator with comprehensive error reporting  
- Input sanitization for all remote data sources

### User Interface
- Categories UI with SectionList and visual grouping  
- Favorites system with star toggle and persistence  
- Enhanced error states with retry mechanisms  
- Loading indicators for all async operations

### Configuration & Tools
- Environment configuration system for BUNDLED/REMOTE modes  
- Development tools for config switching and debugging  
- Migration utilities for Phase 1 to Phase 2 data

### Quality Assurance
- Comprehensive test suite covering all new functionality  
- Performance benchmarks and monitoring  
- Accessibility compliance validation  
- Security audit of network operations

## 🔄 Migration Strategy

### Phase 1 → Phase 2 Transition
- Automatic detection and migration of existing cached data  
- Backward compatibility with Phase 1 game data format  
- Graceful handling of missing category fields in existing games  
- Rollback capability if Phase 2 deployment encounters issues

### Data Migration
- Preserve existing AsyncStorage cache during upgrade  
- Convert Phase 1 cache format to Phase 2 with metadata  
- Initialize empty favorites list for existing users  
- Maintain analytics continuity across versions  

---