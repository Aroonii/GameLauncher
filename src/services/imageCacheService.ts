import { EnhancedGame } from '../types';
import { networkService } from './networkService';
import { configService } from './configService';
import { privacyService } from './privacyService';
import { analyticsService } from './analyticsService';
import { storageService } from './storageService';

// Image cache storage keys
const IMAGE_CACHE_METADATA_KEY = '@image_cache_metadata';
const IMAGE_CACHE_SIZE_KEY = '@image_cache_size';
const IMAGE_CACHE_LAST_CLEANUP_KEY = '@image_cache_last_cleanup';

// Cache configuration
const DEFAULT_MAX_CACHE_SIZE_MB = 50;
const CACHE_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENT_DOWNLOADS = 3;
const DOWNLOAD_TIMEOUT_MS = 10000; // 10 seconds
const PREFETCH_BATCH_SIZE = 5;

export interface CachedImage {
  url: string;
  localPath: string;
  size: number;
  lastAccessed: number;
  downloadTime: number;
  etag?: string;
  expiresAt?: number;
}

export interface CacheMetadata {
  totalSize: number;
  totalImages: number;
  lastCleanup: number;
  version: string;
}

export interface PrefetchJob {
  gameId: string;
  imageUrl: string;
  priority: number; // 1 = highest, 5 = lowest
  addedAt: number;
}

type PrefetchProgressCallback = (completed: number, total: number, imageUrl: string) => void;

class ImageCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private prefetchQueue: PrefetchJob[] = [];
  private activeDownloads = new Set<string>();
  private metadata: CacheMetadata | null = null;
  private initialized = false;
  private progressCallback: PrefetchProgressCallback | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize network service first
      await networkService.initialize();
      
      // Load cache metadata
      await this.loadCacheMetadata();
      
      // Load cached image index
      await this.loadCacheIndex();
      
      // Schedule periodic cleanup
      this.schedulePeriodicCleanup();
      
      this.initialized = true;
      console.log(`Image cache initialized with ${this.cache.size} cached images`);
    } catch (error) {
      console.error('Error initializing image cache service:', error);
      this.initialized = true; // Continue without cache
    }
  }

  private async loadCacheMetadata(): Promise<void> {
    try {
      const metadataStr = await storageService.getItem(IMAGE_CACHE_METADATA_KEY);
      if (metadataStr) {
        this.metadata = JSON.parse(metadataStr) as CacheMetadata;
      } else {
        this.metadata = {
          totalSize: 0,
          totalImages: 0,
          lastCleanup: Date.now(),
          version: '1.0.0',
        };
      }
    } catch (error) {
      console.error('Error loading cache metadata:', error);
      this.metadata = {
        totalSize: 0,
        totalImages: 0,
        lastCleanup: Date.now(),
        version: '1.0.0',
      };
    }
  }

  private async loadCacheIndex(): Promise<void> {
    // In a real implementation, we would load the cache index from AsyncStorage
    // For this demo, we'll start with an empty cache
    // The cache index would contain mappings of URLs to local file paths
    
    console.log('Cache index loaded (placeholder implementation)');
  }

  private async saveCacheMetadata(): Promise<void> {
    try {
      if (this.metadata) {
        await storageService.setItem(IMAGE_CACHE_METADATA_KEY, JSON.stringify(this.metadata));
      }
    } catch (error) {
      console.error('Error saving cache metadata:', error);
    }
  }

  // LRU Cache Management
  private updateAccessTime(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      cached.lastAccessed = Date.now();
      this.cache.set(url, cached);
    }
  }

  private async evictLRUImages(targetSize: number): Promise<void> {
    const sortedByAccess = Array.from(this.cache.values())
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let currentSize = this.metadata?.totalSize || 0;
    const evictedUrls: string[] = [];

    for (const cached of sortedByAccess) {
      if (currentSize <= targetSize) break;
      
      this.cache.delete(cached.url);
      currentSize -= cached.size;
      evictedUrls.push(cached.url);
      
      // In a real implementation, we would delete the local file
      console.log(`Evicted cached image: ${cached.url}`);
    }

    if (evictedUrls.length > 0) {
      await this.updateCacheMetadata();
      console.log(`Evicted ${evictedUrls.length} images to free space`);
    }
  }

  private async updateCacheMetadata(): Promise<void> {
    if (this.metadata) {
      this.metadata.totalImages = this.cache.size;
      this.metadata.totalSize = Array.from(this.cache.values())
        .reduce((total, cached) => total + cached.size, 0);
      
      await this.saveCacheMetadata();
    }
  }

  // Image Download and Caching
  private async downloadImage(url: string, priority: number = 3): Promise<CachedImage | null> {
    if (this.activeDownloads.has(url)) {
      console.log(`Download already in progress for: ${url}`);
      return null;
    }

    if (this.activeDownloads.size >= MAX_CONCURRENT_DOWNLOADS) {
      console.log('Max concurrent downloads reached, queuing image');
      return null;
    }

    this.activeDownloads.add(url);
    const startTime = Date.now();

    try {
      console.log(`Starting image download: ${url}`);
      
      // In a real implementation, we would:
      // 1. Download the image using fetch with timeout
      // 2. Save it to local file system
      // 3. Get the actual file size
      
      // For demo purposes, we'll simulate the download
      await this.delay(Math.random() * 2000 + 500); // Simulate network delay
      
      const mockSize = Math.floor(Math.random() * 500000) + 50000; // 50KB - 550KB
      const mockLocalPath = `cache/${this.generateCacheKey(url)}.jpg`;
      
      const cachedImage: CachedImage = {
        url,
        localPath: mockLocalPath,
        size: mockSize,
        lastAccessed: Date.now(),
        downloadTime: Date.now() - startTime,
      };

      // Check if we need to evict images to make space
      const maxCacheSize = configService.getImageCacheSize() * 1024 * 1024; // Convert MB to bytes
      const currentSize = this.metadata?.totalSize || 0;
      
      if (currentSize + mockSize > maxCacheSize) {
        await this.evictLRUImages(maxCacheSize - mockSize);
      }

      // Add to cache
      this.cache.set(url, cachedImage);
      await this.updateCacheMetadata();

      console.log(`Image cached successfully: ${url} (${mockSize} bytes)`);
      return cachedImage;

    } catch (error) {
      console.error(`Error downloading image ${url}:`, error);
      return null;
    } finally {
      this.activeDownloads.delete(url);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateCacheKey(url: string): string {
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Public API
  async getCachedImagePath(url: string): Promise<string | null> {
    if (!this.initialized) {
      return null;
    }

    const cached = this.cache.get(url);
    if (cached) {
      this.updateAccessTime(url);
      return cached.localPath;
    }

    return null;
  }

  async cacheImage(url: string, priority: number = 3): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    if (this.cache.has(url)) {
      this.updateAccessTime(url);
      return true;
    }

    const cached = await this.downloadImage(url, priority);
    return cached !== null;
  }

  async prefetchImages(games: EnhancedGame[], options: {
    prioritizeFavorites?: boolean;
    prioritizeRecent?: boolean;
    wifiOnly?: boolean;
    maxImages?: number;
  } = {}): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const {
      prioritizeFavorites = true,
      prioritizeRecent = true,
      wifiOnly = true,
      maxImages = 20,
    } = options;

    // Check network conditions
    if (wifiOnly && !networkService.isWifiConnected()) {
      console.log('Prefetch skipped: WiFi only mode and not on WiFi');
      return;
    }

    if (!networkService.isOnline()) {
      console.log('Prefetch skipped: offline');
      return;
    }

    // Check privacy settings
    if (!privacyService.isCachingAllowed()) {
      console.log('Prefetch skipped: caching not allowed by privacy settings');
      return;
    }

    // Create prioritized prefetch queue
    const prefetchJobs: PrefetchJob[] = [];

    for (const game of games) {
      // Skip if already cached
      if (this.cache.has(game.image)) {
        continue;
      }

      let priority = 3; // Default priority

      // Higher priority for favorites
      if (prioritizeFavorites && game.isFavorite) {
        priority = 1;
      }
      // Higher priority for recently played
      else if (prioritizeRecent && game.lastPlayed && 
               (Date.now() - game.lastPlayed) < (7 * 24 * 60 * 60 * 1000)) {
        priority = 2;
      }
      // Higher priority for frequently played
      else if (game.playCount && game.playCount > 2) {
        priority = 2;
      }

      prefetchJobs.push({
        gameId: game.id,
        imageUrl: game.image,
        priority,
        addedAt: Date.now(),
      });
    }

    // Sort by priority and limit
    prefetchJobs.sort((a, b) => a.priority - b.priority);
    const jobsToProcess = prefetchJobs.slice(0, maxImages);

    if (jobsToProcess.length === 0) {
      console.log('No images to prefetch');
      return;
    }

    console.log(`Starting prefetch of ${jobsToProcess.length} images`);
    
    // Add to queue
    this.prefetchQueue = [...this.prefetchQueue, ...jobsToProcess];
    
    // Start processing queue
    await this.processPrefetchQueue();
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetchQueue.length === 0) {
      return;
    }

    let completed = 0;
    const total = this.prefetchQueue.length;
    
    // Process in batches to avoid overwhelming the system
    while (this.prefetchQueue.length > 0) {
      const batch = this.prefetchQueue.splice(0, PREFETCH_BATCH_SIZE);
      
      const downloadPromises = batch.map(async (job) => {
        try {
          const success = await this.cacheImage(job.imageUrl, job.priority);
          if (success) {
            completed++;
            this.progressCallback?.(completed, total, job.imageUrl);
          }
          return success;
        } catch (error) {
          console.error(`Error prefetching ${job.imageUrl}:`, error);
          return false;
        }
      });

      await Promise.all(downloadPromises);
      
      // Small delay between batches
      if (this.prefetchQueue.length > 0) {
        await this.delay(1000);
      }
    }

    // Log analytics
    if (configService.isFeatureEnabled('analytics') && privacyService.isAnalyticsAllowed()) {
      analyticsService.logEvent('thumbnail_prefetch_bytes', {
        images_prefetched: completed,
        total_requested: total,
        cache_hit_rate: this.getCacheHitRate(),
        network_type: networkService.getConnectionType(),
      });
    }

    console.log(`Prefetch completed: ${completed}/${total} images cached`);
  }

  // Cache Statistics and Management
  getCacheStats(): {
    totalImages: number;
    totalSizeMB: number;
    maxSizeMB: number;
    hitRate: number;
    oldestImage: number | null;
  } {
    const totalSizeMB = (this.metadata?.totalSize || 0) / (1024 * 1024);
    const maxSizeMB = configService.getImageCacheSize();
    
    let oldestAccess: number | null = null;
    for (const cached of this.cache.values()) {
      if (!oldestAccess || cached.lastAccessed < oldestAccess) {
        oldestAccess = cached.lastAccessed;
      }
    }

    return {
      totalImages: this.cache.size,
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      maxSizeMB,
      hitRate: this.getCacheHitRate(),
      oldestImage: oldestAccess,
    };
  }

  private getCacheHitRate(): number {
    // This would be calculated based on cache hits vs misses over time
    // For demo purposes, return a reasonable value
    return 0.75;
  }

  async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      this.prefetchQueue = [];
      this.activeDownloads.clear();
      
      this.metadata = {
        totalSize: 0,
        totalImages: 0,
        lastCleanup: Date.now(),
        version: '1.0.0',
      };
      
      await this.saveCacheMetadata();
      console.log('Image cache cleared');
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  async performCleanup(): Promise<void> {
    if (!this.metadata) return;

    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const expiredUrls: string[] = [];

    // Remove expired images
    for (const [url, cached] of this.cache.entries()) {
      if (now - cached.lastAccessed > maxAge) {
        this.cache.delete(url);
        expiredUrls.push(url);
      }
    }

    // Update metadata
    this.metadata.lastCleanup = now;
    await this.updateCacheMetadata();

    if (expiredUrls.length > 0) {
      console.log(`Cleaned up ${expiredUrls.length} expired cached images`);
    }
  }

  private schedulePeriodicCleanup(): void {
    setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('Error in periodic cache cleanup:', error);
      }
    }, CACHE_CLEANUP_INTERVAL_MS);
  }

  // Progress tracking
  onPrefetchProgress(callback: PrefetchProgressCallback): void {
    this.progressCallback = callback;
  }

  // Memory pressure handling
  async handleMemoryPressure(): Promise<void> {
    console.log('Handling memory pressure - reducing cache size');
    
    const currentMaxSize = configService.getImageCacheSize() * 1024 * 1024;
    const targetSize = currentMaxSize * 0.5; // Reduce to 50% of max size
    
    await this.evictLRUImages(targetSize);
  }
}

export const imageCacheService = new ImageCacheService();