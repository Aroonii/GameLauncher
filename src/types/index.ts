export interface Game {
  id: string;
  title: string;
  image: string;
  url: string;
  preferredOrientation?: 'portrait' | 'landscape';
  category?: string;
  description?: string;
}

export type RootStackParamList = {
  GameList: undefined;
  GameView: { game: Game };
};

// Analytics-related types
export interface AnalyticsMetadata {
  session_id: string;
  timestamp: number;
  app_version: string;
  network_status?: 'online' | 'offline';
}

// Privacy and consent types
export interface UserPrivacyPreferences {
  consentLevel: 'none' | 'essential' | 'analytics' | 'all';
  analyticsEnabled: boolean;
  favoritesEnabled: boolean;
  cachingEnabled: boolean;
  consentTimestamp: number;
}

// Cache metadata for remote catalog
export interface CacheMetadata {
  etag?: string;
  lastModified?: string;
  lastFetch: number;
  source: 'remote' | 'cached' | 'bundled';
  validation: {
    passed: boolean;
    errors?: string[];
  };
}

// Migration-related types
export interface MigrationState {
  version: string;
  completedMigrations: string[];
  pendingMigrations: string[];
  lastMigrationDate: number;
}

// Enhanced Game interface for Phase 2
export interface EnhancedGame extends Game {
  isFavorite?: boolean;
  lastPlayed?: number;
  playCount?: number;
  thumbnailCached?: boolean;
  cacheTimestamp?: number;
}