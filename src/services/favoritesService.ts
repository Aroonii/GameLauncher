import { Game, EnhancedGame } from '../types';
import { storageService } from './storageService';
import { privacyService } from './privacyService';
import { analyticsService } from './analyticsService';
import { configService } from './configService';

// Favorites storage keys
const FAVORITES_KEY = '@user_favorites';
const FAVORITES_METADATA_KEY = '@favorites_metadata';
const GAME_STATS_KEY = '@game_statistics';

export interface FavoriteGame {
  gameId: string;
  dateAdded: number;
  lastPlayed?: number;
  playCount: number;
}

export interface GameStatistics {
  [gameId: string]: {
    playCount: number;
    totalPlayTime: number; // in milliseconds
    lastPlayed: number;
    firstPlayed: number;
  };
}

export interface FavoritesMetadata {
  version: string;
  lastUpdated: number;
  totalFavorites: number;
  mostPlayedGameId?: string;
  averagePlayCount: number;
}

const CURRENT_FAVORITES_VERSION = '1.0.0';

class FavoritesService {
  private favorites: Map<string, FavoriteGame> = new Map();
  private gameStats: GameStatistics = {};
  private metadata: FavoritesMetadata | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if favorites are allowed by privacy settings
      if (!privacyService.isFavoritesAllowed()) {
        console.log('Favorites disabled by privacy settings');
        this.initialized = true;
        return;
      }

      // Load stored favorites and statistics
      await Promise.all([
        this.loadStoredFavorites(),
        this.loadGameStatistics(),
        this.loadMetadata(),
      ]);

