import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isWifi: boolean;
  isCellular: boolean;
  isInternetReachable: boolean;
  connectionType: string;
}

type NetworkChangeListener = (state: NetworkState) => void;

class NetworkService {
  private listeners: NetworkChangeListener[] = [];
  private currentState: NetworkState | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.currentState = this.mapNetInfoState(netInfo);
      
      // Set up network change listener
      NetInfo.addEventListener((state) => {
        const mappedState = this.mapNetInfoState(state);
        this.currentState = mappedState;
        this.notifyListeners(mappedState);
      });

      this.initialized = true;
      console.log('Network service initialized');
    } catch (error) {
      console.error('Error initializing network service:', error);
      this.initialized = true; // Continue without network monitoring
    }
  }

  private mapNetInfoState(netInfo: any): NetworkState {
    return {
      isConnected: netInfo.isConnected ?? false,
      isWifi: netInfo.type === 'wifi' && netInfo.isConnected,
      isCellular: netInfo.type === 'cellular' && netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable ?? false,
      connectionType: netInfo.type || 'unknown',
    };
  }

  getNetworkState(): NetworkState {
    if (!this.initialized) {
      console.warn('Network service not initialized');
      return {
        isConnected: false,
        isWifi: false,
        isCellular: false,
        isInternetReachable: false,
        connectionType: 'unknown',
      };
    }

    return this.currentState || {
      isConnected: false,
      isWifi: false,
      isCellular: false,
      isInternetReachable: false,
      connectionType: 'unknown',
    };
  }

  isWifiConnected(): boolean {
    return this.getNetworkState().isWifi;
  }

  isCellularConnected(): boolean {
    return this.getNetworkState().isCellular;
  }

  isOnline(): boolean {
    return this.getNetworkState().isConnected;
  }

  isInternetReachable(): boolean {
    return this.getNetworkState().isInternetReachable;
  }

  getConnectionType(): string {
    return this.getNetworkState().connectionType;
  }

  // Check if we should prefetch based on connection type and user preferences
  shouldPrefetchContent(): boolean {
    const state = this.getNetworkState();
    
    // Always allow prefetch on WiFi
    if (state.isWifi) {
      return true;
    }
    
    // For cellular, this would be controlled by user preferences
    // For now, default to false for cellular to save data
    return false;
  }

  // Check network conditions for high-bandwidth operations
  isHighBandwidthConnection(): boolean {
    const state = this.getNetworkState();
    
    // WiFi is generally considered high bandwidth
    if (state.isWifi) {
      return true;
    }
    
    // For cellular, we could check specific type (4G, 5G, etc.)
    // For now, default to false to be conservative
    return false;
  }

  onNetworkChange(listener: NetworkChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in network change listener:', error);
      }
    });
  }

  // Utility methods for network-aware operations
  async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.onNetworkChange((state) => {
        if (state.isConnected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  async checkInternetConnectivity(): Promise<boolean> {
    try {
      // Refresh network info to get latest state
      const netInfo = await NetInfo.refresh();
      return (netInfo.isConnected ?? false) && (netInfo.isInternetReachable ?? false);
    } catch (error) {
      console.error('Error checking internet connectivity:', error);
      return false;
    }
  }

  // Network performance estimation (basic)
  getEstimatedBandwidth(): 'low' | 'medium' | 'high' | 'unknown' {
    const state = this.getNetworkState();
    
    if (state.isWifi) {
      return 'high';
    } else if (state.isCellular) {
      return 'medium'; // Could be more sophisticated based on cellular type
    } else if (state.isConnected) {
      return 'low';
    }
    
    return 'unknown';
  }

  // Data usage awareness
  isMeteredConnection(): boolean {
    const state = this.getNetworkState();
    
    // Cellular connections are typically metered
    if (state.isCellular) {
      return true;
    }
    
    // WiFi could be metered but we default to false
    // In a real app, this could be configurable by user
    return false;
  }
}

export const networkService = new NetworkService();