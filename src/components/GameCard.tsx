import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EnhancedGame } from '../types';
import { categoryUtils } from '../utils/categoryUtils';

interface GameCardProps {
  game: EnhancedGame;
  onPress: () => void;
  onFavoriteToggle?: (game: EnhancedGame) => void;
  showFavorite?: boolean;
  showPlayCount?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  onPress, 
  onFavoriteToggle,
  showFavorite = true 
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

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

  // Safe text rendering helper
  const safeText = (text: any, fallback: string = ''): string => {
    if (text === null || text === undefined) return fallback;
    return String(text);
  };

  // Get image source for game
  const getImageSource = (title: string) => {
    switch (title) {
      case 'Tetris': return require('../../logos/tetris.png');
      case 'HexGL Racing': return require('../../logos/hexgl.jpg');
      case '2048': return require('../../logos/2048.avif');
      case 'Pac-Man': return require('../../logos/pacman.jpg');
      case 'Snake Game': return require('../../logos/snake.jpg');
      case 'Chess': return { uri: game.image };
      case 'Solitaire': return require('../../logos/solitaire.png');
      case 'Hextris': return require('../../logos/hextris.png');
      case 'Slither.io': return require('../../logos/slither.jpg');
      default: return { uri: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="${primaryColor}"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${safeText(game.title, 'GAME').toUpperCase()}</text></svg>`)}` };
    }
  };

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

  const handleFavoritePress = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(game);
    }
  };

  const category = categoryUtils.getCategory(game.category);
  const primaryColor = category.color || '#3498db';
  const secondaryColor = (category.color || '#3498db') + 'DD';
  
  // Dynamic styling based on category
  const dynamicTouchableStyle = {
    ...styles.touchable,
    borderTopColor: primaryColor,
    borderTopWidth: 3,
  };
  
  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={dynamicTouchableStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Play ${safeText(game.title, 'game')}`}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={getImageSource(game.title)}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: primaryColor + '20' }]}>
            <Text style={[styles.categoryText, { color: primaryColor }]}>
              <Text>{safeText(category.icon, '🎮')}</Text>
              <Text> </Text>
              <Text>{safeText(category.title, 'Game')}</Text>
            </Text>
          </View>

          {/* Favorite Star */}
          {showFavorite && onFavoriteToggle && (
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                game.isFavorite && styles.favoriteButtonActive
              ]}
              onPress={handleFavoritePress}
              accessibilityRole="button"
              accessibilityLabel={game.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Text style={[
                styles.favoriteIcon,
                game.isFavorite && styles.favoriteIconActive
              ]}>
                <Text>{game.isFavorite ? '★' : '☆'}</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={1}>
            <Text>{safeText(game.title, 'Untitled Game')}</Text>
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            <Text>{safeText(game.description, 'No description available')}</Text>
          </Text>
          
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.playButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.playButtonText}>
              <Text>▶ Play Now</Text>
            </Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    maxWidth: '50%',
  },
  touchable: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    marginBottom: 2,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  favoriteButtonActive: {
    backgroundColor: '#FFD700',
  },
  favoriteIcon: {
    fontSize: 16,
    color: '#ccc',
  },
  favoriteIconActive: {
    color: '#FFF',
  },
  contentContainer: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
    marginBottom: 14,
  },
  playButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  gameEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  gameTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});