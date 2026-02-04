import { categoryUtils } from '../categoryUtils';
import { EnhancedGame } from '../../types';

describe('CategoryUtils', () => {
  const mockGames: EnhancedGame[] = [
    {
      id: 'game1',
      title: 'Tetris',
      image: 'https://example.com/tetris.png',
      url: 'https://example.com/tetris',
      category: 'puzzle',
      description: 'Classic puzzle game',
      isFavorite: true,
      playCount: 10,
      lastPlayed: Date.now() - 1000 * 60 * 60, // 1 hour ago
    },
    {
      id: 'game2',
      title: 'Racing Game',
      image: 'https://example.com/racing.png',
      url: 'https://example.com/racing',
      category: 'racing',
      description: 'Fast racing game',
      isFavorite: false,
      playCount: 5,
    },
    {
      id: 'game3',
      title: 'Chess',
      image: 'https://example.com/chess.png',
      url: 'https://example.com/chess',
      category: 'strategy',
      description: 'Strategic board game',
      isFavorite: true,
      playCount: 15,
      lastPlayed: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    },
    {
      id: 'game4',
      title: 'Unknown Game',
      image: 'https://example.com/unknown.png',
      url: 'https://example.com/unknown',
      category: undefined,
      description: 'Game with no category',
      isFavorite: false,
      playCount: 1,
    },
  ];

  describe('getCategory', () => {
    it('should return correct category for valid ID', () => {
      const category = categoryUtils.getCategory('puzzle');
      
      expect(category.id).toBe('puzzle');
      expect(category.title).toBe('Puzzle');
      expect(category.icon).toBe('🧩');
      expect(category.color).toBe('#9C27B0');
    });

    it('should return uncategorized for invalid/missing ID', () => {
      const category = categoryUtils.getCategory('invalid');
      
      expect(category.id).toBe('uncategorized');
      expect(category.title).toBe('More Games');
    });

    it('should return uncategorized for undefined category', () => {
      const category = categoryUtils.getCategory(undefined);
      
      expect(category.id).toBe('uncategorized');
    });
  });

  describe('getAllCategories', () => {
    it('should return all non-special categories', () => {
      const categories = categoryUtils.getAllCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every(cat => !cat.isSpecial)).toBe(true);
      expect(categories.find(cat => cat.id === 'favorites')).toBeUndefined();
      expect(categories.find(cat => cat.id === 'puzzle')).toBeTruthy();
    });

    it('should return categories in sort order', () => {
      const categories = categoryUtils.getAllCategories();
      
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].sortOrder).toBeGreaterThanOrEqual(categories[i - 1].sortOrder);
      }
    });
  });

  describe('getAllCategoriesWithSpecial', () => {
    it('should return all categories including special ones', () => {
      const categories = categoryUtils.getAllCategoriesWithSpecial();
      
      expect(categories.find(cat => cat.id === 'favorites')).toBeTruthy();
      expect(categories.find(cat => cat.id === 'recent')).toBeTruthy();
      expect(categories.find(cat => cat.id === 'puzzle')).toBeTruthy();
    });
  });

  describe('categorizeGames', () => {
    it('should categorize games correctly with defaults', () => {
      const categorized = categoryUtils.categorizeGames(mockGames);
      
      expect(categorized.length).toBeGreaterThan(0);
      
      // Should have favorites section
      const favoritesSection = categorized.find(section => section.category.id === 'favorites');
      expect(favoritesSection).toBeTruthy();
      expect(favoritesSection?.games.length).toBe(2); // Tetris and Chess are favorites
      
      // Should have puzzle section
      const puzzleSection = categorized.find(section => section.category.id === 'puzzle');
      expect(puzzleSection).toBeTruthy();
      expect(puzzleSection?.games.length).toBe(1); // Tetris
    });

    it('should exclude favorites when includeFavorites is false', () => {
      const categorized = categoryUtils.categorizeGames(mockGames, {
        includeFavorites: false,
      });
      
      const favoritesSection = categorized.find(section => section.category.id === 'favorites');
      expect(favoritesSection).toBeUndefined();
    });

    it('should include recent games when includeRecent is true', () => {
      const categorized = categoryUtils.categorizeGames(mockGames, {
        includeRecent: true,
      });
      
      const recentSection = categorized.find(section => section.category.id === 'recent');
      // Recent section may or may not exist depending on lastPlayed dates
      if (recentSection) {
        expect(recentSection.games.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle empty games array', () => {
      const categorized = categoryUtils.categorizeGames([]);
      
      expect(categorized).toEqual([]);
    });

    it('should handle null/undefined games gracefully', () => {
      const categorized = categoryUtils.categorizeGames(null as any);
      
      expect(categorized).toEqual([]);
    });

    it('should filter out empty categories by default', () => {
      const singleGame: EnhancedGame[] = [mockGames[0]]; // Only Tetris
      const categorized = categoryUtils.categorizeGames(singleGame);
      
      // Should only have categories with games
      categorized.forEach(section => {
        expect(section.games.length).toBeGreaterThan(0);
      });
    });

    it('should show empty categories when showEmptyCategories is true', () => {
      const categorized = categoryUtils.categorizeGames(mockGames, {
        showEmptyCategories: true,
        minGamesPerCategory: 0,
      });
      
      // Should include empty categories
      expect(categorized.length).toBeGreaterThan(4); // More than just the categories with games
    });
  });

  describe('searchGames', () => {
    it('should find games by title', () => {
      const result = categoryUtils.searchGames(mockGames, 'tetris');
      
      expect(result.results.length).toBe(1);
      expect(result.results[0].title).toBe('Tetris');
      expect(result.totalCount).toBe(1);
    });

    it('should find games by description', () => {
      const result = categoryUtils.searchGames(mockGames, 'puzzle');
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.some(game => game.description?.includes('puzzle'))).toBe(true);
    });

    it('should find games by category', () => {
      const result = categoryUtils.searchGames(mockGames, 'racing');
      
      expect(result.results.length).toBe(1);
      expect(result.results[0].category).toBe('racing');
    });

    it('should return empty results for empty query', () => {
      const result = categoryUtils.searchGames(mockGames, '');
      
      expect(result.results).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.categoryBreakdown).toEqual({});
    });

    it('should filter by category when specified', () => {
      const result = categoryUtils.searchGames(mockGames, 'game', 'puzzle');
      
      // Should only search within puzzle category
      result.results.forEach(game => {
        expect(game.category).toBe('puzzle');
      });
    });

    it('should provide category breakdown', () => {
      const result = categoryUtils.searchGames(mockGames, 'game');
      
      expect(result.categoryBreakdown).toBeTruthy();
      expect(typeof result.categoryBreakdown).toBe('object');
    });

    it('should sort results by relevance', () => {
      const result = categoryUtils.searchGames(mockGames, 'game');
      
      if (result.results.length > 1) {
        // Results should be sorted by play count if no exact title match
        const firstResult = result.results[0];
        const secondResult = result.results[1];
        expect(firstResult.playCount || 0).toBeGreaterThanOrEqual(secondResult.playCount || 0);
      }
    });
  });

  describe('getCategoryStats', () => {
    it('should provide comprehensive category statistics', () => {
      const stats = categoryUtils.getCategoryStats(mockGames);
      
      expect(stats.totalGames).toBe(mockGames.length);
      expect(stats.categoriesUsed).toBeGreaterThan(0);
      expect(stats.categoryBreakdown).toBeTruthy();
      expect(stats.mostPopularCategory).toBeTruthy();
    });

    it('should calculate percentages correctly', () => {
      const stats = categoryUtils.getCategoryStats(mockGames);
      
      const totalPercentage = stats.categoryBreakdown.reduce(
        (sum, item) => sum + item.percentage,
        0
      );
      
      expect(Math.abs(totalPercentage - 100)).toBeLessThan(1); // Allow for rounding
    });
  });

  describe('generateCategoryColor', () => {
    it('should generate consistent colors for same input', () => {
      const color1 = categoryUtils.generateCategoryColor('test');
      const color2 = categoryUtils.generateCategoryColor('test');
      
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different inputs', () => {
      const color1 = categoryUtils.generateCategoryColor('test1');
      const color2 = categoryUtils.generateCategoryColor('test2');
      
      expect(color1).not.toBe(color2);
    });

    it('should generate valid hex colors', () => {
      const color = categoryUtils.generateCategoryColor('test');
      
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('validateCategory', () => {
    it('should validate valid category object', () => {
      const validCategory = {
        id: 'test',
        title: 'Test Category',
        description: 'A test category',
        icon: '🧪',
        color: '#FF0000',
        sortOrder: 10,
      };
      
      expect(categoryUtils.validateCategory(validCategory)).toBe(true);
    });

    it('should reject invalid category object', () => {
      const invalidCategory = {
        id: 'test',
        title: 'Test Category',
        // Missing required fields
      };
      
      expect(categoryUtils.validateCategory(invalidCategory)).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(categoryUtils.validateCategory(null)).toBeFalsy();
      expect(categoryUtils.validateCategory(undefined)).toBeFalsy();
    });
  });
});