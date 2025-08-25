import { Game, EnhancedGame } from '../types';

// Category definitions and utilities
export interface GameCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  isSpecial?: boolean; // For favorites, recent, etc.
}

export interface CategorizedGames {
  category: GameCategory;
  games: EnhancedGame[];
  gameCount: number;
}

// Default categories with consistent styling
export const DEFAULT_CATEGORIES: GameCategory[] = [
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Your favorite games',
    icon: '⭐',
    color: '#FFD700',
    sortOrder: 0,
    isSpecial: true,
  },
  {
    id: 'recent',
    title: 'Recently Played',
    description: 'Games you played recently',
    icon: '🕒',
    color: '#4CAF50',
    sortOrder: 1,
    isSpecial: true,
  },
  {
    id: 'action',
    title: 'Action',
    description: 'Fast-paced action games',
    icon: '⚔️',
    color: '#F44336',
    sortOrder: 10,
  },
  {
    id: 'adventure',
    title: 'Adventure',
    description: 'Explore worlds and solve puzzles',
    icon: '🗺️',
    color: '#FF9800',
    sortOrder: 11,
  },
  {
    id: 'puzzle',
    title: 'Puzzle',
    description: 'Brain teasers and logic games',
    icon: '🧩',
    color: '#9C27B0',
    sortOrder: 12,
  },
  {
    id: 'arcade',
    title: 'Arcade',
    description: 'Classic arcade-style games',
    icon: '🕹️',
    color: '#2196F3',
    sortOrder: 13,
  },
  {
    id: 'strategy',
    title: 'Strategy',
    description: 'Think and plan your moves',
    icon: '🧠',
    color: '#607D8B',
    sortOrder: 14,
  },
  {
    id: 'sports',
    title: 'Sports',
    description: 'Athletic and competitive games',
    icon: '⚽',
    color: '#8BC34A',
    sortOrder: 15,
  },
  {
    id: 'racing',
    title: 'Racing',
    description: 'High-speed racing games',
    icon: '🏎️',
    color: '#FF5722',
    sortOrder: 16,
  },
  {
    id: 'casual',
    title: 'Casual',
    description: 'Easy to play, fun for everyone',
    icon: '😊',
    color: '#FFEB3B',
    sortOrder: 17,
  },
  {
    id: 'uncategorized',
    title: 'More Games',
    description: 'Other great games',
    icon: '🎮',
    color: '#795548',
    sortOrder: 99,
  },
];

class CategoryUtils {
  private categoriesMap: Map<string, GameCategory>;

  constructor() {
    this.categoriesMap = new Map();
    DEFAULT_CATEGORIES.forEach(category => {
      this.categoriesMap.set(category.id, category);
    });
  }

  /**
   * Get category by ID, with fallback to uncategorized
   */
  getCategory(categoryId: string | undefined): GameCategory {
    if (!categoryId) {
      return this.categoriesMap.get('uncategorized')!;
    }

    const category = this.categoriesMap.get(categoryId.toLowerCase());
    return category || this.categoriesMap.get('uncategorized')!;
  }

