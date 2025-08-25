import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, RefreshControl, StatusBar, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { GameCard } from '../components/GameCard';
import { storageService } from '../services/storageService';
import { orientationUtils } from '../utils/orientation';
import { analyticsService } from '../services/analyticsService';
import { Game, RootStackParamList } from '../types';
import gamesData from '../data/games.json';

type GameListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameList'>;

interface Props {
  navigation: GameListScreenNavigationProp;
}

export const GameListScreen: React.FC<Props> = ({ navigation }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadGames();
    
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
    let fromCache = false;
    let gamesCount = 0;
    
    try {
      if (forceRefresh) {
        await storageService.clearCache();
      }
      
      const cachedGames = await storageService.getCachedGames();
      
      if (cachedGames && !forceRefresh) {
        setGames(cachedGames);
        fromCache = true;
        gamesCount = cachedGames.length;
        const loadTime = Date.now() - startTime;
        console.log(`Games loaded from cache in ${loadTime}ms`);
      } else {
        const gamesFromJson = gamesData as Game[];
        setGames(gamesFromJson);
        gamesCount = gamesFromJson.length;
        
        storageService.cacheGames(gamesFromJson);
        const loadTime = Date.now() - startTime;
        console.log(`Games loaded from JSON and cached in ${loadTime}ms`);
      }

      // Log catalog_loaded event
      const loadTime = Date.now() - startTime;
      analyticsService.logCatalogLoaded(
        gamesCount,
        loadTime,
        fromCache,
        isOffline ? 'offline' : 'online'
      );

    } catch (error) {
      console.error('Error loading games:', error);
      const gamesFromJson = gamesData as Game[];
      setGames(gamesFromJson);
      gamesCount = gamesFromJson.length;

      // Log catalog_loaded event even for fallback
      const loadTime = Date.now() - startTime;
      analyticsService.logCatalogLoaded(
        gamesCount,
        loadTime,
        false, // Not from cache since there was an error
        isOffline ? 'offline' : 'online'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGames(true);
  };

  const handleGamePress = (game: Game) => {
    navigation.navigate('GameView', { game });
  };

  const renderGameCard = ({ item }: { item: Game }) => (
    <GameCard 
      game={item} 
      onPress={() => handleGamePress(item)} 
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
            {games.length} amazing games to play
          </Text>
        </View>
      </LinearGradient>
      
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📱 Offline - Showing cached games</Text>
        </View>
      )}
      
      <FlatList
        data={games}
        renderItem={renderGameCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
            progressBackgroundColor="#fff"
          />
        }
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
});