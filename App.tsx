import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { analyticsService } from './src/services/analyticsService';

export default function App() {
  useEffect(() => {
    const appStartTime = Date.now();
    
    // Log app_open event
    // Assume cold start for now (could be enhanced with AppState detection)
    const launchTime = Date.now() - appStartTime;
    analyticsService.logAppOpen(true, launchTime);
    
    console.log('🚀 GameLauncher app initialized');
  }, []);

  return (
    <ErrorBoundary>
      <AppNavigator />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}
