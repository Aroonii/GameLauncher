# Investor Demo UX Polish - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish GameLauncher's UI/UX for investor demo - create a refined, professional app experience.

**Architecture:** Purely UI-layer changes using React Native Animated API and expo-haptics. No service or data model changes. Four areas: splash screen, screen transitions, visual refinements, haptic feedback.

**Tech Stack:** React Native, Expo, expo-haptics, React Navigation custom transitions, Animated API

---

## Task 1: Install expo-haptics dependency

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run:
```bash
npx expo install expo-haptics
```

**Step 2: Verify installation**

Run:
```bash
npm run typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-haptics for tactile feedback"
```

---

## Task 2: Create SplashScreen component

**Files:**
- Create: `src/components/SplashScreen.tsx`
- Test: `src/components/__tests__/SplashScreen.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/SplashScreen.test.tsx`:

```tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { SplashScreen } from '../SplashScreen';

jest.useFakeTimers();

describe('SplashScreen', () => {
  it('renders logo text', () => {
    const { getByText } = render(
      <SplashScreen visible={true} onAnimationComplete={() => {}} />
    );
    expect(getByText('KORA')).toBeTruthy();
  });

  it('renders tagline', () => {
    const { getByText } = render(
      <SplashScreen visible={true} onAnimationComplete={() => {}} />
    );
    expect(getByText('Instant Play. Endless Fun.')).toBeTruthy();
  });

  it('calls onAnimationComplete after minimum display time', () => {
    const onComplete = jest.fn();
    render(<SplashScreen visible={true} onAnimationComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1200); // 800ms min + animation time
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <SplashScreen visible={false} onAnimationComplete={() => {}} />
    );
    expect(queryByText('KORA')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test -- --testPathPattern="SplashScreen" --verbose
```
Expected: FAIL - Cannot find module '../SplashScreen'

**Step 3: Write the implementation**

Create `src/components/SplashScreen.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  visible: boolean;
  onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  visible,
  onAnimationComplete,
}) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      logoOpacity.setValue(0);
      logoScale.setValue(0.8);
      taglineOpacity.setValue(0);
      containerOpacity.setValue(1);

      // Logo fade in and scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Tagline fade in after logo (200ms delay)
      setTimeout(() => {
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Fade out and complete after minimum display time (800ms)
      setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete();
        });
      }, 800);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logo}>KORA</Text>
        </Animated.View>

        <Animated.View style={{ opacity: taglineOpacity }}>
          <Text style={styles.tagline}>Instant Play. Endless Fun.</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
```

**Step 4: Run test to verify it passes**

Run:
```bash
npm test -- --testPathPattern="SplashScreen" --verbose
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/SplashScreen.tsx src/components/__tests__/SplashScreen.test.tsx
git commit -m "feat: add animated SplashScreen component"
```

---

## Task 3: Integrate SplashScreen into GameListScreen

**Files:**
- Modify: `src/screens/GameListScreen.tsx:26-34, 271-282, 284-295`

**Step 1: Add splash state and import**

At the top of `src/screens/GameListScreen.tsx`, add import:

```tsx
import { SplashScreen } from '../components/SplashScreen';
```

In the component, after the existing state declarations (around line 33), add:

```tsx
const [showSplash, setShowSplash] = useState(true);
```

**Step 2: Replace loading screen with splash integration**

Replace the loading block (lines 271-282):

```tsx
  if (loading) {
    return (
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading amazing games...</Text>
      </LinearGradient>
    );
  }
```

With:

```tsx
  if (loading && !showSplash) {
    return (
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading games...</Text>
      </LinearGradient>
    );
  }
```

**Step 3: Add SplashScreen overlay**

At the end of the main return statement, just before the closing `</SafeAreaView>`, after the ConsentDialog, add:

```tsx
      {/* Animated Splash Screen */}
      <SplashScreen
        visible={showSplash}
        onAnimationComplete={() => setShowSplash(false)}
      />
```

**Step 4: Run tests and typecheck**

Run:
```bash
npm run validate
```
Expected: All tests pass, no type errors

**Step 5: Commit**

```bash
git add src/screens/GameListScreen.tsx
git commit -m "feat: integrate animated splash screen on app launch"
```

---

## Task 4: Add content fade-in animation to GameListScreen

**Files:**
- Modify: `src/screens/GameListScreen.tsx`

**Step 1: Add animation refs**

After the state declarations, add:

```tsx
const headerAnim = useRef(new Animated.Value(-100)).current;
const contentOpacity = useRef(new Animated.Value(0)).current;
```

**Step 2: Trigger content animation when splash completes**

Modify the SplashScreen's onAnimationComplete handler:

```tsx
      <SplashScreen
        visible={showSplash}
        onAnimationComplete={() => {
          setShowSplash(false);
          // Animate content in
          Animated.parallel([
            Animated.timing(headerAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }}
      />
```

**Step 3: Wrap header with Animated.View**

Replace the LinearGradient header section with:

