import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Switch,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConsentLevel } from '../services/privacyService';

interface ConsentDialogProps {
  visible: boolean;
  onConsentGiven: (level: ConsentLevel) => void;
  onClose?: () => void;
}

interface ConsentOption {
  id: ConsentLevel;
  title: string;
  description: string;
  features: string[];
  required?: boolean;
}

const CONSENT_OPTIONS: ConsentOption[] = [
  {
    id: 'essential',
    title: 'Essential Only',
    description: 'Only essential features needed for the app to function properly.',
    features: [
      'Game loading and caching',
      'Basic app functionality',
      'Error handling',
      'Essential data storage',
    ],
    required: true,
  },
  {
    id: 'analytics',
    title: 'Analytics + Essential',
    description: 'Essential features plus anonymous usage analytics to help us improve the app.',
    features: [
      'All essential features',
      'Anonymous usage statistics',
      'Performance monitoring',
      'Crash reporting',
    ],
  },
  {
    id: 'all',
    title: 'All Features',
    description: 'Full app experience with all personalization and convenience features.',
    features: [
      'All analytics features',
      'Game favorites and preferences',
      'Enhanced caching and prefetching',
      'Personalized recommendations',
    ],
  },
];

export const ConsentDialog: React.FC<ConsentDialogProps> = ({ 
  visible, 
  onConsentGiven, 
  onClose 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<ConsentLevel>('essential');
  const [showDetails, setShowDetails] = useState(false);

  const handleConfirm = () => {
    onConsentGiven(selectedLevel);
  };

  const getSelectedOption = () => {
    return CONSENT_OPTIONS.find(option => option.id === selectedLevel) || CONSENT_OPTIONS[0];
  };

  const renderConsentOption = (option: ConsentOption) => {
    const isSelected = selectedLevel === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionContainer,
          isSelected && styles.selectedOption,
        ]}
        onPress={() => setSelectedLevel(option.id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${option.title}: ${option.description}`}
      >
        <View style={styles.optionHeader}>
          <View style={[
            styles.radioButton,
            isSelected && styles.radioButtonSelected,
          ]}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, isSelected && styles.selectedText]}>
              {option.title}
            </Text>
            <Text style={[styles.optionDescription, isSelected && styles.selectedText]}>
              {option.description}
            </Text>
          </View>
        </View>
        
        {showDetails && (
          <View style={styles.featuresList}>
            {option.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderQuickToggle = () => {
    const selectedOption = getSelectedOption();
    
    return (
      <View style={styles.quickToggleContainer}>
        <Text style={styles.quickToggleTitle}>Quick Settings</Text>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Analytics & Performance</Text>
          <Switch
            value={selectedLevel === 'analytics' || selectedLevel === 'all'}
            onValueChange={(enabled) => {
              if (enabled && selectedLevel === 'essential') {
                setSelectedLevel('analytics');
              } else if (!enabled && (selectedLevel === 'analytics' || selectedLevel === 'all')) {
                setSelectedLevel('essential');
              }
            }}
            trackColor={{ false: '#767577', true: '#667eea' }}
            thumbColor="#fff"
            accessibilityLabel="Toggle analytics and performance tracking"
          />
        </View>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Full Personalization</Text>
          <Switch
            value={selectedLevel === 'all'}
            onValueChange={(enabled) => {
              setSelectedLevel(enabled ? 'all' : 'essential');
            }}
            trackColor={{ false: '#767577', true: '#667eea' }}
            thumbColor="#fff"
            accessibilityLabel="Toggle full personalization features"
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Privacy & Data Usage</Text>
          <Text style={styles.headerSubtitle}>
            Choose how GameLauncher can use your data
          </Text>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
            <Text style={styles.sectionText}>
              We respect your privacy and want to be transparent about how we handle your data. 
              You can change these settings anytime in the app settings.
            </Text>
          </View>

          {renderQuickToggle()}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detailed Options</Text>
              <TouchableOpacity
                onPress={() => setShowDetails(!showDetails)}
                style={styles.detailsToggle}
                accessibilityLabel={`${showDetails ? 'Hide' : 'Show'} detailed feature breakdown`}
              >
                <Text style={styles.detailsToggleText}>
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {CONSENT_OPTIONS.map(renderConsentOption)}
          </View>

          <View style={styles.section}>
            <Text style={styles.currentSelectionTitle}>Current Selection</Text>
            <View style={styles.currentSelection}>
              <Text style={styles.currentSelectionLevel}>{getSelectedOption().title}</Text>
              <Text style={styles.currentSelectionDescription}>
                {getSelectedOption().description}
              </Text>
            </View>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By continuing, you agree to our data handling practices. 
              All data is processed securely and you can withdraw consent at any time.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel={`Confirm privacy settings: ${getSelectedOption().title}`}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.buttonGradient}
            >
              <Text style={styles.confirmButtonText}>
                Continue with {getSelectedOption().title}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Decide later, continue with essential features only"
            >
              <Text style={styles.laterButtonText}>Decide Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#5a6c7d',
    lineHeight: 20,
  },
  detailsToggle: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  quickToggleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#5a6c7d',
    flex: 1,
    marginRight: 16,
  },
  optionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#667eea',
    backgroundColor: '#f7f8ff',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d9e6',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#667eea',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#667eea',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#5a6c7d',
    lineHeight: 18,
  },
  selectedText: {
    color: '#667eea',
  },
  featuresList: {
    marginTop: 12,
    paddingLeft: 32,
  },
  featureItem: {
    fontSize: 12,
    color: '#7a8a9a',
    marginBottom: 4,
    lineHeight: 16,
  },
  currentSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  currentSelection: {
    backgroundColor: '#e8f0fe',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  currentSelectionLevel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  currentSelectionDescription: {
    fontSize: 14,
    color: '#5a6c7d',
    lineHeight: 18,
  },
  legalSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  legalText: {
    fontSize: 12,
    color: '#7a8a9a',
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    backgroundColor: '#fff',
  },
  confirmButton: {
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    color: '#7a8a9a',
    fontWeight: '600',
  },
});