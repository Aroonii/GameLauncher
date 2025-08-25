import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types';

const GAMES_CACHE_KEY = '@games_cache';
const CACHE_TIMESTAMP_KEY = '@games_cache_timestamp';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const storageService = {
  async cacheGames(games: Game[]): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      const jsonValue = JSON.stringify(games);
      
      await Promise.all([
        AsyncStorage.setItem(GAMES_CACHE_KEY, jsonValue),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp)
      ]);
    } catch (error) {
      console.error('Error caching games:', error);
    }
  },

  async getCachedGames(): Promise<Game[] | null> {
    try {
      const startTime = Date.now();
      
      const [jsonValue, timestampValue] = await Promise.all([
        AsyncStorage.getItem(GAMES_CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)
      ]);
      
      if (jsonValue != null && timestampValue != null) {
        const cacheAge = Date.now() - parseInt(timestampValue);
        
        if (cacheAge > CACHE_EXPIRY_MS) {
          await this.clearCache();
          return null;
        }
        
        const games = JSON.parse(jsonValue);
        const loadTime = Date.now() - startTime;
        console.log(`Cache loaded in ${loadTime}ms`);
        
        return games;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached games:', error);
      await this.clearCache();
      return null;
    }
  },

  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(GAMES_CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  async isCacheValid(): Promise<boolean> {
    try {
      const timestampValue = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestampValue) return false;
      
      const cacheAge = Date.now() - parseInt(timestampValue);
      return cacheAge <= CACHE_EXPIRY_MS;
    } catch (error) {
      return false;
    }
  }
};