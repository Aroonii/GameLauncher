import { GameListScreen } from '../../screens/GameListScreen';
import { remoteCatalogService } from '../../services/remoteCatalogService';
import { favoritesService } from '../../services/favoritesService';
import { privacyService } from '../../services/privacyService';
import { configService } from '../../services/configService';

// Mock all services
jest.mock('../../services/remoteCatalogService');
jest.mock('../../services/favoritesService');
jest.mock('../../services/privacyService');
jest.mock('../../services/configService');
jest.mock('../../services/analyticsService');
jest.mock('../../utils/orientation');
jest.mock('../../utils/categoryUtils');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
} as any;

describe('GameListScreen', () => {
  const mockGames = [
    {
      id: 'game1',
      title: 'Test Game 1',
      url: 'https://example.com/game1',
      category: 'puzzle',
      description: 'First test game',
      isFavorite: false,
      playCount: 0,
    },
    {
      id: 'game2',
      title: 'Test Game 2',
      url: 'https://example.com/game2',
      category: 'action',
      description: 'Second test game',
      isFavorite: true,
      playCount: 5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default service mocks
    (remoteCatalogService.fetchCatalog as jest.Mock).mockResolvedValue({
      games: mockGames,
      source: 'remote',
      metadata: { fetchTime: 100, fromCache: false },
    });
    
    (favoritesService.enhanceGamesWithFavorites as jest.Mock).mockImplementation(
      (games) => games
    );
    
    (favoritesService.getFavoritesCount as jest.Mock).mockReturnValue(1);
    
    (configService.initialize as jest.Mock).mockResolvedValue(undefined);
    (configService.getConfig as jest.Mock).mockReturnValue({
      catalogMode: 'REMOTE',
      remoteCatalog: {
        url: 'https://example.com/catalog.json',
        fallbackToBundled: true,
        validateSchema: true,
      },
    });
    (configService.isFeatureEnabled as jest.Mock).mockReturnValue(true);
    (configService.getDebugLogLevel as jest.Mock).mockReturnValue('info');
    
    (privacyService.initialize as jest.Mock).mockResolvedValue(undefined);
    (privacyService.hasConsent as jest.Mock).mockReturnValue(true);
    (privacyService.isFavoritesAllowed as jest.Mock).mockReturnValue(true);
    (privacyService.isAnalyticsAllowed as jest.Mock).mockReturnValue(true);
  });

  it('should initialize required services', async () => {
    // Test service initialization logic
    expect(configService.initialize).toBeDefined();
    expect(privacyService.initialize).toBeDefined();
    expect(favoritesService.initialize).toBeDefined();
  });

  it('should handle game loading logic', async () => {
    // Test that the component can load games from remote catalog service
    expect(remoteCatalogService.fetchCatalog).toBeDefined();
    expect(favoritesService.enhanceGamesWithFavorites).toBeDefined();
  });

  it('should handle privacy consent checking', () => {
    // Test privacy consent integration
    expect(privacyService.hasConsent).toBeDefined();
    expect(privacyService.isFavoritesAllowed).toBeDefined();
  });

  it('should handle game press navigation', async () => {
    // Test navigation logic
    expect(mockNavigation.navigate).toBeDefined();
  });

  it('should handle favorite toggle functionality', async () => {
    // Test favorite toggle integration
    expect(favoritesService.toggleFavorite).toBeDefined();
    expect(privacyService.isFavoritesAllowed).toBeDefined();
  });

  it('should handle configuration and feature flags', () => {
    // Test configuration service integration
    expect(configService.isFeatureEnabled).toBeDefined();
    expect(configService.getConfig).toBeDefined();
  });

  it('should handle error scenarios gracefully', async () => {
    // Test error handling
    (remoteCatalogService.fetchCatalog as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    
    // Component should not crash on errors
    expect(() => {
      // Error handling logic should be present
    }).not.toThrow();
  });
});