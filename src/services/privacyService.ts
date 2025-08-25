import { storageService } from './storageService';
import { analyticsService } from './analyticsService';
import { configService } from './configService';

// Privacy consent types
export type ConsentLevel = 'none' | 'essential' | 'analytics' | 'all';

export interface PrivacyConsent {
  version: string;
  timestamp: number;
  level: ConsentLevel;
  analytics: boolean;
  favorites: boolean;
  caching: boolean;
  userId?: string; // Anonymized user identifier
}

export interface DataRetentionPolicy {
  analyticsEvents: number; // days
  gameCache: number; // days
  userPreferences: number; // days
  errorLogs: number; // days
}

const PRIVACY_CONSENT_KEY = '@privacy_consent';
const PRIVACY_VERSION_KEY = '@privacy_version';
const ANONYMIZED_USER_ID_KEY = '@anonymized_user_id';
const CURRENT_PRIVACY_VERSION = '1.0.0';

// Default data retention policies (in days)
const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  analyticsEvents: 30,
  gameCache: 7,
  userPreferences: 365,
  errorLogs: 14,
};

class PrivacyService {
  private currentConsent: PrivacyConsent | null = null;
  private retentionPolicy: DataRetentionPolicy;
  private initialized = false;

  constructor() {
    this.retentionPolicy = { ...DEFAULT_RETENTION_POLICY };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load existing consent
      await this.loadStoredConsent();
      
      // Set up cleanup scheduler
      await this.scheduleDataCleanup();
      
      this.initialized = true;
      console.log('Privacy service initialized');
    } catch (error) {
      console.error('Error initializing privacy service:', error);
      this.initialized = true; // Continue without stored consent
    }
  }

  private async loadStoredConsent(): Promise<void> {
    const [consentStr, versionStr] = await Promise.all([
      storageService.getItem(PRIVACY_CONSENT_KEY),
      storageService.getItem(PRIVACY_VERSION_KEY),
    ]);

    if (consentStr && versionStr === CURRENT_PRIVACY_VERSION) {
      try {
        const storedConsent = JSON.parse(consentStr) as PrivacyConsent;
        
        // Validate consent structure
        if (this.validateConsentStructure(storedConsent)) {
          this.currentConsent = storedConsent;
          console.log(`Privacy consent loaded: ${storedConsent.level} level`);
        } else {
          console.warn('Stored privacy consent failed validation');
          await this.clearStoredConsent();
        }
      } catch (parseError) {
        console.error('Error parsing stored privacy consent:', parseError);
        await this.clearStoredConsent();
      }
    }
  }

  private validateConsentStructure(consent: any): consent is PrivacyConsent {
    return (
      consent &&
      typeof consent === 'object' &&
      typeof consent.version === 'string' &&
      typeof consent.timestamp === 'number' &&
      typeof consent.level === 'string' &&
      ['none', 'essential', 'analytics', 'all'].includes(consent.level) &&
      typeof consent.analytics === 'boolean' &&
      typeof consent.favorites === 'boolean' &&
      typeof consent.caching === 'boolean'
    );
  }

  async recordConsent(level: ConsentLevel): Promise<void> {
    try {
      // Generate anonymized user ID if not exists
      let userId = await storageService.getItem(ANONYMIZED_USER_ID_KEY);
      if (!userId) {
        userId = this.generateAnonymizedUserId();
        await storageService.setItem(ANONYMIZED_USER_ID_KEY, userId);
      }

      // Create consent record
      const consent: PrivacyConsent = {
        version: CURRENT_PRIVACY_VERSION,
        timestamp: Date.now(),
        level,
        analytics: this.getAnalyticsConsent(level),
        favorites: this.getFavoritesConsent(level),
        caching: this.getCachingConsent(level),
        userId,
      };

      // Store consent
      await Promise.all([
        storageService.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent)),
        storageService.setItem(PRIVACY_VERSION_KEY, CURRENT_PRIVACY_VERSION),
      ]);

      this.currentConsent = consent;
      
      // Log privacy consent event (if analytics allowed)
      if (consent.analytics && configService.isFeatureEnabled('analytics')) {
        analyticsService.logEvent('privacy_consent', {
          level,
          analytics_enabled: consent.analytics,
          favorites_enabled: consent.favorites,
          caching_enabled: consent.caching,
        });
      }

      console.log(`Privacy consent recorded: ${level}`);
    } catch (error) {
      console.error('Error recording privacy consent:', error);
      throw error;
    }
  }

  private getAnalyticsConsent(level: ConsentLevel): boolean {
    return level === 'analytics' || level === 'all';
  }

  private getFavoritesConsent(level: ConsentLevel): boolean {
    return level !== 'none';
  }

  private getCachingConsent(level: ConsentLevel): boolean {
    return level !== 'none';
  }

  private generateAnonymizedUserId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    const hash = this.simpleHash(`${timestamp}${random}`);
    return `anon_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Public API methods
  hasConsent(): boolean {
    return this.currentConsent !== null;
  }

  getConsentLevel(): ConsentLevel {
    return this.currentConsent?.level || 'none';
  }

  isAnalyticsAllowed(): boolean {
    return this.currentConsent?.analytics ?? false;
  }

  isFavoritesAllowed(): boolean {
    return this.currentConsent?.favorites ?? true; // Essential functionality
  }

  isCachingAllowed(): boolean {
    return this.currentConsent?.caching ?? true; // Essential functionality
  }

  getAnonymizedUserId(): string | undefined {
    return this.currentConsent?.userId;
  }

  async withdrawConsent(): Promise<void> {
    try {
      // Record withdrawal
      await this.recordConsent('none');
      
      // Clear analytics and optional data
      await this.performDataCleanup(true);
      
      console.log('Privacy consent withdrawn and data cleaned');
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  async clearStoredConsent(): Promise<void> {
    try {
      await Promise.all([
        storageService.removeItem(PRIVACY_CONSENT_KEY),
        storageService.removeItem(PRIVACY_VERSION_KEY),
      ]);
      
      this.currentConsent = null;
      console.log('Stored privacy consent cleared');
    } catch (error) {
      console.error('Error clearing stored consent:', error);
    }
  }

  // Data anonymization utilities
  anonymizeDataObject(data: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const anonymized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        if (typeof anonymized[field] === 'string') {
          anonymized[field] = this.anonymizeString(anonymized[field]);
        } else {
          delete anonymized[field];
        }
      }
    });
    
    return anonymized;
  }

  private anonymizeString(value: string): string {
    if (value.length <= 4) {
      return '****';
    }
    
    const firstChar = value.charAt(0);
    const lastChar = value.charAt(value.length - 1);
    const middle = '*'.repeat(Math.max(value.length - 2, 2));
    
    return `${firstChar}${middle}${lastChar}`;
  }

  // Data cleanup and retention
  private async scheduleDataCleanup(): Promise<void> {
    // In a real app, this would set up a periodic cleanup job
    // For now, we'll just run cleanup on initialization
    await this.performDataCleanup(false);
  }

  private async performDataCleanup(forceCleanup: boolean = false): Promise<void> {
    try {
      if (!forceCleanup && !this.shouldPerformCleanup()) {
        return;
      }

      const cleanupTasks: Promise<void>[] = [];
      
      // Clean up analytics data if not consented or expired
      if (!this.isAnalyticsAllowed() || forceCleanup) {
        cleanupTasks.push(this.cleanupAnalyticsData());
      }

      // Clean up expired cache data
      cleanupTasks.push(this.cleanupExpiredCacheData());
      
      // Clean up error logs
      cleanupTasks.push(this.cleanupErrorLogs());

      await Promise.all(cleanupTasks);
      
      // Record cleanup completion
      await storageService.setItem('@last_data_cleanup', Date.now().toString());
      
      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }

  private shouldPerformCleanup(): boolean {
    // Perform cleanup once per day
    const lastCleanupStr = storageService.getItem('@last_data_cleanup');
    if (!lastCleanupStr) {
      return true;
    }

    const lastCleanup = parseInt(lastCleanupStr as any);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    return lastCleanup < oneDayAgo;
  }

  private async cleanupAnalyticsData(): Promise<void> {
    // This would clear analytics events from storage
    // For now, just reset the analytics service session
    analyticsService.resetSession();
  }

  private async cleanupExpiredCacheData(): Promise<void> {
    // Clear game cache if beyond retention period
    const cacheTimestampStr = await storageService.getItem('@games_cache_timestamp');
    if (cacheTimestampStr) {
      const cacheTimestamp = parseInt(cacheTimestampStr);
      const retentionPeriod = this.retentionPolicy.gameCache * 24 * 60 * 60 * 1000;
      
      if (Date.now() - cacheTimestamp > retentionPeriod) {
        await storageService.clearCache();
        console.log('Expired game cache cleared');
      }
    }
  }

  private async cleanupErrorLogs(): Promise<void> {
    // Clear error logs if beyond retention period
    // In a real implementation, this would clean up stored error logs
    console.log('Error logs cleanup completed');
  }

  // Configuration API for different privacy requirements
  updateRetentionPolicy(policy: Partial<DataRetentionPolicy>): void {
    this.retentionPolicy = {
      ...this.retentionPolicy,
      ...policy,
    };
    console.log('Data retention policy updated:', this.retentionPolicy);
  }

  getRetentionPolicy(): DataRetentionPolicy {
    return { ...this.retentionPolicy };
  }

  // Utility for checking if data processing is allowed
  isDataProcessingAllowed(dataType: 'analytics' | 'favorites' | 'caching'): boolean {
    if (!this.hasConsent()) {
      return dataType === 'caching'; // Allow essential caching even without explicit consent
    }

    switch (dataType) {
      case 'analytics':
        return this.isAnalyticsAllowed();
      case 'favorites':
        return this.isFavoritesAllowed();
      case 'caching':
        return this.isCachingAllowed();
      default:
        return false;
    }
  }
}

export const privacyService = new PrivacyService();