      this.initialized = true;
      console.log(`Favorites service initialized with ${this.favorites.size} favorites`);
    } catch (error) {
      console.error('Error initializing favorites service:', error);
      this.initialized = true; // Continue without stored data
    }
  }

  private async loadStoredFavorites(): Promise<void> {
    try {
      const favoritesStr = await storageService.getItem(FAVORITES_KEY);
      if (favoritesStr) {
        const storedFavorites = JSON.parse(favoritesStr) as FavoriteGame[];
        
        // Validate and load favorites
        for (const favorite of storedFavorites) {
          if (this.validateFavoriteStructure(favorite)) {
            this.favorites.set(favorite.gameId, favorite);
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored favorites:', error);
      await storageService.removeItem(FAVORITES_KEY);
    }
  }

  private async loadGameStatistics(): Promise<void> {
    try {
      const statsStr = await storageService.getItem(GAME_STATS_KEY);
      if (statsStr) {
        const stats = JSON.parse(statsStr) as GameStatistics;
        this.gameStats = stats || {};
      }
    } catch (error) {
      console.error('Error loading game statistics:', error);
      this.gameStats = {};
    }
  }

  private async loadMetadata(): Promise<void> {
    try {
      const metadataStr = await storageService.getItem(FAVORITES_METADATA_KEY);
      if (metadataStr) {
        this.metadata = JSON.parse(metadataStr) as FavoritesMetadata;
      }
    } catch (error) {
      console.error('Error loading favorites metadata:', error);
    }
  }

  private validateFavoriteStructure(favorite: any): favorite is FavoriteGame {
    return (
      favorite &&
      typeof favorite === 'object' &&
      typeof favorite.gameId === 'string' &&
      typeof favorite.dateAdded === 'number' &&
      typeof favorite.playCount === 'number' &&
      favorite.gameId.length > 0
    );
  }

  async addFavorite(game: Game): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!privacyService.isFavoritesAllowed()) {
      console.warn('Cannot add favorite: not allowed by privacy settings');
      return false;
    }

    try {
      const now = Date.now();
      const favorite: FavoriteGame = {
        gameId: game.id,
        dateAdded: now,
        playCount: this.gameStats[game.id]?.playCount || 0,
        lastPlayed: this.gameStats[game.id]?.lastPlayed,
      };

      this.favorites.set(game.id, favorite);
      await this.persistFavorites();
      await this.updateMetadata();

      // Log analytics event
      if (configService.isFeatureEnabled('analytics') && privacyService.isAnalyticsAllowed()) {
        analyticsService.logEvent('favorite_added', {
          game_id: game.id,
          game_title: game.title,
          total_favorites: this.favorites.size,
          category: game.category || 'uncategorized',
        });
      }

      console.log(`Added game to favorites: ${game.title}`);
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  async removeFavorite(gameId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.favorites.has(gameId)) {
      return false;
    }

    try {
      const favorite = this.favorites.get(gameId);
      this.favorites.delete(gameId);
      
      await this.persistFavorites();
      await this.updateMetadata();

      // Log analytics event
      if (configService.isFeatureEnabled('analytics') && privacyService.isAnalyticsAllowed()) {
        analyticsService.logEvent('favorite_removed', {
          game_id: gameId,
          total_favorites: this.favorites.size,
          days_favorited: favorite ? Math.floor((Date.now() - favorite.dateAdded) / (24 * 60 * 60 * 1000)) : 0,
        });
      }

      console.log(`Removed game from favorites: ${gameId}`);
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async toggleFavorite(game: Game): Promise<boolean> {
    const isFavorite = this.isFavorite(game.id);
    return isFavorite ? await this.removeFavorite(game.id) : await this.addFavorite(game);
  }

  isFavorite(gameId: string): boolean {
    return this.favorites.has(gameId);
  }

  getFavorites(): FavoriteGame[] {
    return Array.from(this.favorites.values())
      .sort((a, b) => b.dateAdded - a.dateAdded); // Most recent first
  }

  getFavoriteGames(allGames: Game[]): Game[] {
    const favoriteIds = new Set(this.favorites.keys());
    return allGames
      .filter(game => favoriteIds.has(game.id))
      .sort((a, b) => {
        const favoriteA = this.favorites.get(a.id)!;
        const favoriteB = this.favorites.get(b.id)!;
        return favoriteB.dateAdded - favoriteA.dateAdded;
      });
  }

  // Game statistics methods
  async recordGamePlay(gameId: string, playTimeMs: number = 0): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!privacyService.isFavoritesAllowed()) {
      return; // Don't record stats if not allowed
    }

    try {
      const now = Date.now();
      
      if (!this.gameStats[gameId]) {
        this.gameStats[gameId] = {
          playCount: 0,
          totalPlayTime: 0,
          lastPlayed: now,
          firstPlayed: now,
        };
      }

      this.gameStats[gameId].playCount += 1;
      this.gameStats[gameId].totalPlayTime += playTimeMs;
      this.gameStats[gameId].lastPlayed = now;

      // Update favorite if it exists
      if (this.favorites.has(gameId)) {
        const favorite = this.favorites.get(gameId)!;
        favorite.lastPlayed = now;
        favorite.playCount = this.gameStats[gameId].playCount;
      }

      await Promise.all([
        this.persistGameStatistics(),
        this.persistFavorites(),
        this.updateMetadata(),
      ]);

      console.log(`Recorded play for game ${gameId}: ${this.gameStats[gameId].playCount} plays`);
    } catch (error) {
      console.error('Error recording game play:', error);
    }
  }

  getGameStatistics(gameId: string) {
    return this.gameStats[gameId] || null;
  }

  getMostPlayedGames(limit: number = 10): Array<{ gameId: string; playCount: number; totalPlayTime: number }> {
    return Object.entries(this.gameStats)
      .map(([gameId, stats]) => ({
        gameId,
        playCount: stats.playCount,
        totalPlayTime: stats.totalPlayTime,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  getRecentlyPlayedGames(limit: number = 10): Array<{ gameId: string; lastPlayed: number }> {
    return Object.entries(this.gameStats)
      .map(([gameId, stats]) => ({
        gameId,
        lastPlayed: stats.lastPlayed,
      }))
      .sort((a, b) => b.lastPlayed - a.lastPlayed)
      .slice(0, limit);
  }

  // Enhanced games with favorites and stats
  enhanceGamesWithFavorites(games: Game[]): EnhancedGame[] {
    if (!games || !Array.isArray(games)) {
      console.warn('enhanceGamesWithFavorites called with invalid games array');
      return [];
    }
    
    return games.map(game => ({
      ...game,
      isFavorite: this.isFavorite(game.id),
      lastPlayed: this.gameStats[game.id]?.lastPlayed,
      playCount: this.gameStats[game.id]?.playCount || 0,
    }));
  }

  // Persistence methods
  private async persistFavorites(): Promise<void> {
    try {
      const favoritesArray = Array.from(this.favorites.values());
      await storageService.setItem(FAVORITES_KEY, JSON.stringify(favoritesArray));
    } catch (error) {
      console.error('Error persisting favorites:', error);
      throw error;
    }
  }

  private async persistGameStatistics(): Promise<void> {
    try {
      await storageService.setItem(GAME_STATS_KEY, JSON.stringify(this.gameStats));
    } catch (error) {
      console.error('Error persisting game statistics:', error);
      throw error;
    }
  }

  private async updateMetadata(): Promise<void> {
    try {
      const mostPlayedGames = this.getMostPlayedGames(1);
      const totalPlayCounts = Object.values(this.gameStats).reduce((sum, stats) => sum + stats.playCount, 0);

      this.metadata = {
        version: CURRENT_FAVORITES_VERSION,
        lastUpdated: Date.now(),
        totalFavorites: this.favorites.size,
        mostPlayedGameId: mostPlayedGames.length > 0 ? mostPlayedGames[0].gameId : undefined,
        averagePlayCount: this.favorites.size > 0 ? totalPlayCounts / this.favorites.size : 0,
      };

      await storageService.setItem(FAVORITES_METADATA_KEY, JSON.stringify(this.metadata));

      // Log analytics for favorites count
      if (configService.isFeatureEnabled('analytics') && privacyService.isAnalyticsAllowed()) {
        analyticsService.logEvent('favorites_count', {
          total_favorites: this.metadata.totalFavorites,
          average_play_count: Math.round(this.metadata.averagePlayCount * 100) / 100,
          most_played_game: this.metadata.mostPlayedGameId,
        });
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  }

  // Data management
  async clearAllFavorites(): Promise<void> {
    try {
      this.favorites.clear();
      this.gameStats = {};
      this.metadata = null;

      await Promise.all([
        storageService.removeItem(FAVORITES_KEY),
        storageService.removeItem(GAME_STATS_KEY),
        storageService.removeItem(FAVORITES_METADATA_KEY),
      ]);

      console.log('All favorites and statistics cleared');
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }

  // Import/Export for migration
  async exportFavoritesData(): Promise<{
    favorites: FavoriteGame[];
    statistics: GameStatistics;
    metadata: FavoritesMetadata | null;
  }> {
    return {
      favorites: Array.from(this.favorites.values()),
      statistics: { ...this.gameStats },
      metadata: this.metadata ? { ...this.metadata } : null,
    };
  }

  async importFavoritesData(data: {
    favorites: FavoriteGame[];
    statistics: GameStatistics;
    metadata: FavoritesMetadata | null;
  }): Promise<void> {
    try {
      // Validate and import favorites
      this.favorites.clear();
      for (const favorite of data.favorites) {
        if (this.validateFavoriteStructure(favorite)) {
          this.favorites.set(favorite.gameId, favorite);
        }
      }

      // Import statistics
      this.gameStats = data.statistics || {};

      // Import metadata
      this.metadata = data.metadata;

      // Persist all data
      await Promise.all([
        this.persistFavorites(),
        this.persistGameStatistics(),
        this.updateMetadata(),
      ]);

      console.log(`Imported ${this.favorites.size} favorites and statistics`);
    } catch (error) {
      console.error('Error importing favorites data:', error);
      throw error;
    }
  }

  // Utility methods
  getFavoritesCount(): number {
    return this.favorites.size;
  }

  getMetadata(): FavoritesMetadata | null {
    return this.metadata ? { ...this.metadata } : null;
  }
}

export const favoritesService = new FavoritesService();