import React, { useEffect, useState } from 'react';
import { View, SectionList, StyleSheet, Text, ActivityIndicator, RefreshControl, StatusBar, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { GameCard } from '../components/GameCard';
import { CategoryHeader } from '../components/CategoryHeader';
import { ConsentDialog } from '../components/ConsentDialog';
import { storageService } from '../services/storageService';
import { remoteCatalogService } from '../services/remoteCatalogService';
import { configService } from '../services/configService';
import { privacyService } from '../services/privacyService';
import { favoritesService } from '../services/favoritesService';
import { orientationUtils } from '../utils/orientation';
import { analyticsService } from '../services/analyticsService';
import { categoryUtils } from '../utils/categoryUtils';
import { Game, RootStackParamList, EnhancedGame } from '../types';
import gamesData from '../data/games.json';

type GameListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameList'>;

interface Props {
  navigation: GameListScreenNavigationProp;
}

export const GameListScreen: React.FC<Props> = ({ navigation }) => {
  const [games, setGames] = useState<EnhancedGame[]>([]);
  const [categorizedGames, setCategorizedGames] = useState<Array<{ category: any; games: EnhancedGame[]; gameCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [catalogSource, setCatalogSource] = useState<'remote' | 'cached' | 'bundled'>('bundled');
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize all services
        await Promise.all([
          configService.initialize(),
          privacyService.initialize(),
          favoritesService.initialize(),
        ]);
        
        // Check if consent dialog should be shown
        if (!privacyService.hasConsent()) {
          setShowConsentDialog(true);
        }
        
        // Load games using new remote catalog system
        await loadGames();
      } catch (error) {
        console.error('App initialization error:', error);
        // Load games anyway with fallback
        await loadGames();
      }
    };
    
    initializeApp();
    
    // Ensure portrait orientation on game list screen
    orientationUtils.lockToPortrait();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadGames = async (forceRefresh: boolean = false) => {
    const startTime = Date.now();
    
    try {
      // Clear cache if force refresh requested
      if (forceRefresh) {
        await remoteCatalogService.clearRemoteCache();
      }
      
      // Get current configuration
      const config = configService.getConfig();
      
      // Determine catalog configuration based on app config
      const catalogConfig = {
        url: config.catalogMode === 'REMOTE' ? config.remoteCatalog.url : undefined,
        fallbackToBundled: config.remoteCatalog.fallbackToBundled,
        validateSchema: config.remoteCatalog.validateSchema,
      };
      
      // Fetch catalog using remote catalog service
      const result = await remoteCatalogService.fetchCatalog(catalogConfig);
      
      // Enhance games with favorites and statistics
      const enhancedGames = favoritesService.enhanceGamesWithFavorites(result.games);
      
      // Update state with enhanced games
      setGames(enhancedGames);
      setCatalogSource(result.source);
      
      // Categorize games
      const categorized = categoryUtils.categorizeGames(enhancedGames, {
        includeFavorites: true,
        includeRecent: true,
        maxRecentDays: 7,
        minGamesPerCategory: 1,
        showEmptyCategories: false,
      });
      setCategorizedGames(categorized);
      
      const loadTime = Date.now() - startTime;
      const logLevel = configService.getDebugLogLevel();
      
      if (logLevel === 'debug' || logLevel === 'info') {
        console.log(`Games loaded from ${result.source} in ${loadTime}ms`);
        console.log(`Loaded ${result.games.length} games in ${categorized.length} categories`);
        
        if (result.metadata.etag) {
          console.log(`ETag: ${result.metadata.etag}`);
        }
      }

      // Enhanced analytics logging with new Phase 2 events
      if (configService.isFeatureEnabled('analytics') && privacyService.isAnalyticsAllowed()) {
        analyticsService.logCatalogLoaded(
          result.games.length,
          loadTime,
          result.metadata.fromCache,
          isOffline ? 'offline' : 'online'
        );
        
        // Log new Phase 2 analytics event for catalog source
        analyticsService.logEvent('catalog_source', {
          source: result.source,
          catalog_mode: config.catalogMode,
          fetch_time: loadTime,
          games_count: result.games.length,
          from_cache: result.metadata.fromCache,
          has_etag: !!result.metadata.etag,
          categories_count: categorized.length,
          favorites_count: favoritesService.getFavoritesCount(),
        });
      }

    } catch (error) {
      console.error('Error loading games:', error);
      
      // Final fallback to bundled games
      const fallbackGames = gamesData as Game[];
      const enhancedFallbackGames = favoritesService.enhanceGamesWithFavorites(fallbackGames);
      
      setGames(enhancedFallbackGames);
      setCatalogSource('bundled');
      
      // Categorize fallback games
      const categorized = categoryUtils.categorizeGames(enhancedFallbackGames, {
        includeFavorites: true,
        includeRecent: true,
        maxRecentDays: 7,
        minGamesPerCategory: 1,
        showEmptyCategories: false,
      });
      setCategorizedGames(categorized);
      
      const loadTime = Date.now() - startTime;
      console.log(`Using final fallback: ${fallbackGames.length} games from bundled JSON`);

      // Log error analytics
      if (configService.isFeatureEnabled('analytics') && privacyService.isAnalyticsAllowed()) {
        analyticsService.logCatalogLoaded(
          fallbackGames.length,
          loadTime,
          false,
          isOffline ? 'offline' : 'online'
        );
        
        analyticsService.logEvent('catalog_error', {
          error_type: error instanceof Error ? error.name : 'Unknown',
          error_message: error instanceof Error ? error.message : String(error),
          fallback_used: 'bundled',
          games_count: fallbackGames.length,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGames(true);
  };

  const handleGamePress = async (game: EnhancedGame) => {
    // Record game play statistics
    await favoritesService.recordGamePlay(game.id);
    
    // Navigate to game view
    navigation.navigate('GameView', { game });
  };

  const handleFavoriteToggle = async (game: EnhancedGame) => {
    try {
      await favoritesService.toggleFavorite(game);
      
      // Refresh the games list to update favorites status
      await refreshGamesData();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleConsentGiven = async (level: any) => {
    try {
      await privacyService.recordConsent(level);
      setShowConsentDialog(false);
      
      // Reload games to apply new privacy settings
      await loadGames(true);
    } catch (error) {
      console.error('Error recording consent:', error);
      setShowConsentDialog(false);
    }
  };

  const refreshGamesData = async () => {
    if (games && games.length > 0) {
      // Refresh favorites without reloading entire catalog
      const enhancedGames = favoritesService.enhanceGamesWithFavorites(games);
      setGames(enhancedGames);
      
      // Re-categorize games
      const categorized = categoryUtils.categorizeGames(enhancedGames, {
        includeFavorites: true,
        includeRecent: true,
        maxRecentDays: 7,
        minGamesPerCategory: 1,
        showEmptyCategories: false,
      });
      setCategorizedGames(categorized);
    }
  };

  const renderGameCard = ({ item }: { item: EnhancedGame }) => {
    console.log('Rendering game card for:', item?.title, item?.id);
    return (
      <GameCard 
        game={item} 
        onPress={() => handleGamePress(item)}
        onFavoriteToggle={privacyService.isFavoritesAllowed() ? handleFavoriteToggle : undefined}
        showFavorite={configService.isFeatureEnabled('favorites')}
        showPlayCount={true}
      />
    );
  };

  const renderCategoryHeader = ({ section }: { section: any }) => (
    <CategoryHeader 
      category={section.category}
      gameCount={section.gameCount}
    />
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading amazing games...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎮 GameLauncher</Text>
          <Text style={styles.headerSubtitle}>
            {games?.length || 0} games • {categorizedGames?.length || 0} categories
          </Text>
          {favoritesService?.getFavoritesCount() > 0 && (
            <Text style={styles.favoritesInfo}>
              ⭐ {favoritesService.getFavoritesCount()} favorites
            </Text>
          )}
          {__DEV__ && catalogSource !== 'bundled' && (
            <Text style={styles.debugInfo}>
              📡 {catalogSource === 'remote' ? 'Live Catalog' : 'Cached Catalog'}
            </Text>
          )}
        </View>
      </LinearGradient>
      
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📱 Offline - Showing cached games</Text>
        </View>
      )}
      
      <SectionList
        sections={(categorizedGames || []).map(categoryGroup => {
          console.log('Section data:', categoryGroup.category?.title, 'games:', categoryGroup.games?.length);
          return {
            title: categoryGroup.category?.title || 'Unknown Category',
            data: categoryGroup.games || [],
            category: categoryGroup.category,
            gameCount: categoryGroup.gameCount,
          };
        })}
        renderItem={renderGameCard}
        renderSectionHeader={renderCategoryHeader}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
            progressBackgroundColor="#fff"
          />
        }
        renderSectionFooter={({ section }) => (
          section.gameCount === 0 ? (
            <View style={styles.emptyCategoryContainer}>
              <Text style={styles.emptyCategoryText}>No games in this category yet</Text>
            </View>
          ) : null
        )}
      />

      {/* Privacy Consent Dialog */}
      <ConsentDialog
        visible={showConsentDialog}
        onConsentGiven={handleConsentGiven}
        onClose={() => setShowConsentDialog(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  favoritesInfo: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  debugInfo: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  offlineIndicator: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCategoryContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
});