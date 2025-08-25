import { Game } from '../types';

// Define event types as per PRD requirements
export type AnalyticsEventType = 'app_open' | 'catalog_loaded' | 'game_opened' | 'game_error';

// Base event structure with timestamps and metadata
export interface BaseEvent {
  event: AnalyticsEventType;
  timestamp: number;
  session_id: string;
  user_agent?: string;
  app_version: string;
}

// Specific event interfaces
export interface AppOpenEvent extends BaseEvent {
  event: 'app_open';
  cold_start: boolean;
  launch_time_ms?: number;
}

export interface CatalogLoadedEvent extends BaseEvent {
  event: 'catalog_loaded';
  games_count: number;
  load_time_ms: number;
  from_cache: boolean;
  network_status: 'online' | 'offline';
}

export interface GameOpenedEvent extends BaseEvent {
  event: 'game_opened';
  game_id: string;
  game_title: string;
  game_url: string;
  orientation_changed: boolean;
}

export interface GameErrorEvent extends BaseEvent {
  event: 'game_error';
  game_id: string;
  game_title: string;
  game_url: string;
  error_type: 'network' | 'timeout' | 'webview' | 'unknown';
  error_message: string;
  retry_count?: number;
}

export type AnalyticsEvent = AppOpenEvent | CatalogLoadedEvent | GameOpenedEvent | GameErrorEvent;

class AnalyticsService {
  private sessionId: string;
  private appVersion: string;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.appVersion = '1.0.0'; // Should match package.json version
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createBaseEvent(eventType: AnalyticsEventType): BaseEvent {
    return {
      event: eventType,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_agent: navigator?.userAgent,
      app_version: this.appVersion,
    };
  }

  /**
   * Log app_open event when the application starts
   */
  logAppOpen(coldStart: boolean, launchTimeMs?: number): void {
    const event: AppOpenEvent = {
      ...this.createBaseEvent('app_open'),
      cold_start: coldStart,
      launch_time_ms: launchTimeMs,
    };

    this.trackEvent(event);
  }

  /**
   * Log catalog_loaded event when games list is successfully loaded
   */
  logCatalogLoaded(
    gamesCount: number,
    loadTimeMs: number,
    fromCache: boolean,
    networkStatus: 'online' | 'offline'
  ): void {
    const event: CatalogLoadedEvent = {
      ...this.createBaseEvent('catalog_loaded'),
      games_count: gamesCount,
      load_time_ms: loadTimeMs,
      from_cache: fromCache,
      network_status: networkStatus,
    };

    this.trackEvent(event);
  }

  /**
   * Log game_opened event when a game starts loading in WebView
   */
  logGameOpened(game: Game, orientationChanged: boolean = true): void {
    const event: GameOpenedEvent = {
      ...this.createBaseEvent('game_opened'),
      game_id: game.id,
      game_title: game.title,
      game_url: game.url,
      orientation_changed: orientationChanged,
    };

    this.trackEvent(event);
  }

  /**
   * Log game_error event when a game fails to load
   */
  logGameError(
    game: Game,
    errorType: GameErrorEvent['error_type'],
    errorMessage: string,
    retryCount?: number
  ): void {
    const event: GameErrorEvent = {
      ...this.createBaseEvent('game_error'),
      game_id: game.id,
      game_title: game.title,
      game_url: game.url,
      error_type: errorType,
      error_message: errorMessage,
      retry_count: retryCount,
    };

    this.trackEvent(event);
  }

  /**
   * Core event tracking method
   */
  private trackEvent(event: AnalyticsEvent): void {
    // Store event locally
    this.events.push(event);

    // Console logging for development
    this.logToConsole(event);

    // In production, you would send this to your analytics backend
    // Example: this.sendToAnalytics(event);
    
    // For now, we'll just store locally and log to console
    this.persistEvents();
  }

  /**
   * Log event to console with formatted output
   */
  private logToConsole(event: AnalyticsEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const eventData = { ...event };
    delete (eventData as any).timestamp;
    delete (eventData as any).session_id;
    delete (eventData as any).user_agent;

    console.group(`📊 Analytics Event: ${event.event}`);
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`🔑 Session: ${event.session_id.split('_')[2]}`); // Short session ID
    console.log(`📱 Version: ${event.app_version}`);
    
    // Log event-specific data
    switch (event.event) {
      case 'app_open':
        console.log(`🚀 Cold Start: ${event.cold_start}`);
        if (event.launch_time_ms) {
          console.log(`⚡ Launch Time: ${event.launch_time_ms}ms`);
        }
        break;
        
      case 'catalog_loaded':
        console.log(`🎮 Games Count: ${event.games_count}`);
        console.log(`⚡ Load Time: ${event.load_time_ms}ms`);
        console.log(`💾 From Cache: ${event.from_cache}`);
        console.log(`🌐 Network: ${event.network_status}`);
        break;
        
      case 'game_opened':
        console.log(`🎯 Game: ${event.game_title} (${event.game_id})`);
        console.log(`🔄 Orientation Changed: ${event.orientation_changed}`);
        break;
        
      case 'game_error':
        console.log(`❌ Game: ${event.game_title} (${event.game_id})`);
        console.log(`🚫 Error Type: ${event.error_type}`);
        console.log(`💬 Message: ${event.error_message}`);
        if (event.retry_count !== undefined) {
          console.log(`🔄 Retry Count: ${event.retry_count}`);
        }
        break;
    }
    console.groupEnd();
  }

  /**
   * Persist events to local storage (for development/debugging)
   */
  private persistEvents(): void {
    try {
      // Keep only last 100 events to prevent memory issues
      const recentEvents = this.events.slice(-100);
      this.events = recentEvents;
      
      // In a real app, you might want to persist to AsyncStorage
      // For now, just keep in memory
    } catch (error) {
      console.error('Failed to persist analytics events:', error);
    }
  }

  /**
   * Get current session analytics data (for debugging)
   */
  getSessionData(): {
    sessionId: string;
    eventCount: number;
    events: AnalyticsEvent[];
  } {
    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      events: [...this.events],
    };
  }

  /**
   * Reset session (useful for testing)
   */
  resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.events = [];
    console.log('🔄 Analytics session reset');
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();