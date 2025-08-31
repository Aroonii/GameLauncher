import { remoteCatalogService } from '../remoteCatalogService';
import { storageService } from '../storageService';
import { schemaValidator } from '../../utils/schemaValidator';

// Mock dependencies
jest.mock('../storageService');
jest.mock('../../utils/schemaValidator');
jest.mock('../../data/games.json', () => [
  { id: '1', title: 'Test Game', url: 'https://example.com/game1', category: 'puzzle' }
]);

global.fetch = jest.fn();

describe('RemoteCatalogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Don't use fake timers as they interfere with async operations
  });

  describe('fetchCatalog', () => {
    it('should return bundled games when no URL provided', async () => {
      const config = { fallbackToBundled: true, validateSchema: true };
      
      const result = await remoteCatalogService.fetchCatalog(config);
      
      expect(result.source).toBe('bundled');
      expect(result.games).toHaveLength(1);
      expect(result.games[0].title).toBe('Test Game');
      expect(result.metadata.fromCache).toBe(false);
    });

    it('should fetch from remote URL successfully', async () => {
      const mockGames = [
        { id: '2', title: 'Remote Game', url: 'https://example.com/game2', category: 'action' }
      ];
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'application/json'],
          ['etag', '"abc123"']
        ]),
        json: () => Promise.resolve(mockGames),
      });
      
      (schemaValidator.validateCatalog as jest.Mock).mockReturnValue({
        isValid: true,
        sanitizedData: mockGames,
      });
      
      const config = {
        url: 'https://example.com/catalog.json',
        fallbackToBundled: true,
        validateSchema: true
      };
      
      const result = await remoteCatalogService.fetchCatalog(config);
      
      expect(result.source).toBe('remote');
      expect(result.games).toEqual(mockGames);
      expect(result.metadata.fromCache).toBe(false);
      expect(storageService.cacheGames).toHaveBeenCalledWith(mockGames);
    });

    it('should return cached games when remote fails', async () => {
      const cachedGames = [
        { id: '3', title: 'Cached Game', url: 'https://example.com/game3', category: 'strategy' }
      ];
      
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      (storageService.getCachedGames as jest.Mock).mockResolvedValue(cachedGames);
      
      const config = {
        url: 'https://example.com/catalog.json',
        fallbackToBundled: true,
        validateSchema: true
      };
      
      const result = await remoteCatalogService.fetchCatalog(config);
      
      expect(result.source).toBe('cached');
      expect(result.games).toEqual(cachedGames);
      expect(result.metadata.fromCache).toBe(true);
    });

    it('should handle 304 Not Modified response', async () => {
      const cachedGames = [
        { id: '4', title: 'Cached Game', url: 'https://example.com/game4', category: 'puzzle' }
      ];
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 304,
      });
      
      (storageService.getCachedGames as jest.Mock).mockResolvedValue(cachedGames);
      
      const config = {
        url: 'https://example.com/catalog.json',
        fallbackToBundled: true,
        validateSchema: true
      };
      
      const result = await remoteCatalogService.fetchCatalog(config);
      
      expect(result.source).toBe('remote');
      expect(result.games).toEqual(cachedGames);
    });

    it('should reject HTTP URLs for security', async () => {
      const config = {
        url: 'http://insecure.com/catalog.json',
        fallbackToBundled: true,
        validateSchema: true
      };
      
      const result = await remoteCatalogService.fetchCatalog(config);
      
      expect(result.source).toBe('bundled');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle schema validation failure', async () => {
      const invalidGames = [{ invalid: 'data' }];
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(invalidGames),
      });
      
      (schemaValidator.validateCatalog as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Invalid schema'],
      });
      
      // No cached games available
      (storageService.getCachedGames as jest.Mock).mockResolvedValue(null);
      
      const config = {
        url: 'https://example.com/catalog.json',
        fallbackToBundled: true,
        validateSchema: true
      };
      
      const result = await remoteCatalogService.fetchCatalog(config);
      
      expect(result.source).toBe('bundled');
    });
  });

  describe('clearRemoteCache', () => {
    it('should clear all cache-related storage', async () => {
      await remoteCatalogService.clearRemoteCache();
      
      expect(storageService.removeItem).toHaveBeenCalledWith('@remote_catalog_etag');
      expect(storageService.removeItem).toHaveBeenCalledWith('@remote_catalog_last_fetch');
      expect(storageService.clearCache).toHaveBeenCalled();
    });

    it('should handle cache clearing errors gracefully', async () => {
      (storageService.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await expect(remoteCatalogService.clearRemoteCache()).resolves.not.toThrow();
    });
  });
});