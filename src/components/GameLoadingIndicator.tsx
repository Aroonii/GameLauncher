import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  gameTitle: string;
  progress: number; // 0 to 1
  isVisible: boolean;
}

export const GameLoadingIndicator: React.FC<Props> = ({ 
  gameTitle, 
  progress, 
  isVisible 
}) => {
  if (!isVisible) return null;

  const progressPercentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.95)', 'rgba(118, 75, 162, 0.95)']}
        style={styles.backdrop}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.gameIcon}>🎮</Text>
        </View>
        <Text style={styles.title}>Loading {gameTitle}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>{progressPercentage}%</Text>
        </View>
        
        <ActivityIndicator 
          size="large" 
          color="#fff" 
          style={styles.spinner}
        />
        
        <Text style={styles.subtitle}>
          {progress < 0.1 ? 'Connecting to game...' : 
           progress < 0.5 ? 'Loading game assets...' :
           progress < 0.9 ? 'Almost ready...' :
           'Starting game...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 300,
  },
  iconContainer: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  gameIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '700',
  },
  spinner: {
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
});