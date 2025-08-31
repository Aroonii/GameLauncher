import { AppConfig, defaultAppConfig, validateConfig, configPresets } from '../config/appConfig';
import { storageService } from './storageService';

const CONFIG_CACHE_KEY = '@app_config';
const CONFIG_VERSION_KEY = '@app_config_version';
const CURRENT_CONFIG_VERSION = '1.0.0';

type ConfigChangeListener = (newConfig: AppConfig, oldConfig: AppConfig) => void;

class ConfigService {
  private currentConfig: AppConfig;
  private listeners: ConfigChangeListener[] = [];
  private initialized = false;

  constructor() {
    this.currentConfig = { ...defaultAppConfig };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check for stored configuration
      const [storedConfigStr, storedVersion] = await Promise.all([
        storageService.getItem(CONFIG_CACHE_KEY),
        storageService.getItem(CONFIG_VERSION_KEY),
      ]);

      if (storedConfigStr && storedVersion === CURRENT_CONFIG_VERSION) {
        try {
          const storedConfig = JSON.parse(storedConfigStr) as Partial<AppConfig>;
          
          if (validateConfig(storedConfig)) {
            // Merge stored config with defaults to handle new fields
            this.currentConfig = {
              ...defaultAppConfig,
              ...storedConfig,
              // Force remote catalog for testing
              catalogMode: 'REMOTE',
              remoteCatalog: {
                ...defaultAppConfig.remoteCatalog,
                url: 'https://aroonii.github.io/GameLauncher/catalog.json',
              },
            };
            console.log('Configuration loaded from storage with remote catalog override');
          } else {
            console.warn('Stored configuration failed validation, using defaults');
            await this.resetToDefaults();
          }
        } catch (parseError) {
          console.error('Error parsing stored configuration:', parseError);
          await this.resetToDefaults();
        }
      } else {
        console.log('No valid stored configuration found, using defaults');
        await this.saveConfig();
      }

      // Apply environment-specific overrides
      await this.applyEnvironmentOverrides();
      
      this.initialized = true;
      console.log('Configuration service initialized');
    } catch (error) {
      console.error('Error initializing configuration service:', error);
      this.currentConfig = { ...defaultAppConfig };
      this.initialized = true;
    }
  }

  private async applyEnvironmentOverrides(): Promise<void> {
    // In a real app, these would come from environment variables or build-time configuration
    // For development, we can allow runtime switching via debug menu
    
    if (__DEV__) {
      // Check for debug overrides
      const debugConfigStr = await storageService.getItem('@debug_config_override');
      if (debugConfigStr) {
        try {
          const debugOverrides = JSON.parse(debugConfigStr) as Partial<AppConfig>;
          if (validateConfig(debugOverrides)) {
            const oldConfig = { ...this.currentConfig };
            this.currentConfig = {
              ...this.currentConfig,
              ...debugOverrides,
            };
            console.log('Applied debug configuration overrides');
            this.notifyListeners(this.currentConfig, oldConfig);
          }
        } catch (error) {
          console.error('Error parsing debug configuration overrides:', error);
        }
      }
    }
  }

  getConfig(): AppConfig {
    if (!this.initialized) {
      console.warn('Configuration service not initialized, returning default config');
      return { ...defaultAppConfig };
    }
    return { ...this.currentConfig };
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<boolean> {
    if (!validateConfig(updates)) {
      console.error('Configuration update failed validation');
      return false;
    }

    try {
      const oldConfig = { ...this.currentConfig };
      this.currentConfig = {
        ...this.currentConfig,
        ...updates,
      };

      await this.saveConfig();
      this.notifyListeners(this.currentConfig, oldConfig);
      
      console.log('Configuration updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating configuration:', error);
      return false;
    }
  }

  async resetToDefaults(): Promise<void> {
    const oldConfig = { ...this.currentConfig };
    this.currentConfig = { ...defaultAppConfig };
    
    await this.saveConfig();
    this.notifyListeners(this.currentConfig, oldConfig);
    
    console.log('Configuration reset to defaults');
  }

  async applyPreset(presetName: keyof typeof configPresets): Promise<boolean> {
    const preset = configPresets[presetName];
    if (!preset) {
      console.error(`Unknown configuration preset: ${presetName}`);
      return false;
    }

    return await this.updateConfig(preset);
  }

  private async saveConfig(): Promise<void> {
    try {
      await Promise.all([
        storageService.setItem(CONFIG_CACHE_KEY, JSON.stringify(this.currentConfig)),
        storageService.setItem(CONFIG_VERSION_KEY, CURRENT_CONFIG_VERSION),
      ]);
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  onConfigChange(listener: ConfigChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(newConfig: AppConfig, oldConfig: AppConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(newConfig, oldConfig);
      } catch (error) {
        console.error('Error in configuration change listener:', error);
      }
    });
  }

  // Development utilities
  async setDebugOverride(overrides: Partial<AppConfig>): Promise<boolean> {
    if (!__DEV__) {
      console.warn('Debug overrides only available in development mode');
      return false;
    }

    if (!validateConfig(overrides)) {
      console.error('Debug override failed validation');
      return false;
    }

    try {
      await storageService.setItem('@debug_config_override', JSON.stringify(overrides));
      await this.applyEnvironmentOverrides();
      console.log('Debug configuration override applied');
      return true;
    } catch (error) {
      console.error('Error setting debug override:', error);
      return false;
    }
  }

  async clearDebugOverride(): Promise<void> {
    if (!__DEV__) {
      return;
    }

    try {
      await storageService.removeItem('@debug_config_override');
      // Reload configuration without overrides
      await this.initialize();
      console.log('Debug configuration override cleared');
    } catch (error) {
      console.error('Error clearing debug override:', error);
    }
  }

  // Utility methods for common configuration checks
  isRemoteCatalogEnabled(): boolean {
    return this.currentConfig.catalogMode === 'REMOTE' && !!this.currentConfig.remoteCatalog.url;
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.currentConfig.features[feature];
  }

  getRemoteCatalogUrl(): string | undefined {
    return this.currentConfig.remoteCatalog.url;
  }

  shouldPrefetchOnWifiOnly(): boolean {
    return this.currentConfig.performance.prefetchOnWifiOnly;
  }

  getImageCacheSize(): number {
    return this.currentConfig.performance.imageCacheSize;
  }

  getDebugLogLevel(): AppConfig['debug']['logLevel'] {
    return this.currentConfig.debug.logLevel;
  }

  isPerformanceLoggingEnabled(): boolean {
    return this.currentConfig.debug.enablePerformanceLogging;
  }
}

export const configService = new ConfigService();