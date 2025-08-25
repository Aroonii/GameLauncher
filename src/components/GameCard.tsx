import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnhancedGame } from '../types';

interface GameCardProps {
  game: EnhancedGame;
  onPress: () => void;
  onFavoriteToggle?: (game: EnhancedGame) => void;
  showFavorite?: boolean;
  showPlayCount?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  // Defensive checks
  if (!game) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.touchable} onPress={onPress}>
          <Text style={styles.title}>No game data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gameTitle = String(game.title || 'Unknown Game');
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.touchable} onPress={onPress}>
        <Text style={styles.title}>{gameTitle}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    maxWidth: '48%',
  },
  touchable: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  },
});