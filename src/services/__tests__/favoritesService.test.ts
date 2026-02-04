import { favoritesService } from '../favoritesService';
import { storageService } from '../storageService';
import { privacyService } from '../privacyService';
import { configService } from '../configService';
import { analyticsService } from '../analyticsService';
import { Game } from '../../types';

// Mock dependencies
jest.mock('../storageService');
jest.mock('../privacyService');
jest.mock('../configService');
jest.mock('../analyticsService');

describe('FavoritesService', () => {
  const mockGame: Game = {
    id: 'test-game-1',
    title: 'Test Game',
    image: 'https://example.com/image.png',
    url: 'https://example.com/game',
    category: 'puzzle',
    description: 'A test game',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (favoritesService as any).favorites = new Map();
    (favoritesService as any).gameStats = {};
    (favoritesService as any).initialized = false;
    
    // Default mocks
    (privacyService.isFavoritesAllowed as jest.Mock).mockReturnValue(true);
    (privacyService.isAnalyticsAllowed as jest.Mock).mockReturnValue(true);
    (configService.isFeatureEnabled as jest.Mock).mockReturnValue(true);
    (storageService.getItem as jest.Mock).mockResolvedValue(null);
    (storageService.setItem as jest.Mock).mockResolvedValue(undefined);
    (storageService.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should initialize successfully with no stored data', async () => {
      await favoritesService.initialize();
      
      expect(storageService.getItem).toHaveBeenCalledWith('@user_favorites');
      expect(storageService.getItem).toHaveBeenCalledWith('@game_statistics');
      expect(storageService.getItem).toHaveBeenCalledWith('@favorites_metadata');
    });

    it('should skip initialization if favorites not allowed', async () => {
      (privacyService.isFavoritesAllowed as jest.Mock).mockReturnValue(false);
      
      await favoritesService.initialize();
      
      expect(storageService.getItem).not.toHaveBeenCalled();
    });

    it('should load stored favorites correctly', async () => {
      const storedFavorites = [{
        gameId: 'game-1',
        dateAdded: Date.now(),
        playCount: 5,
      }];
      
      (storageService.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@user_favorites') {
          return Promise.resolve(JSON.stringify(storedFavorites));
        }
        return Promise.resolve(null);
      });
      
      await favoritesService.initialize();
      
      expect(favoritesService.isFavorite('game-1')).toBe(true);
      expect(favoritesService.getFavoritesCount()).toBe(1);
    });
  });

  describe('addFavorite', () => {
    it('should add a game to favorites successfully', async () => {
      await favoritesService.initialize();
      
      const result = await favoritesService.addFavorite(mockGame);
      
      expect(result).toBe(true);
      expect(favoritesService.isFavorite(mockGame.id)).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        '@user_favorites',
        expect.stringContaining(mockGame.id)
      );
    });

    it('should reject adding favorite when privacy not allowed', async () => {
      (privacyService.isFavoritesAllowed as jest.Mock).mockReturnValue(false);
      
      const result = await favoritesService.addFavorite(mockGame);
      
      expect(result).toBe(false);
      expect(favoritesService.isFavorite(mockGame.id)).toBe(false);
    });

    it('should log analytics when adding favorite', async () => {
      await favoritesService.initialize();
      
      await favoritesService.addFavorite(mockGame);
      
      expect(analyticsService.logEvent).toHaveBeenCalledWith('favorite_added', {
        game_id: mockGame.id,
        game_title: mockGame.title,
        total_favorites: 1,
        category: mockGame.category,
      });
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite successfully', async () => {
      await favoritesService.initialize();
      await favoritesService.addFavorite(mockGame);
      
      const result = await favoritesService.removeFavorite(mockGame.id);
      
      expect(result).toBe(true);
      expect(favoritesService.isFavorite(mockGame.id)).toBe(false);
    });

    it('should return false when removing non-existent favorite', async () => {
      await favoritesService.initialize();
      
      const result = await favoritesService.removeFavorite('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite when not already favorited', async () => {
      await favoritesService.initialize();
      
      const result = await favoritesService.toggleFavorite(mockGame);
      
      expect(result).toBe(true);
      expect(favoritesService.isFavorite(mockGame.id)).toBe(true);
    });

    it('should remove favorite when already favorited', async () => {
      await favoritesService.initialize();
      await favoritesService.addFavorite(mockGame);
      
      const result = await favoritesService.toggleFavorite(mockGame);
      
      expect(result).toBe(true);
      expect(favoritesService.isFavorite(mockGame.id)).toBe(false);
    });
  });

  describe('recordGamePlay', () => {
    it('should record game play statistics', async () => {
      await favoritesService.initialize();
      
      await favoritesService.recordGamePlay(mockGame.id, 5000);
      
      const stats = favoritesService.getGameStatistics(mockGame.id);
      expect(stats).toBeTruthy();
      expect(stats?.playCount).toBe(1);
      expect(stats?.totalPlayTime).toBe(5000);
    });

    it('should increment play count on multiple plays', async () => {
      await favoritesService.initialize();
      
      await favoritesService.recordGamePlay(mockGame.id, 1000);
      await favoritesService.recordGamePlay(mockGame.id, 2000);
      
      const stats = favoritesService.getGameStatistics(mockGame.id);
      expect(stats?.playCount).toBe(2);
      expect(stats?.totalPlayTime).toBe(3000);
    });
  });

  describe('enhanceGamesWithFavorites', () => {
    it('should enhance games with favorite status', async () => {
      await favoritesService.initialize();
      await favoritesService.addFavorite(mockGame);
      
      const enhanced = favoritesService.enhanceGamesWithFavorites([mockGame]);
      
      expect(enhanced).toHaveLength(1);
      expect(enhanced[0].isFavorite).toBe(true);
    });

    it('should handle invalid games array gracefully', () => {
      const enhanced = favoritesService.enhanceGamesWithFavorites(null as any);
      
      expect(enhanced).toEqual([]);
    });
  });

  describe('clearAllFavorites', () => {
    it('should clear all favorites and statistics', async () => {
      await favoritesService.initialize();
      await favoritesService.addFavorite(mockGame);
      
      await favoritesService.clearAllFavorites();
      
      expect(favoritesService.getFavoritesCount()).toBe(0);
      expect(storageService.removeItem).toHaveBeenCalledWith('@user_favorites');
      expect(storageService.removeItem).toHaveBeenCalledWith('@game_statistics');
      expect(storageService.removeItem).toHaveBeenCalledWith('@favorites_metadata');
    });
  });
});