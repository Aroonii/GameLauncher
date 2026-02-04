# Investor Demo UX Polish - Design Document

**Date:** 2026-02-04
**Timeline:** 1-2 days
**Goal:** Polish GameLauncher for investor demo - focus on polished consumer product feel, engaging experience, and technical sophistication

---

## Overview

Broad UX polish across four areas to make the entire app feel refined and professional. No new features - purely improving the existing experience.

---

## 1. First Impressions

### Splash Screen Enhancement

**Current:** Basic loading screen with spinner and "Loading amazing games..." text.

**New Design:**
- KORA logo fades in (0% → 100% opacity, 400ms)
- Logo scales subtly (0.8 → 1.0) during fade
- Tagline fades in 200ms after logo: "Instant Play. Endless Fun."
- No spinner during splash - cleaner branding moment
- Minimum 800ms display time before transition
- Smooth fade-out to game list

### Content Fade-In

**New Design:**
- Header gradient slides down from top (200ms)
- Game cards fade in with stagger effect (80ms between rows)
- Creates cascading reveal effect
- Total animation completes within 500ms

### Implementation
- New `SplashScreen` component using `Animated` API
- Modify `GameListScreen` to animate content on first render

---

## 2. Navigation Flow

### Screen Transitions

**Current:** Default React Navigation transitions.

**New Design:**

Game List → Game View:
- Card scale-down (0.95) with haptic on press
- Screen slides in from right with fade (300ms)
- Ease-out easing curve

Game View → Game List:
- Screen slides out to right with fade
- Smooth return, no jarring snap

### Game Launch Loading State

**Current:** WebView loads with blank/white screen.

**New Design:**
- Dark overlay with category color accent
- Game title and thumbnail displayed
- Pulsing loading indicator (three dots or circular)
- Text: "Loading [Game Name]..."
- Fades out on WebView `onLoadEnd`
- Shows "Taking longer than expected..." after 5 seconds

### Implementation
- Configure `screenOptions` with custom transition spec
- New `GameLoadingOverlay` component in `GameViewScreen`

---

## 3. Visual Refinement

### Card Improvements

| Property | Current | New |
|----------|---------|-----|
| Card margin | 6px | 8px |
| Border radius | 18px | 16px |
| Image height | 140px | 120px |
| Content padding | 14px | 12px |
| Shadows | Inconsistent | Unified |

- "Play Now" button slightly smaller (less dominant)

### Header Refinement

**Current:** "🎮 KORA" with game count, favorites count, debug info.

**New Design:**
- "KORA" only - no emoji
- Letter-spacing: 2px for premium feel
- Reduced vertical padding
- Single subtle line for game/category count
- Remove favorites count (visible in section)
- Subtle bottom shadow for depth

### Category Section Styling

**Current:** Headers blend into background.

**New Design:**
- Left accent bar (4px) in category color
- Larger title (16px → 18px)
- More spacing above categories (20px → 28px)
- Subtle separator between categories

---

## 4. Feedback & Delight

### Haptic Feedback

Using `expo-haptics`:

| Action | Haptic Type |
|--------|-------------|
| Card tap | Light impact |
| Favorite toggle | Medium impact |
| Pull-to-refresh trigger | Light impact |
| Game loaded | Success notification |

### Button Press Animations

- "Play Now" button: scale (0.97) + brightness on press
- Favorite star: bouncy scale (1.0 → 1.4 → 1.0) on toggle
- Smooth 200ms transitions

### Favorite Toggle Enhancement

**Favoriting:**
- Star scales up (1.0 → 1.4) then springs back
- Golden glow pulse on button background
- Smooth color transition (200ms)

**Unfavoriting:**
- Simple scale down + color fade
- Less celebratory (intentional asymmetry)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/SplashScreen.tsx` | **New** - Animated splash component |
| `src/components/GameLoadingOverlay.tsx` | **New** - Game loading state overlay |
| `src/components/GameCard.tsx` | Visual refinements, enhanced animations |
| `src/components/CategoryHeader.tsx` | Accent bar, styling improvements |
| `src/screens/GameListScreen.tsx` | Splash integration, content animations, header changes |
| `src/screens/GameViewScreen.tsx` | Loading overlay integration |
| `src/navigation/AppNavigator.tsx` | Screen transition configuration |
| `package.json` | Add `expo-haptics` dependency |

---

## Out of Scope

- New games or catalog changes
- New features (search, filters, achievements)
- Backend/service changes
- Data model changes

---

## Risk Assessment

**Low risk** - All changes are UI-layer only. Existing functionality remains unchanged. Easy to revert if needed.

---

## Success Criteria

- [ ] App launch feels premium (splash → content reveal)
- [ ] Game transitions are smooth (no jarring cuts)
- [ ] Visual consistency throughout
- [ ] Tactile feedback on interactions
- [ ] No regressions in existing functionality
