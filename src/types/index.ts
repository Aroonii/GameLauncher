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