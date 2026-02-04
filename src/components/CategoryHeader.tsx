import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameCategory } from '../utils/categoryUtils';

interface CategoryHeaderProps {
  category: GameCategory;
  gameCount: number;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onViewAll?: () => void;
  showViewAll?: boolean;
  accessibilityLabel?: string;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  category,
  gameCount,
  isExpanded = true,
  onToggleExpanded,
  onViewAll,
  showViewAll = false,
  accessibilityLabel,
}) => {
  const handleToggle = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.accentBar, { backgroundColor: category.color }]} />
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleToggle}
        disabled={!onToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || 
          `${category.title} category with ${gameCount} games. ${
            onToggleExpanded ? (isExpanded ? 'Tap to collapse' : 'Tap to expand') : ''
          }`
        }
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
            <Text style={[styles.categoryIcon, { color: category.color }]}>
              {category.icon}
            </Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {category.title}
            </Text>
            <Text style={styles.categoryInfo} numberOfLines={1}>
              {gameCount === 1 ? '1 game' : `${gameCount} games`}
              {category.description && ` • ${category.description}`}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {showViewAll && gameCount > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAll}
              accessibilityRole="button"
              accessibilityLabel={`View all ${gameCount} games in ${category.title} category`}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
          
          {onToggleExpanded && (
            <View style={styles.expandIcon}>
              <Text style={[
                styles.expandIconText,
                { transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }
              ]}>
                ▶
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {category.isSpecial && (
        <View style={[styles.specialBadge, { borderColor: category.color }]}>
          <Text style={[styles.specialBadgeText, { color: category.color }]}>
            {category.id === 'favorites' ? 'Personal' : 'Smart'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    position: 'relative',
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 0,
  },
  headerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  categoryInfo: {
    fontSize: 12,
    color: '#7a8a9a',
    lineHeight: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  expandIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIconText: {
    fontSize: 12,
    color: '#7a8a9a',
    fontWeight: '600',
  },
  specialBadge: {
    position: 'absolute',
    top: -4,
    right: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});