import React from 'react';
import { Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { GameListScreen } from '../screens/GameListScreen';
import { GameViewScreen } from '../screens/GameViewScreen';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="GameList"
        screenOptions={{
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
                easing: Easing.out(Easing.poly(4)),
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 250,
                easing: Easing.in(Easing.poly(4)),
              },
            },
          },
        }}
      >
        <Stack.Screen
          name="GameList"
          component={GameListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GameView"
          component={GameViewScreen}
          options={{
            headerTintColor: '#007AFF',
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTitleStyle: {
              color: '#ffffff',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};