```tsx
      <Animated.View style={{ transform: [{ translateY: headerAnim }] }}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.headerGradient}
        >
          {/* ... existing header content ... */}
        </LinearGradient>
      </Animated.View>
```

**Step 4: Wrap SectionList with animated opacity**

```tsx
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <SectionList
          {/* ... existing SectionList props ... */}
        />
      </Animated.View>
```

**Step 5: Add Animated import**

Ensure `Animated` is imported from react-native (it should already be, but verify).

**Step 6: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/screens/GameListScreen.tsx
git commit -m "feat: add content fade-in animation after splash"
```

---

## Task 5: Configure custom screen transitions

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

**Step 1: Add transition configuration imports**

Add imports at the top:

```tsx
import { CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';
import { Easing } from 'react-native';
```

**Step 2: Configure screen options**

Replace the Stack.Navigator with custom transitions:

```tsx
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="GameList"
        screenOptions={{
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
                easing: Easing.out(Easing.poly(4)),
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 250,
                easing: Easing.in(Easing.poly(4)),
              },
            },
          },
        }}
      >
        <Stack.Screen
          name="GameList"
          component={GameListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GameView"
          component={GameViewScreen}
          options={{
            headerTintColor: '#007AFF',
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTitleStyle: {
              color: '#ffffff',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Step 3: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "feat: add smooth screen transitions with custom timing"
```

---

## Task 6: Refine GameCard visual styling

**Files:**
- Modify: `src/components/GameCard.tsx:194-330` (styles section)

**Step 1: Update style values**

Replace the styles object with refined values:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    maxWidth: '50%',
  },
  glowContainer: {
    flex: 1,
    borderRadius: 16,
  },
  touchable: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    marginBottom: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  favoriteButtonActive: {
    backgroundColor: '#FFD700',
  },
  favoriteIcon: {
    fontSize: 14,
    color: '#ccc',
  },
  favoriteIconActive: {
    color: '#FFF',
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#a0a0a0',
    lineHeight: 16,
    marginBottom: 12,
  },
  playButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  gameTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
```

**Step 2: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/GameCard.tsx
git commit -m "style: refine GameCard spacing and shadows"
```

---

## Task 7: Refine header in GameListScreen

**Files:**
- Modify: `src/screens/GameListScreen.tsx`

**Step 1: Update header content**

Replace the header content section (inside headerGradient):

```tsx
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>KORA</Text>
          <Text style={styles.headerSubtitle}>
            {games?.length || 0} games available
          </Text>
        </View>
```

**Step 2: Update header styles**

Update the header-related styles:

```tsx
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    fontWeight: '500',
  },
```

Remove `favoritesInfo` and `debugInfo` styles if no longer used.

**Step 3: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/screens/GameListScreen.tsx
git commit -m "style: refine header with cleaner typography"
```

---

## Task 8: Add accent bar to CategoryHeader

**Files:**
- Modify: `src/components/CategoryHeader.tsx`

**Step 1: Add accent bar to the component**

Inside the container View, before the TouchableOpacity, add:

```tsx
      <View style={[styles.accentBar, { backgroundColor: category.color }]} />
```

**Step 2: Update styles**

Add the accentBar style and update container:

```tsx
  container: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    position: 'relative',
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 0,
  },
  headerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 64,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
```

**Step 3: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/CategoryHeader.tsx
git commit -m "style: add colored accent bar to category headers"
```

---

## Task 9: Add haptic feedback to GameCard

**Files:**
- Modify: `src/components/GameCard.tsx`

**Step 1: Import expo-haptics**

Add at the top:

```tsx
import * as Haptics from 'expo-haptics';
```

**Step 2: Add haptic to press handler**

In handlePressIn function, add haptic:

```tsx
  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      // ... existing animations
    ]).start();
  };
```

**Step 3: Add haptic to favorite toggle**

In handleFavoritePress function:

```tsx
  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onFavoriteToggle) {
      onFavoriteToggle(game);
    }
  };
```

**Step 4: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/GameCard.tsx
git commit -m "feat: add haptic feedback to card interactions"
```

---

## Task 10: Enhance favorite star animation

**Files:**
- Modify: `src/components/GameCard.tsx`

**Step 1: Add star animation ref**

After existing animation refs, add:

```tsx
const [starScale] = useState(new Animated.Value(1));
```

**Step 2: Animate star on favorite toggle**

Update handleFavoritePress:

```tsx
  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Bouncy animation for the star
    Animated.sequence([
      Animated.timing(starScale, {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(starScale, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onFavoriteToggle) {
      onFavoriteToggle(game);
    }
  };
```

**Step 3: Wrap favorite button content with animated view**

Replace the favorite button's inner Text with:

```tsx
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                game.isFavorite && styles.favoriteButtonActive
              ]}
              onPress={handleFavoritePress}
              accessibilityRole="button"
              accessibilityLabel={game.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Animated.Text
                style={[
                  styles.favoriteIcon,
                  game.isFavorite && styles.favoriteIconActive,
                  { transform: [{ scale: starScale }] }
                ]}
              >
                {game.isFavorite ? '★' : '☆'}
              </Animated.Text>
            </TouchableOpacity>
```

