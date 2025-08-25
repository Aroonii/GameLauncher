import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Game } from '../types';

interface Props {
  game: Game;
  onRetry: () => void;
  onGoBack: () => void;
  onTryAlternative?: (alternativeGame: Game) => void;
  errorMessage?: string;
  suggestedGames?: Game[];
}

export const GameErrorScreen: React.FC<Props> = ({
  game,
  onRetry,
  onGoBack,
  onTryAlternative,
  errorMessage = 'Failed to load game',
  suggestedGames = []
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.errorContent}>
        <Text style={styles.errorIcon}>🎮</Text>
        <Text style={styles.errorTitle}>Oops! Game won't load</Text>
        <Text style={styles.gameTitle}>{game.title}</Text>
        <Text style={styles.errorMessage}>
          {errorMessage}. This might be due to a slow connection or the game being unavailable.
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={onRetry}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={onGoBack}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        
        {suggestedGames.length > 0 && onTryAlternative && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try these instead:</Text>
            {suggestedGames.slice(0, 2).map((suggestedGame) => (
              <TouchableOpacity
                key={suggestedGame.id}
                style={styles.suggestionButton}
                onPress={() => onTryAlternative(suggestedGame)}
              >
                <Text style={styles.suggestionText}>🎯 {suggestedGame.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 24,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});