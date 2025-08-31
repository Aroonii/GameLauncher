import { RemoteCatalogConfig } from '../services/remoteCatalogService';

export type CatalogMode = 'BUNDLED' | 'REMOTE';

export interface AppConfig {
  catalogMode: CatalogMode;
  remoteCatalog: RemoteCatalogConfig;
  features: {
    analytics: boolean;
    favorites: boolean;
    categories: boolean;
    imageCaching: boolean;
    privacy: boolean;
  };
  performance: {
    imageCacheSize: number; // in MB
    prefetchOnWifiOnly: boolean;
    maxConcurrentImageLoads: number;
  };
  security: {
    enforceHttps: boolean;
    validateSchema: boolean;
    allowedDomains?: string[];
  };
  accessibility: {
    enableVoiceOver: boolean;
    highContrastMode: boolean;
    minimumTouchTarget: number; // in dp
  };
  debug: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enablePerformanceLogging: boolean;
  };
}

// Environment-based configuration
const getEnvironmentConfig = (): Partial<AppConfig> => {
  // In a real app, these would come from environment variables
  // For now, we'll use development defaults
  const isDevelopment = __DEV__;
  
  return {
    catalogMode: 'REMOTE', // Test remote catalog
    remoteCatalog: {
      url: 'https://aroonii.github.io/GameLauncher/catalog.json',
      fallbackToBundled: true,
      validateSchema: true,
    },
    features: {
      analytics: true,
      favorites: true,
      categories: true,
      imageCaching: true,
      privacy: true,
    },
    performance: {
      imageCacheSize: 50, // 50MB cache
      prefetchOnWifiOnly: true,
      maxConcurrentImageLoads: 3,
    },
    security: {
      enforceHttps: true,
      validateSchema: true,
      allowedDomains: undefined, // No domain restrictions by default
    },
    accessibility: {
      enableVoiceOver: true,
      highContrastMode: false,
      minimumTouchTarget: 44, // 44dp minimum as per accessibility guidelines
    },
    debug: {
      logLevel: isDevelopment ? 'debug' : 'warn',
      enablePerformanceLogging: isDevelopment,
    },
  };
};

// Production overrides (when not in development)
const getProductionOverrides = (): Partial<AppConfig> => ({
  debug: {
    logLevel: 'error',
    enablePerformanceLogging: false,
  },
});

// Create the default configuration
const createDefaultConfig = (): AppConfig => {
  const baseConfig = getEnvironmentConfig();
  const overrides = __DEV__ ? {} : getProductionOverrides();
  
  return {
    catalogMode: 'REMOTE',
    remoteCatalog: {
      url: 'https://aroonii.github.io/GameLauncher/catalog.json',
      fallbackToBundled: true,
      validateSchema: true,
    },
    features: {
      analytics: true,
      favorites: true,
      categories: true,
      imageCaching: true,
      privacy: true,
    },
    performance: {
      imageCacheSize: 50,
      prefetchOnWifiOnly: true,
      maxConcurrentImageLoads: 3,
    },
    security: {
      enforceHttps: true,
      validateSchema: true,
    },
    accessibility: {
      enableVoiceOver: true,
      highContrastMode: false,
      minimumTouchTarget: 44,
    },
    debug: {
      logLevel: __DEV__ ? 'debug' : 'error',
      enablePerformanceLogging: __DEV__,
    },
    ...baseConfig,
    ...overrides,
  } as AppConfig;
};

// Validation function for configuration
export const validateConfig = (config: Partial<AppConfig>): boolean => {
  try {
    // Validate catalog mode
    if (config.catalogMode && !['BUNDLED', 'REMOTE'].includes(config.catalogMode)) {
      console.error('Invalid catalog mode:', config.catalogMode);
      return false;
    }
    
    // Validate remote catalog URL if provided
    if (config.remoteCatalog?.url) {
      try {
        const url = new URL(config.remoteCatalog.url);
        if (config.security?.enforceHttps && url.protocol !== 'https:') {
          console.error('Remote catalog URL must use HTTPS when enforceHttps is enabled');
          return false;
        }
      } catch (error) {
        console.error('Invalid remote catalog URL:', error);
        return false;
      }
    }
    
    // Validate performance settings
    if (config.performance?.imageCacheSize && config.performance.imageCacheSize < 1) {
      console.error('Image cache size must be at least 1MB');
      return false;
    }
    
    if (config.performance?.maxConcurrentImageLoads && config.performance.maxConcurrentImageLoads < 1) {
      console.error('Max concurrent image loads must be at least 1');
      return false;
    }
    
    // Validate accessibility settings
    if (config.accessibility?.minimumTouchTarget && config.accessibility.minimumTouchTarget < 24) {
      console.warn('Minimum touch target size below 24dp may not be accessible');
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation error:', error);
    return false;
  }
};

// Export the default configuration
export const defaultAppConfig: AppConfig = createDefaultConfig();

// Configuration presets for easy switching
export const configPresets = {
  development: {
    ...defaultAppConfig,
    debug: {
      logLevel: 'debug' as const,
      enablePerformanceLogging: true,
    },
  },
  
  staging: {
    ...defaultAppConfig,
    catalogMode: 'REMOTE' as CatalogMode,
    remoteCatalog: {
      url: undefined, // Would be set via environment variable
      fallbackToBundled: true,
      validateSchema: true,
    },
    debug: {
      logLevel: 'info' as const,
      enablePerformanceLogging: true,
    },
  },
  
  production: {
    ...defaultAppConfig,
    catalogMode: 'REMOTE' as CatalogMode,
    remoteCatalog: {
      url: undefined, // Would be set via environment variable
      fallbackToBundled: true,
      validateSchema: true,
    },
    debug: {
      logLevel: 'error' as const,
      enablePerformanceLogging: false,
    },
  },
} as const;