**Step 4: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/GameCard.tsx
git commit -m "feat: add bouncy animation to favorite star"
```

---

## Task 11: Add haptic feedback to pull-to-refresh

**Files:**
- Modify: `src/screens/GameListScreen.tsx`

**Step 1: Import expo-haptics**

Add import:

```tsx
import * as Haptics from 'expo-haptics';
```

**Step 2: Update onRefresh handler**

Modify onRefresh function:

```tsx
  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadGames(true);
  };
```

**Step 3: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/screens/GameListScreen.tsx
git commit -m "feat: add haptic feedback to pull-to-refresh"
```

---

## Task 12: Enhance GameLoadingOverlay with category color

**Files:**
- Modify: `src/screens/GameViewScreen.tsx`
- Modify: `src/components/GameLoadingIndicator.tsx`

**Step 1: Pass category color to loading indicator**

In GameViewScreen, update the GameLoadingIndicator usage:

```tsx
          <GameLoadingIndicator
            gameTitle={game.title}
            progress={loadProgress}
            isVisible={isLoading}
            categoryColor={game.category ? categoryUtils.getCategory(game.category).color : '#667eea'}
          />
```

Add import if needed:

```tsx
import { categoryUtils } from '../utils/categoryUtils';
```

**Step 2: Update GameLoadingIndicator props**

In `src/components/GameLoadingIndicator.tsx`, update interface:

```tsx
interface Props {
  gameTitle: string;
  progress: number;
  isVisible: boolean;
  categoryColor?: string;
}
```

Update component signature:

```tsx
export const GameLoadingIndicator: React.FC<Props> = ({
  gameTitle,
  progress,
  isVisible,
  categoryColor = '#667eea'
}) => {
```

**Step 3: Use category color in gradient**

Update the LinearGradient backdrop colors:

```tsx
      <LinearGradient
        colors={[`${categoryColor}F2`, `${categoryColor}DD`]}
        style={styles.backdrop}
      />
```

**Step 4: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/screens/GameViewScreen.tsx src/components/GameLoadingIndicator.tsx
git commit -m "feat: use category color in game loading overlay"
```

---

## Task 13: Add haptic on game load complete

**Files:**
- Modify: `src/screens/GameViewScreen.tsx`

**Step 1: Import expo-haptics**

Add import:

```tsx
import * as Haptics from 'expo-haptics';
```

**Step 2: Add success haptic in handleLoadEnd**

Update handleLoadEnd function:

```tsx
  const handleLoadEnd = () => {
    const loadTime = gameLoadStartTime ? Date.now() - gameLoadStartTime : 0;
    setIsLoading(false);
    setLoadProgress(1);

    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // ... rest of existing code
  };
```

**Step 3: Run validation**

Run:
```bash
npm run validate
```
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/screens/GameViewScreen.tsx
git commit -m "feat: add success haptic when game finishes loading"
```

---

## Task 14: Final validation and testing

**Files:**
- None (verification only)

**Step 1: Run full validation**

Run:
```bash
npm run validate
```
Expected: All tests pass, no type errors

**Step 2: Manual testing checklist**

Run:
```bash
npm run start
```

Verify on device/simulator:
- [ ] Splash screen shows KORA logo with fade/scale animation
- [ ] Tagline "Instant Play. Endless Fun." appears after logo
- [ ] Content fades in smoothly after splash
- [ ] Header shows "KORA" with letter spacing (no emoji)
- [ ] Category headers have colored accent bars on left
- [ ] Cards have refined spacing and shadows
- [ ] Haptic feedback on card tap
- [ ] Haptic feedback on favorite toggle
- [ ] Star bounces when toggled
- [ ] Haptic on pull-to-refresh
- [ ] Screen transitions are smooth
- [ ] Game loading overlay uses category color
- [ ] Success haptic when game loads

**Step 3: Final commit if any fixes needed**

If manual testing reveals issues, fix and commit:
```bash
git add -A
git commit -m "fix: polish adjustments from manual testing"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install expo-haptics | package.json |
| 2 | Create SplashScreen component | SplashScreen.tsx, test |
| 3 | Integrate splash into GameListScreen | GameListScreen.tsx |
| 4 | Add content fade-in animation | GameListScreen.tsx |
| 5 | Configure screen transitions | AppNavigator.tsx |
| 6 | Refine GameCard visual styling | GameCard.tsx |
| 7 | Refine header typography | GameListScreen.tsx |
| 8 | Add accent bar to CategoryHeader | CategoryHeader.tsx |
| 9 | Add haptic to GameCard | GameCard.tsx |
| 10 | Enhance favorite star animation | GameCard.tsx |
| 11 | Add haptic to pull-to-refresh | GameListScreen.tsx |
| 12 | Category color in loading overlay | GameViewScreen.tsx, GameLoadingIndicator.tsx |
| 13 | Success haptic on game load | GameViewScreen.tsx |
| 14 | Final validation | None |

**Total estimated commits:** 14
