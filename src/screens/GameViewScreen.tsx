import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { GameErrorScreen } from '../components/GameErrorScreen';
import { GameLoadingIndicator } from '../components/GameLoadingIndicator';
import { storageService } from '../services/storageService';
import { orientationUtils } from '../utils/orientation';
import { analyticsService } from '../services/analyticsService';
import { categoryUtils } from '../utils/categoryUtils';
import { RootStackParamList, Game } from '../types';

type GameViewScreenRouteProp = RouteProp<RootStackParamList, 'GameView'>;
type GameViewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameView'>;

interface Props {
  route: GameViewScreenRouteProp;
  navigation: GameViewScreenNavigationProp;
}

export const GameViewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { game } = route.params;
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [webViewKey, setWebViewKey] = useState(0);
  const [suggestedGames, setSuggestedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orientationChanging, setOrientationChanging] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [gameLoadStartTime, setGameLoadStartTime] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const orientationSubscriptionRef = useRef<any>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadSuggestedGames();
    startLoadingTimeout();
    
    // Lock to preferred orientation based on game
    const usePortrait = game.preferredOrientation === 'portrait';
    if (usePortrait) {
      orientationUtils.lockToPortrait();
    } else {
      orientationUtils.lockToLandscape();
    }
    
    // Log game_opened event
    analyticsService.logGameOpened(game, !usePortrait); // orientation_changed = false for portrait games
    
    // Add orientation change listener for graceful handling
    orientationSubscriptionRef.current = orientationUtils.addOrientationChangeListener(
      (orientationInfo) => {
        console.log('Orientation changed:', orientationInfo.orientationInfo.orientation);
        setOrientationChanging(true);
        
        // Brief delay to allow orientation change to complete
        setTimeout(() => {
          setOrientationChanging(false);
        }, 300);
      }
    );
    
    return () => {
      // Cleanup timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Cleanup orientation listener
      if (orientationSubscriptionRef.current) {
        orientationUtils.removeOrientationChangeListener(orientationSubscriptionRef.current);
      }
      
      // Clear WebView cache and memory on unmount
      if (webViewRef.current) {
        console.log('🧹 Cleaning up WebView memory');
        // Force garbage collection by clearing cache
        webViewRef.current.clearCache && webViewRef.current.clearCache(true);
      }
      
      // Reset to portrait when component unmounts
      orientationUtils.lockToPortrait();
    };
  }, [game]);

  const loadSuggestedGames = async () => {
    try {
      const cachedGames = await storageService.getCachedGames();
      if (cachedGames) {
        const alternatives = cachedGames
          .filter(g => g.id !== game.id)
          .slice(0, 2);
        setSuggestedGames(alternatives);
      }
    } catch (error) {
      console.error('Error loading suggested games:', error);
    }
  };

  const startLoadingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Record game load start time for performance monitoring
    setGameLoadStartTime(Date.now());
    
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        handleError({ type: 'timeout' });
      }
    }, 15000); // 15 second timeout
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    let message = 'Failed to load game';
    let errorType: 'network' | 'timeout' | 'webview' | 'unknown' = 'unknown';
    
    if (error.type === 'timeout') {
      message = 'Game is taking too long to load';
      errorType = 'timeout';
    } else if (error.nativeEvent) {
      message = `Network error: ${error.nativeEvent.description || 'Connection failed'}`;
      errorType = 'network';
    } else {
      errorType = 'webview';
    }
    
    // Log game_error event
    analyticsService.logGameError(game, errorType, message, retryCount);
    
    setErrorMessage(message);
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setWebViewKey(prev => prev + 1);
    startLoadingTimeout();
  };

  const handleGoBack = async () => {
    await orientationUtils.lockToPortrait();
    navigation.goBack();
  };

  const handleTryAlternative = (alternativeGame: Game) => {
    navigation.replace('GameView', { game: alternativeGame });
  };

  const handleLoadStart = () => {
    setLoadProgress(0);
    setGameLoadStartTime(Date.now());
    console.log(`🎮 Starting to load: ${game.title}`);
  };

  const handleLoadProgress = (event: any) => {
    const progress = event.nativeEvent.progress;
    setLoadProgress(progress);
    console.log(`📊 Load progress for ${game.title}: ${Math.round(progress * 100)}%`);
  };

  const handleLoadEnd = () => {
    const loadTime = gameLoadStartTime ? Date.now() - gameLoadStartTime : 0;
    setIsLoading(false);
    setLoadProgress(1);

    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Log performance metrics
    console.log(`✅ Game loaded successfully: ${game.title} in ${loadTime}ms`);
    
    // Check if we met the 3s requirement
    if (loadTime > 3000) {
      console.warn(`⚠️ Game load time exceeded 3s requirement: ${loadTime}ms`);
    }
    
    // Analytics could be enhanced here with load time tracking
    // analyticsService.logGameLoadPerformance(game, loadTime);
  };

  const handleMemoryWarning = () => {
    console.warn('⚠️ WebView memory warning - clearing cache');
    if (webViewRef.current) {
      // Clear WebView cache to free memory
      webViewRef.current.clearCache && webViewRef.current.clearCache(true);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: game.title,
    });
  }, [navigation, game.title]);

  if (hasError) {
    return (
      <GameErrorScreen
        game={game}
        onRetry={handleRetry}
        onGoBack={handleGoBack}
        onTryAlternative={handleTryAlternative}
        errorMessage={errorMessage}
        suggestedGames={suggestedGames}
      />
    );
  }

  // Get category color for consistent theming
  const categoryColor = game.category ? categoryUtils.getCategory(game.category).color : '#1a1a2e';

  return (
    <View style={[styles.container, { backgroundColor: categoryColor }]}>
      {orientationChanging ? (
        <View style={[styles.loadingContainer, { backgroundColor: categoryColor }]} />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            key={webViewKey}
            source={{ uri: game.url }}
            style={[styles.webview, { backgroundColor: categoryColor }]}
            
            // Error handling
            onError={handleError}
            onHttpError={handleError}
            onRenderProcessGone={handleMemoryWarning}
            
            // Loading events
            onLoadStart={handleLoadStart}
            onLoadProgress={handleLoadProgress}
            onLoadEnd={handleLoadEnd}
            
            // Performance optimizations
            startInLoadingState={false} // We have custom loading indicator
            javaScriptEnabled={true}
            domStorageEnabled={true}
            
            // Media playback for games
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            
            // Caching and performance
            cacheEnabled={true}
            incognito={false} // Allow caching for better performance
            
            // Hardware acceleration (handled by default)
            
            // Network and security
            originWhitelist={['*']}
            mixedContentMode="compatibility" // Allow mixed content for some games
            
            // User interaction
            allowsBackForwardNavigationGestures={false}
            bounces={false} // Disable iOS bounce for better game experience
            scrollEnabled={false} // Prevent scrolling in games
            
            // Handle resize gracefully
            onContentSizeChange={() => {
              console.log('WebView content size updated');
            }}
            
            // Custom user agent for better game compatibility
            userAgent="Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0 GameLauncher/1.0"
          />
          
          <GameLoadingIndicator
            gameTitle={game.title}
            progress={loadProgress}
            isVisible={isLoading}
            categoryColor={game.category ? categoryUtils.getCategory(game.category).color : '#667eea'}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});