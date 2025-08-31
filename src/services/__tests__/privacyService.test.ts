import { privacyService, ConsentLevel } from '../privacyService';
import { storageService } from '../storageService';
import { analyticsService } from '../analyticsService';

// Mock dependencies
jest.mock('../storageService');
jest.mock('../analyticsService');
jest.mock('../configService');

describe('PrivacyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (privacyService as any).currentConsent = null;
    (privacyService as any).initialized = false;
    
    // Default mocks
    (storageService.getItem as jest.Mock).mockResolvedValue(null);
    (storageService.setItem as jest.Mock).mockResolvedValue(undefined);
    (storageService.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should initialize successfully with no stored consent', async () => {
      await privacyService.initialize();
      
      expect(storageService.getItem).toHaveBeenCalledWith('@privacy_consent');
      expect(storageService.getItem).toHaveBeenCalledWith('@privacy_version');
    });

    it('should load valid stored consent', async () => {
      const mockConsent = {
        version: '1.0.0',
        timestamp: Date.now(),
        level: 'analytics',
        analytics: true,
        favorites: true,
        caching: true,
      };
      
      (storageService.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@privacy_consent') {
          return Promise.resolve(JSON.stringify(mockConsent));
        }
        if (key === '@privacy_version') {
          return Promise.resolve('1.0.0');
        }
        return Promise.resolve(null);
      });
      
      await privacyService.initialize();
      
      expect(privacyService.hasConsent()).toBe(true);
      expect(privacyService.getConsentLevel()).toBe('analytics');
    });

    it('should clear invalid stored consent', async () => {
      const invalidConsent = { invalid: 'data' };
      
      (storageService.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@privacy_consent') {
          return Promise.resolve(JSON.stringify(invalidConsent));
        }
        if (key === '@privacy_version') {
          return Promise.resolve('1.0.0');
        }
        return Promise.resolve(null);
      });
      
      await privacyService.initialize();
      
      expect(privacyService.hasConsent()).toBe(false);
      expect(storageService.removeItem).toHaveBeenCalledWith('@privacy_consent');
    });
  });

  describe('recordConsent', () => {
    it('should record essential consent level', async () => {
      await privacyService.recordConsent('essential');
      
      expect(privacyService.hasConsent()).toBe(true);
      expect(privacyService.getConsentLevel()).toBe('essential');
      expect(privacyService.isAnalyticsAllowed()).toBe(false);
      expect(privacyService.isFavoritesAllowed()).toBe(true);
      expect(privacyService.isCachingAllowed()).toBe(true);
    });

    it('should record analytics consent level', async () => {
      await privacyService.recordConsent('analytics');
      
      expect(privacyService.getConsentLevel()).toBe('analytics');
      expect(privacyService.isAnalyticsAllowed()).toBe(true);
      expect(privacyService.isFavoritesAllowed()).toBe(true);
      expect(privacyService.isCachingAllowed()).toBe(true);
    });

    it('should record all consent level', async () => {
      await privacyService.recordConsent('all');
      
      expect(privacyService.getConsentLevel()).toBe('all');
      expect(privacyService.isAnalyticsAllowed()).toBe(true);
      expect(privacyService.isFavoritesAllowed()).toBe(true);
      expect(privacyService.isCachingAllowed()).toBe(true);
    });

    it('should generate anonymized user ID', async () => {
      await privacyService.recordConsent('analytics');
      
      expect(storageService.setItem).toHaveBeenCalledWith(
        '@anonymized_user_id',
        expect.stringMatching(/^anon_[a-z0-9]+$/)
      );
    });

    it('should store consent data correctly', async () => {
      await privacyService.recordConsent('analytics');
      
      expect(storageService.setItem).toHaveBeenCalledWith(
        '@privacy_consent',
        expect.stringContaining('"level":"analytics"')
      );
      expect(storageService.setItem).toHaveBeenCalledWith(
        '@privacy_version',
        '1.0.0'
      );
    });
  });

  describe('withdrawConsent', () => {
    it('should withdraw consent and clean data', async () => {
      await privacyService.recordConsent('all');
      await privacyService.withdrawConsent();
      
      expect(privacyService.getConsentLevel()).toBe('none');
      expect(privacyService.isAnalyticsAllowed()).toBe(false);
      expect(analyticsService.resetSession).toHaveBeenCalled();
    });
  });

  describe('anonymizeDataObject', () => {
    it('should anonymize sensitive fields', () => {
      const data = {
        userId: 'user123',
        email: 'user@example.com',
        gameTitle: 'Test Game',
        score: 100,
      };
      
      const anonymized = privacyService.anonymizeDataObject(data, ['userId', 'email']);
      
      expect(anonymized.userId).toBe('u*****3');
      expect(anonymized.email).toMatch(/^u\*+m$/);
      expect(anonymized.gameTitle).toBe('Test Game');
      expect(anonymized.score).toBe(100);
    });

    it('should handle short strings', () => {
      const data = { id: 'abc' };
      const anonymized = privacyService.anonymizeDataObject(data, ['id']);
      
      expect(anonymized.id).toBe('****');
    });
  });

  describe('consent levels', () => {
    const testCases: Array<{
      level: ConsentLevel;
      analytics: boolean;
      favorites: boolean;
      caching: boolean;
    }> = [
      { level: 'none', analytics: false, favorites: false, caching: false },
      { level: 'essential', analytics: false, favorites: true, caching: true },
      { level: 'analytics', analytics: true, favorites: true, caching: true },
      { level: 'all', analytics: true, favorites: true, caching: true },
    ];

    testCases.forEach(({ level, analytics, favorites, caching }) => {
      it(`should handle ${level} consent level correctly`, async () => {
        await privacyService.recordConsent(level);
        
        expect(privacyService.isAnalyticsAllowed()).toBe(analytics);
        expect(privacyService.isFavoritesAllowed()).toBe(favorites);
        expect(privacyService.isCachingAllowed()).toBe(caching);
      });
    });
  });

  describe('isDataProcessingAllowed', () => {
    it('should allow essential caching without consent', () => {
      expect(privacyService.isDataProcessingAllowed('caching')).toBe(true);
    });

    it('should require consent for analytics', () => {
      expect(privacyService.isDataProcessingAllowed('analytics')).toBe(false);
    });

    it('should require consent for favorites', () => {
      expect(privacyService.isDataProcessingAllowed('favorites')).toBe(false);
    });
  });
});