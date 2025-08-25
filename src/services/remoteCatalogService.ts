import { Game } from '../types';
import { storageService } from './storageService';
import { schemaValidator } from '../utils/schemaValidator';
import gamesData from '../data/games.json';

// Security configuration
const ALLOWED_PROTOCOLS = ['https:'];
const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Remote catalog metadata cache keys
const REMOTE_CATALOG_URL_KEY = '@remote_catalog_url';
const REMOTE_CATALOG_ETAG_KEY = '@remote_catalog_etag';
const REMOTE_CATALOG_LAST_FETCH_KEY = '@remote_catalog_last_fetch';

export interface RemoteCatalogConfig {
  url?: string;
  fallbackToBundled: boolean;
  validateSchema: boolean;
}

export interface RemoteCatalogResult {
  games: Game[];
  source: 'remote' | 'cached' | 'bundled';
  metadata: {
    fetchTime: number;
    fromCache: boolean;
    etag?: string;
    lastModified?: string;
  };
}

class RemoteCatalogService {
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Enforce HTTPS only
      if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        console.error('Remote catalog URL must use HTTPS');
        return false;
      }
      
      // Basic domain validation (could be extended with whitelist)
      if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
        console.error('Invalid hostname in catalog URL');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid catalog URL format:', error);
      return false;
    }
  }

  private async validateGameSchema(games: any[]): Promise<Game[] | null> {
    try {
      const validation = schemaValidator.validateCatalog(games);
      
      if (!validation.isValid) {
        console.error('Catalog schema validation failed:', validation.errors);
        return null;
      }

      return validation.sanitizedData as Game[];
    } catch (error) {
      console.error('Schema validation error:', error);
      return null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GameLauncher/1.0',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async fetchRemoteCatalogWithRetry(url: string, etag?: string): Promise<Game[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`Fetching remote catalog (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);
        
        const headers: Record<string, string> = {};
        if (etag) {
          headers['If-None-Match'] = etag;
        }
        
        const response = await this.fetchWithTimeout(url, { headers });
        
        // Handle 304 Not Modified
        if (response.status === 304) {
          console.log('Remote catalog not modified, using cached version');
          const cachedGames = await storageService.getCachedGames();
          if (cachedGames) {
            return cachedGames;
          }
          throw new Error('304 response but no cached games available');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        
        const rawGames = await response.json();
        
        // Validate and sanitize schema
        const validatedGames = await this.validateGameSchema(rawGames);
        if (!validatedGames) {
          throw new Error('Remote catalog failed schema validation');
        }
        
        // Store ETag and last fetch time for future requests
        const newEtag = response.headers.get('etag');
        if (newEtag) {
          await storageService.setItem(REMOTE_CATALOG_ETAG_KEY, newEtag);
        }
        
        await storageService.setItem(REMOTE_CATALOG_LAST_FETCH_KEY, Date.now().toString());
        
        console.log(`Successfully fetched and validated ${validatedGames.length} games from remote catalog`);
        return validatedGames;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
          await this.delay(RETRY_DELAY_MS);
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  async fetchCatalog(config: RemoteCatalogConfig): Promise<RemoteCatalogResult> {
    const startTime = Date.now();
    
    // If no URL provided, use bundled catalog
    if (!config.url) {
      console.log('No remote URL configured, using bundled catalog');
      const bundledGames = gamesData as Game[];
      
      return {
        games: bundledGames,
        source: 'bundled',
        metadata: {
          fetchTime: Date.now() - startTime,
          fromCache: false,
        },
      };
    }
    
    // Validate URL
    if (!this.isValidUrl(config.url)) {
      if (config.fallbackToBundled) {
        console.log('Invalid URL, falling back to bundled catalog');
        const bundledGames = gamesData as Game[];
        
        return {
          games: bundledGames,
          source: 'bundled',
          metadata: {
            fetchTime: Date.now() - startTime,
            fromCache: false,
          },
        };
      }
      throw new Error('Invalid remote catalog URL and fallback disabled');
    }
    
    try {
      // Try to get cached games first
      const cachedGames = await storageService.getCachedGames();
      const storedEtag = await storageService.getItem(REMOTE_CATALOG_ETAG_KEY);
      
      try {
        // Attempt to fetch from remote
        const remoteGames = await this.fetchRemoteCatalogWithRetry(config.url, storedEtag);
        
        // Cache the fetched games
        await storageService.cacheGames(remoteGames);
        
        return {
          games: remoteGames,
          source: 'remote',
          metadata: {
            fetchTime: Date.now() - startTime,
            fromCache: false,
            etag: storedEtag || undefined,
          },
        };
        
      } catch (remoteError) {
        console.error('Failed to fetch remote catalog:', remoteError);
        
        // Fall back to cached games if available
        if (cachedGames && cachedGames.length > 0) {
          console.log('Using cached games as fallback');
          return {
            games: cachedGames,
            source: 'cached',
            metadata: {
              fetchTime: Date.now() - startTime,
              fromCache: true,
            },
          };
        }
        
        // Fall back to bundled games if configured
        if (config.fallbackToBundled) {
          console.log('Using bundled games as final fallback');
          const bundledGames = gamesData as Game[];
          
          return {
            games: bundledGames,
            source: 'bundled',
            metadata: {
              fetchTime: Date.now() - startTime,
              fromCache: false,
            },
          };
        }
        
        // Re-throw error if no fallback available
        throw remoteError;
      }
      
    } catch (error) {
      console.error('Remote catalog service error:', error);
      
      if (config.fallbackToBundled) {
        console.log('Using bundled games due to error');
        const bundledGames = gamesData as Game[];
        
        return {
          games: bundledGames,
          source: 'bundled',
          metadata: {
            fetchTime: Date.now() - startTime,
            fromCache: false,
          },
        };
      }
      
      throw error;
    }
  }
  
  async clearRemoteCache(): Promise<void> {
    try {
      await Promise.all([
        storageService.removeItem(REMOTE_CATALOG_ETAG_KEY),
        storageService.removeItem(REMOTE_CATALOG_LAST_FETCH_KEY),
        storageService.clearCache(),
      ]);
      console.log('Remote catalog cache cleared');
    } catch (error) {
      console.error('Error clearing remote catalog cache:', error);
    }
  }
}

export const remoteCatalogService = new RemoteCatalogService();