import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock expo-screen-orientation
jest.mock('expo-screen-orientation', () => ({
  OrientationLock: {
    PORTRAIT: 'PORTRAIT',
    LANDSCAPE: 'LANDSCAPE',
  },
  lockAsync: jest.fn(() => Promise.resolve()),
  unlockAsync: jest.fn(() => Promise.resolve()),
  addOrientationChangeListener: jest.fn(),
  removeOrientationChangeListener: jest.fn(),
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock React Native components and Animated API
jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(styles => styles),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  SectionList: 'SectionList',
  SafeAreaView: 'SafeAreaView',
  StatusBar: 'StatusBar',
  RefreshControl: 'RefreshControl',
  Modal: 'Modal',
  Animated: {
    View: 'Animated.View',
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({ outputRange: [0, 1] })),
    })),
    timing: jest.fn(() => ({
      start: jest.fn((callback) => {
        if (callback) callback();
      }),
    })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    parallel: jest.fn(() => ({
      start: jest.fn((callback) => {
        if (callback) callback();
      }),
    })),
    loop: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
  },
}));

// Global test timeout
jest.setTimeout(10000);