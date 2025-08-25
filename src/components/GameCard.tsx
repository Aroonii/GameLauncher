import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const getCategoryColor = (category?: string): [string, string] => {
    switch (category) {
      case 'Puzzle': return ['#8e44ad', '#9b59b6'];
      case 'Racing': return ['#e74c3c', '#c0392b'];
      case 'Arcade': return ['#f39c12', '#e67e22'];
      case 'Adventure': return ['#27ae60', '#2ecc71'];
      default: return ['#3498db', '#2980b9'];
    }
  };

  const [primaryColor, secondaryColor] = getCategoryColor(game.category);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.touchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: game.image }} 
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{game.category}</Text>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {game.description}
          </Text>
          
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            style={styles.playButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.playButtonText}>▶ Play Now</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    maxWidth: '48%', // Two columns with some margin
  },
  touchable: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
    marginBottom: 12,
  },
  playButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});