  /**
   * Get all available categories
   */
  getAllCategories(): GameCategory[] {
    return Array.from(this.categoriesMap.values())
      .filter(cat => !cat.isSpecial)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get all categories including special ones
   */
  getAllCategoriesWithSpecial(): GameCategory[] {
    return Array.from(this.categoriesMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Add custom category
   */
  addCategory(category: GameCategory): void {
    this.categoriesMap.set(category.id, category);
  }

  /**
   * Remove custom category
   */
  removeCategory(categoryId: string): boolean {
    const category = this.categoriesMap.get(categoryId);
    if (category && !this.isBuiltInCategory(categoryId)) {
      this.categoriesMap.delete(categoryId);
      return true;
    }
    return false;
  }

  /**
   * Check if category is built-in
   */
  private isBuiltInCategory(categoryId: string): boolean {
    return DEFAULT_CATEGORIES.some(cat => cat.id === categoryId);
  }

  /**
   * Categorize games into groups
   */
  categorizeGames(
    games: EnhancedGame[],
    options: {
      includeFavorites?: boolean;
      includeRecent?: boolean;
      maxRecentDays?: number;
      minGamesPerCategory?: number;
      showEmptyCategories?: boolean;
    } = {}
  ): CategorizedGames[] {
    if (!games || !Array.isArray(games)) {
      console.warn('categorizeGames called with invalid games array');
      return [];
    }

    const {
      includeFavorites = true,
      includeRecent = true,
      maxRecentDays = 7,
      minGamesPerCategory = 1,
      showEmptyCategories = false,
    } = options;

    const categorizedMap = new Map<string, EnhancedGame[]>();
    const now = Date.now();
    const recentThreshold = now - (maxRecentDays * 24 * 60 * 60 * 1000);

    // Initialize all categories
    this.getAllCategoriesWithSpecial().forEach(category => {
      if (!category.isSpecial) {
        categorizedMap.set(category.id, []);
      }
    });

    // Categorize regular games
    games.forEach(game => {
      const categoryId = game.category?.toLowerCase() || 'uncategorized';
      if (!categorizedMap.has(categoryId)) {
        categorizedMap.set(categoryId, []);
      }
      categorizedMap.get(categoryId)!.push(game);
    });

    // Build categorized games array
    const result: CategorizedGames[] = [];

    // Add favorites section if requested and has favorites
    if (includeFavorites) {
      const favoriteGames = games.filter(game => game.isFavorite);
      if (favoriteGames.length > 0) {
        result.push({
          category: this.getCategory('favorites'),
          games: this.sortGamesInCategory(favoriteGames, 'favorites'),
          gameCount: favoriteGames.length,
        });
      }
    }

    // Add recent section if requested and has recent games
    if (includeRecent) {
      const recentGames = games
        .filter(game => 
          game.lastPlayed && 
          game.lastPlayed > recentThreshold &&
          !game.isFavorite // Don't duplicate with favorites
        )
        .slice(0, 10); // Limit to 10 recent games

      if (recentGames.length > 0) {
        result.push({
          category: this.getCategory('recent'),
          games: this.sortGamesInCategory(recentGames, 'recent'),
          gameCount: recentGames.length,
        });
      }
    }

    // Add regular categories
    const sortedCategories = this.getAllCategories();
    
    for (const category of sortedCategories) {
      const categoryGames = categorizedMap.get(category.id) || [];
      
      if (categoryGames.length >= minGamesPerCategory || showEmptyCategories) {
        result.push({
          category,
          games: this.sortGamesInCategory(categoryGames, category.id),
          gameCount: categoryGames.length,
        });
      }
    }

    return result;
  }

  /**
   * Sort games within a category
   */
  private sortGamesInCategory(games: EnhancedGame[], categoryId: string): EnhancedGame[] {
    switch (categoryId) {
      case 'favorites':
        // Sort favorites by date added (most recent first)
        return games.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
        
      case 'recent':
        // Sort recent by last played time (most recent first)
        return games.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
        
      default:
        // Sort by play count (most played first), then alphabetically
        return games.sort((a, b) => {
          const playCountDiff = (b.playCount || 0) - (a.playCount || 0);
          if (playCountDiff !== 0) return playCountDiff;
          return a.title.localeCompare(b.title);
        });
    }
  }

  /**
   * Get games by category ID
   */
  getGamesByCategory(games: EnhancedGame[], categoryId: string): EnhancedGame[] {
    switch (categoryId) {
      case 'favorites':
        return games.filter(game => game.isFavorite);
        
      case 'recent':
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return games
          .filter(game => game.lastPlayed && game.lastPlayed > weekAgo)
          .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
          .slice(0, 10);
          
      default:
        return games.filter(game => 
          (game.category?.toLowerCase() || 'uncategorized') === categoryId
        );
    }
  }

  /**
   * Search games within categories
   */
  searchGames(
    games: EnhancedGame[],
    query: string,
    categoryFilter?: string
  ): { results: EnhancedGame[]; totalCount: number; categoryBreakdown: Record<string, number> } {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return {
        results: [],
        totalCount: 0,
        categoryBreakdown: {},
      };
    }

    let filteredGames = games;
    
    // Apply category filter if specified
    if (categoryFilter && categoryFilter !== 'all') {
      filteredGames = this.getGamesByCategory(games, categoryFilter);
    }

    // Search in title and description
    const searchResults = filteredGames.filter(game => {
      const titleMatch = game.title.toLowerCase().includes(normalizedQuery);
      const descMatch = game.description?.toLowerCase().includes(normalizedQuery);
      const categoryMatch = game.category?.toLowerCase().includes(normalizedQuery);
      
      return titleMatch || descMatch || categoryMatch;
    });

    // Create category breakdown
    const categoryBreakdown: Record<string, number> = {};
    searchResults.forEach(game => {
      const categoryId = game.category?.toLowerCase() || 'uncategorized';
      categoryBreakdown[categoryId] = (categoryBreakdown[categoryId] || 0) + 1;
    });

    // Sort results by relevance (title matches first, then by play count)
    const sortedResults = searchResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      const aTitleExact = aTitle === normalizedQuery;
      const bTitleExact = bTitle === normalizedQuery;
      
      if (aTitleExact && !bTitleExact) return -1;
      if (!aTitleExact && bTitleExact) return 1;
      
      const aTitleStart = aTitle.startsWith(normalizedQuery);
      const bTitleStart = bTitle.startsWith(normalizedQuery);
      
      if (aTitleStart && !bTitleStart) return -1;
      if (!aTitleStart && bTitleStart) return 1;
      
      // Sort by play count as tiebreaker
      return (b.playCount || 0) - (a.playCount || 0);
    });

    return {
      results: sortedResults,
      totalCount: searchResults.length,
      categoryBreakdown,
    };
  }

  /**
   * Get category statistics
   */
  getCategoryStats(games: EnhancedGame[]): {
    totalGames: number;
    categoriesUsed: number;
    categoryBreakdown: Array<{
      category: GameCategory;
      gameCount: number;
      percentage: number;
    }>;
    mostPopularCategory: string;
  } {
    const categoryCount = new Map<string, number>();
    
    games.forEach(game => {
      const categoryId = game.category?.toLowerCase() || 'uncategorized';
      categoryCount.set(categoryId, (categoryCount.get(categoryId) || 0) + 1);
    });

    const breakdown = Array.from(categoryCount.entries())
      .map(([categoryId, count]) => ({
        category: this.getCategory(categoryId),
        gameCount: count,
        percentage: Math.round((count / games.length) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.gameCount - a.gameCount);

    const mostPopular = breakdown.length > 0 ? breakdown[0].category.id : 'uncategorized';

    return {
      totalGames: games.length,
      categoriesUsed: categoryCount.size,
      categoryBreakdown: breakdown,
      mostPopularCategory: mostPopular,
    };
  }

  /**
   * Generate category color based on hash
   */
  generateCategoryColor(categoryName: string): string {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7',
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    ];
    
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Validate category structure
   */
  validateCategory(category: any): category is GameCategory {
    return (
      category &&
      typeof category === 'object' &&
      typeof category.id === 'string' &&
      typeof category.title === 'string' &&
      typeof category.description === 'string' &&
      typeof category.icon === 'string' &&
      typeof category.color === 'string' &&
      typeof category.sortOrder === 'number'
    );
  }
}

export const categoryUtils = new CategoryUtils();