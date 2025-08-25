import { storageService } from '../services/storageService';
import { favoritesService } from '../services/favoritesService';
import { privacyService } from '../services/privacyService';
import { configService } from '../services/configService';
import { MigrationState } from '../types';

// Migration version tracking
const MIGRATION_STATE_KEY = '@migration_state';
const CURRENT_VERSION = '2.0.0';

interface Migration {
  id: string;
  version: string;
  description: string;
  execute: () => Promise<boolean>;
  rollback?: () => Promise<boolean>;
}

class MigrationUtils {
  private migrationState: MigrationState | null = null;
  private initialized = false;

  // Define all migrations
  private migrations: Migration[] = [
    {
      id: 'add_category_fields_v2',
      version: '1.1.0',
      description: 'Add category fields to existing games data',
      execute: this.migrateCategoryFields.bind(this),
      rollback: this.rollbackCategoryFields.bind(this),
    },
    {
      id: 'migrate_to_enhanced_games_v2',
      version: '2.0.0',
      description: 'Migrate Game objects to EnhancedGame with favorites support',
      execute: this.migrateToEnhancedGames.bind(this),
      rollback: this.rollbackEnhancedGames.bind(this),
    },
    {
      id: 'initialize_privacy_settings_v2',
      version: '2.0.0',
      description: 'Initialize privacy settings for existing users',
      execute: this.initializePrivacySettings.bind(this),
    },
    {
      id: 'migrate_cache_format_v2',
      version: '2.0.0',
      description: 'Migrate cache format to support remote catalog metadata',
      execute: this.migrateCacheFormat.bind(this),
      rollback: this.rollbackCacheFormat.bind(this),
    },
  ];

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadMigrationState();
      this.initialized = true;
      console.log('Migration utils initialized');
    } catch (error) {
      console.error('Error initializing migration utils:', error);
      this.initialized = true; // Continue without migration tracking
    }
  }

  private async loadMigrationState(): Promise<void> {
    try {
      const stateStr = await storageService.getItem(MIGRATION_STATE_KEY);
      if (stateStr) {
        this.migrationState = JSON.parse(stateStr) as MigrationState;
      } else {
        // Initialize migration state for new installations
        this.migrationState = {
          version: CURRENT_VERSION,
          completedMigrations: [],
          pendingMigrations: [],
          lastMigrationDate: Date.now(),
        };
        await this.saveMigrationState();
      }
    } catch (error) {
      console.error('Error loading migration state:', error);
      this.migrationState = {
        version: CURRENT_VERSION,
        completedMigrations: [],
        pendingMigrations: [],
        lastMigrationDate: Date.now(),
      };
    }
  }

  private async saveMigrationState(): Promise<void> {
    try {
      if (this.migrationState) {
        await storageService.setItem(MIGRATION_STATE_KEY, JSON.stringify(this.migrationState));
      }
    } catch (error) {
      console.error('Error saving migration state:', error);
    }
  }

  async runPendingMigrations(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.migrationState) {
      console.error('Migration state not initialized');
      return false;
    }

    const pendingMigrations = this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return true;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations`);
    
    let allSucceeded = true;
    
    for (const migration of pendingMigrations) {
      try {
        console.log(`Executing migration: ${migration.description}`);
        const success = await migration.execute();
        
        if (success) {
          this.migrationState.completedMigrations.push(migration.id);
          this.migrationState.pendingMigrations = this.migrationState.pendingMigrations.filter(
            id => id !== migration.id
          );
          console.log(`✅ Migration completed: ${migration.id}`);
        } else {
          console.error(`❌ Migration failed: ${migration.id}`);
          allSucceeded = false;
          break;
        }
      } catch (error) {
        console.error(`💥 Migration error: ${migration.id}`, error);
        allSucceeded = false;
        break;
      }
    }

    if (allSucceeded) {
      this.migrationState.version = CURRENT_VERSION;
      this.migrationState.lastMigrationDate = Date.now();
    }

    await this.saveMigrationState();
    
    return allSucceeded;
  }

  private getPendingMigrations(): Migration[] {
    if (!this.migrationState) return [];

    return this.migrations.filter(migration => 
      !this.migrationState!.completedMigrations.includes(migration.id)
    );
  }

  async rollbackMigration(migrationId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const migration = this.migrations.find(m => m.id === migrationId);
    if (!migration || !migration.rollback) {
      console.error(`Migration ${migrationId} not found or no rollback available`);
      return false;
    }

    try {
      console.log(`Rolling back migration: ${migration.description}`);
      const success = await migration.rollback();
      
      if (success && this.migrationState) {
        this.migrationState.completedMigrations = this.migrationState.completedMigrations.filter(
          id => id !== migrationId
        );
        await this.saveMigrationState();
        console.log(`✅ Migration rolled back: ${migrationId}`);
      }
      
      return success;
    } catch (error) {
      console.error(`💥 Rollback error: ${migrationId}`, error);
      return false;
    }
  }

  // Individual migration implementations
  private async migrateCategoryFields(): Promise<boolean> {
    try {
      // This migration ensures games have proper category fields
      // In a real app, this might involve updating stored game data
      console.log('Migrating category fields...');
      
      // Check if games cache exists and update format
      const existingGames = await storageService.getCachedGames();
      if (existingGames) {
        // Add default category for games without categories
        const updatedGames = existingGames.map(game => ({
          ...game,
          category: game.category || 'uncategorized',
        }));
        
        await storageService.cacheGames(updatedGames);
        console.log(`Updated ${updatedGames.length} games with category fields`);
      }
      
      return true;
    } catch (error) {
      console.error('Error in category fields migration:', error);
      return false;
    }
  }

  private async rollbackCategoryFields(): Promise<boolean> {
    try {
      console.log('Rolling back category fields migration...');
      // In a real rollback, we might remove category fields or restore original data
      return true;
    } catch (error) {
      console.error('Error rolling back category fields:', error);
      return false;
    }
  }

  private async migrateToEnhancedGames(): Promise<boolean> {
    try {
      console.log('Migrating to EnhancedGame format...');
      
      // Migrate existing game cache to include enhanced fields
      const existingGames = await storageService.getCachedGames();
      if (existingGames) {
        // Games will be automatically enhanced by favoritesService
        // when they're loaded, so we just need to clear the old cache
        await storageService.clearCache();
        console.log('Cleared old game cache for EnhancedGame migration');
      }
      
      return true;
    } catch (error) {
      console.error('Error in EnhancedGame migration:', error);
      return false;
    }
  }

  private async rollbackEnhancedGames(): Promise<boolean> {
    try {
      console.log('Rolling back EnhancedGame migration...');
      // Clear enhanced cache and let the app rebuild with basic Game format
      await storageService.clearCache();
      return true;
    } catch (error) {
      console.error('Error rolling back EnhancedGame migration:', error);
      return false;
    }
  }

  private async initializePrivacySettings(): Promise<boolean> {
    try {
      console.log('Initializing privacy settings for existing users...');
      
      // For existing users (who don't have privacy consent recorded),
      // we'll assume they consent to essential features but not analytics
      if (!privacyService.hasConsent()) {
        // This is handled by the privacy service and consent dialog
        // We don't want to automatically set consent without user interaction
        console.log('Privacy settings will be initialized on next app launch');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing privacy settings:', error);
      return false;
    }
  }

  private async migrateCacheFormat(): Promise<boolean> {
    try {
      console.log('Migrating cache format...');
      
      // Update cache keys and structure for remote catalog support
      const oldCacheKey = '@games_cache';
      const oldTimestampKey = '@games_cache_timestamp';
      
      // Check if old format exists
      const oldCache = await storageService.getItem(oldCacheKey);
      const oldTimestamp = await storageService.getItem(oldTimestampKey);
      
      if (oldCache) {
        // Migrate to new format with additional metadata
        // The new format is already handled by the updated storageService
        console.log('Found legacy cache format, will be automatically upgraded');
      }
      
      return true;
    } catch (error) {
      console.error('Error in cache format migration:', error);
      return false;
    }
  }

  private async rollbackCacheFormat(): Promise<boolean> {
    try {
      console.log('Rolling back cache format migration...');
      // Clear new cache format
      await storageService.clearCache();
      return true;
    } catch (error) {
      console.error('Error rolling back cache format:', error);
      return false;
    }
  }

  // Data integrity validation
  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate game cache
      const cachedGames = await storageService.getCachedGames();
      if (cachedGames) {
        for (const game of cachedGames) {
          if (!game.id || !game.title || !game.image || !game.url) {
            errors.push(`Invalid game object missing required fields: ${game.id || 'unknown'}`);
          }
          
          if (!game.category) {
            warnings.push(`Game missing category: ${game.title}`);
          }
        }
      }

      // Validate favorites data
      try {
        const favoritesData = await favoritesService.exportFavoritesData();
        if (favoritesData.favorites.length > 0) {
          for (const favorite of favoritesData.favorites) {
            if (!favorite.gameId || !favorite.dateAdded) {
              errors.push(`Invalid favorite object: ${favorite.gameId || 'unknown'}`);
            }
          }
        }
      } catch (error) {
        warnings.push('Unable to validate favorites data');
      }

      // Validate configuration
      try {
        const config = configService.getConfig();
        if (!config.catalogMode || !config.features) {
          errors.push('Invalid configuration structure');
        }
      } catch (error) {
        errors.push('Unable to validate configuration');
      }

    } catch (error) {
      errors.push(`Data integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Backup and restore functionality
  async createBackup(): Promise<{
    success: boolean;
    backupData?: any;
    error?: string;
  }> {
    try {
      console.log('Creating data backup...');
      
      const backupData = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        games: await storageService.getCachedGames(),
        favorites: await favoritesService.exportFavoritesData(),
        config: configService.getConfig(),
        migrationState: this.migrationState,
      };

      return {
        success: true,
        backupData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async restoreFromBackup(backupData: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('Restoring from backup...');
      
      // Validate backup data structure
      if (!backupData || !backupData.version || !backupData.timestamp) {
        throw new Error('Invalid backup data structure');
      }

      // Restore favorites
      if (backupData.favorites) {
        await favoritesService.importFavoritesData(backupData.favorites);
      }

      // Restore games cache
      if (backupData.games) {
        await storageService.cacheGames(backupData.games);
      }

      // Restore configuration
      if (backupData.config) {
        await configService.updateConfig(backupData.config);
      }

      // Restore migration state
      if (backupData.migrationState) {
        this.migrationState = backupData.migrationState;
        await this.saveMigrationState();
      }

      console.log('✅ Data restored from backup successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Migration status and utilities
  getMigrationState(): MigrationState | null {
    return this.migrationState;
  }

  getAvailableMigrations(): Migration[] {
    return this.migrations.map(m => ({
      ...m,
      execute: () => Promise.resolve(false), // Don't expose execute function
    }));
  }

  async resetMigrationState(): Promise<void> {
    this.migrationState = {
      version: '1.0.0',
      completedMigrations: [],
      pendingMigrations: this.migrations.map(m => m.id),
      lastMigrationDate: Date.now(),
    };
    
    await this.saveMigrationState();
    console.log('Migration state reset');
  }
}

export const migrationUtils = new MigrationUtils();